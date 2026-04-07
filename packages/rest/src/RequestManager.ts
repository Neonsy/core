import { RateLimitManager } from './RateLimitManager.js';
import { FluxerAPIError, RateLimitError, HTTPError } from './errors/index.js';
import { APIErrorBody, RateLimitErrorBody } from '@fluxerjs/types';
import { buildFormData } from './utils/files.js';

export interface RequestOptions {
  body?: unknown | FormData;
  headers?: Record<string, string>;
  files?: Array<{
    name: string;
    data: Blob | ArrayBuffer | Uint8Array | Buffer;
    filename?: string;
  }>;
  auth?: boolean;
  /** Aborts the request when triggered (e.g. shutdown). Combined with the client timeout. */
  signal?: AbortSignal;
}

export interface RestOptions {
  api: string;
  version: string;
  authPrefix: 'Bot' | 'Bearer';
  timeout: number;
  retries: number;
  userAgent: string;
}

const ROUTE_HASH_CACHE_MAX = 1000;

function isAbortError(err: unknown): boolean {
  if (err instanceof Error && err.name === 'AbortError') return true;
  if (
    typeof DOMException !== 'undefined' &&
    err instanceof DOMException &&
    err.name === 'AbortError'
  ) {
    return true;
  }
  return false;
}

export class RequestManager {
  private token: string | null = null;
  private readonly options: RestOptions;
  private readonly rateLimiter = new RateLimitManager();
  private readonly routeHashCache = new Map<string, string>();

  constructor(options: Partial<RestOptions>) {
    this.options = {
      api: options.api ?? 'https://api.fluxer.app',
      version: options.version ?? '1',
      authPrefix: options.authPrefix ?? 'Bot',
      timeout: options.timeout ?? 15000,
      retries: options.retries ?? 3,
      userAgent: options.userAgent ?? 'fluxerjs',
    };
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  get baseUrl(): string {
    return `${this.options.api}/v${this.options.version}`;
  }

  /** Hash route for rate limit bucket (use path without ids for grouping). LRU via Map insertion order refresh on hit. */
  private getRouteHash(route: string): string {
    const cached = this.routeHashCache.get(route);
    if (cached !== undefined) {
      this.routeHashCache.delete(route);
      this.routeHashCache.set(route, cached);
      return cached;
    }
    const hash = route.replace(/\d{17,19}/g, ':id');
    if (this.routeHashCache.size >= ROUTE_HASH_CACHE_MAX) {
      const first = this.routeHashCache.keys().next().value;
      if (first !== undefined) this.routeHashCache.delete(first);
    }
    this.routeHashCache.set(route, hash);
    return hash;
  }

  private async waitForRateLimit(routeHash: string): Promise<void> {
    const wait = this.rateLimiter.getWaitTime(routeHash);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  }

  private buildHeaders(
    _route: string,
    options: RequestOptions,
    body: string | FormData | undefined,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': this.options.userAgent,
      ...options.headers,
    };
    if (options.auth !== false && this.token) {
      headers['Authorization'] = `${this.options.authPrefix} ${this.token}`;
    }
    if (body !== undefined && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  async request<T>(method: string, route: string, options: RequestOptions = {}): Promise<T> {
    const routeHash = this.getRouteHash(route);
    const url = route.startsWith('http') ? route : `${this.baseUrl}${route}`;

    await this.waitForRateLimit(routeHash);

    let body: string | FormData | undefined;
    if (options.body !== undefined) {
      if (options.body instanceof FormData) {
        body = options.body;
      } else if (
        options.files?.length &&
        typeof options.body === 'object' &&
        options.body !== null
      ) {
        body = buildFormData(options.body as Record<string, unknown>, options.files);
      } else {
        body = JSON.stringify(options.body);
      }
    }

    const headers = this.buildHeaders(route, options, body);

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.options.retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
      const userSignal = options.signal;
      const onUserAbort = (): void => {
        controller.abort();
      };
      if (userSignal) {
        if (userSignal.aborted) {
          clearTimeout(timeoutId);
          controller.abort();
        } else {
          userSignal.addEventListener('abort', onUserAbort);
        }
      }
      try {
        if (controller.signal.aborted) {
          const aborted = new Error('The operation was aborted');
          aborted.name = 'AbortError';
          throw aborted;
        }

        const response = await fetch(url, {
          method,
          headers,
          body,
          signal: controller.signal,
        });

        this.rateLimiter.updateFromHeaders(routeHash, response.headers);

        if (response.status === 429) {
          const data = (await response.json().catch(() => ({}))) as RateLimitErrorBody;
          const retryAfter =
            (data.retry_after ?? parseInt(response.headers.get('Retry-After') ?? '0', 10)) * 1000;
          this.rateLimiter.setBucket(routeHash, 1, 0, Date.now() + retryAfter);
          if (data.global) this.rateLimiter.setGlobalReset(Date.now() + retryAfter);
          throw new RateLimitError(
            {
              ...data,
              code: 'RATE_LIMITED',
              message: data.message ?? 'Rate limited',
              retry_after: data.retry_after ?? 0,
            },
            response.status,
          );
        }

        const contentType = (response.headers.get('Content-Type') ?? '').toLowerCase();

        if (!response.ok) {
          const text = await response.text();
          let parsed: APIErrorBody;
          try {
            parsed = JSON.parse(text) as APIErrorBody;
          } catch {
            throw new HTTPError(response.status, text);
          }
          throw new FluxerAPIError(parsed, response.status);
        }

        if (response.status === 204) return undefined as T;

        if (contentType.includes('application/json')) {
          try {
            return (await response.json()) as T;
          } catch {
            return undefined as T;
          }
        }

        const text = await response.text();
        if (text.length === 0) return undefined as T;
        return JSON.parse(text) as T;
      } catch (err) {
        if (isAbortError(err)) throw err;
        const wrapped = err instanceof Error ? err : new Error(String(err));
        lastError =
          attempt > 0
            ? new Error(`Retry ${attempt} failed: ${wrapped.message}`, {
                cause: wrapped,
              })
            : wrapped;
        if (err instanceof RateLimitError && attempt < this.options.retries) {
          const retryMs = err.retryAfter * 1000;
          if (Number.isFinite(retryMs)) {
            await new Promise((r) => setTimeout(r, retryMs));
            continue;
          }
        }
        if (err instanceof FluxerAPIError || err instanceof HTTPError) throw err;
        if (attempt < this.options.retries) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        throw lastError;
      } finally {
        clearTimeout(timeoutId);
        userSignal?.removeEventListener('abort', onUserAbort);
      }
    }
    throw lastError ?? new Error('Request failed');
  }
}
