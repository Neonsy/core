import { EventEmitter } from 'events';
import type { DiagnosticSource } from '@fluxerjs/diagnostics';
import { ErrorCodes, FluxerError } from '@fluxerjs/util';
import type { APIGatewayBotResponse, GatewayPresenceUpdateData } from '@fluxerjs/types';
import { WebSocketShard, type WebSocketConstructor } from './WebSocketShard.js';
import { getDefaultWebSocket } from './utils/getWebSocket.js';

export type { WebSocketConstructor };

const RETRY_INITIAL_MS = 1000;
const RETRY_MAX_MS = 45_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isGatewayBotResponse(value: unknown): value is APIGatewayBotResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { url?: unknown }).url === 'string' &&
    typeof (value as { shards?: unknown }).shards === 'number'
  );
}

/** Duck-type REST/HTTP errors that declare themselves non-retryable (e.g. 401/403). */
function isNonRetryableError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'isRetryable' in err &&
    (err as { isRetryable: unknown }).isRetryable === false
  );
}

async function retryUntil<T>(
  isAborted: () => boolean,
  attempt: () => Promise<T>,
  onError: (error: Error, attempt: number, retryInMs: number | null) => void,
): Promise<T | null> {
  let delayMs = RETRY_INITIAL_MS;
  let attemptNumber = 0;
  while (!isAborted()) {
    attemptNumber++;
    try {
      return await attempt();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      // Auth / client errors must fail login — do not spin forever.
      if (isNonRetryableError(err)) {
        onError(error, attemptNumber, null);
        throw error;
      }
      onError(error, attemptNumber, delayMs);
      await sleep(delayMs);
      delayMs = Math.min(RETRY_MAX_MS, Math.floor(delayMs * 1.5));
    }
  }
  return null;
}

export interface WebSocketManagerOptions {
  /** Optional structured diagnostic destination. */
  diagnostics?: DiagnosticSource;
  token: string;
  intents: number;
  rest: { get: (route: string) => Promise<unknown> };
  version?: string;
  presence?: GatewayPresenceUpdateData;
  shardIds?: number[];
  shardCount?: number;
  /** When `false`, shard debug events are not emitted. Default: `true`. */
  debug?: boolean;
  WebSocket?: WebSocketConstructor;
}

export class WebSocketManager extends EventEmitter {
  private readonly options: WebSocketManagerOptions;
  private readonly shards = new Map<number, WebSocketShard>();
  private gatewayUrl: string | null = null;
  private shardCount = 1;
  private aborted = false;

  constructor(options: WebSocketManagerOptions) {
    super();
    this.options = options;
  }

  async connect(): Promise<void> {
    const startedAt = Date.now();
    this.diagnostic('debug', 'connect.started', 'Gateway connection started');
    try {
      await this.executeConnect();
      this.diagnostic('info', 'connect.initialized', 'Gateway shards initialized', () => ({
        shardCount: this.shardCount,
        initializedShards: this.shards.size,
        durationMs: Math.max(0, Date.now() - startedAt),
      }));
    } catch (error) {
      this.diagnostic('error', 'connect.failed', 'Gateway connection failed', () => ({
        durationMs: Math.max(0, Date.now() - startedAt),
        error: diagnosticErrorMetadata(error, this.options.diagnostics),
      }));
      throw error;
    }
  }

  private async executeConnect(): Promise<void> {
    this.aborted = false;
    const emitManagerError = (
      stage: 'websocket' | 'gateway',
      error: Error,
      attempt: number,
      retryInMs: number | null,
    ): void => {
      this.emit('error', { shardId: -1, error });
      this.diagnostic(
        retryInMs === null ? 'error' : 'warn',
        'connect.attempt_failed',
        'Gateway connection attempt failed',
        () => ({
          stage,
          attempt,
          retryInMs,
          error: diagnosticErrorMetadata(error, this.options.diagnostics),
        }),
      );
    };
    const isAborted = (): boolean => this.aborted;

    let WS = this.options.WebSocket;
    if (!WS) {
      WS =
        (await retryUntil(isAborted, getDefaultWebSocket, (error, attempt, retryInMs) =>
          emitManagerError('websocket', error, attempt, retryInMs),
        )) ?? undefined;
      if (this.aborted) {
        throw new FluxerError('Connection aborted', { code: ErrorCodes.GatewayConnectionAborted });
      }
      if (!WS) {
        throw new FluxerError('Failed to load WebSocket', { code: ErrorCodes.WebSocketLoadFailed });
      }
    }

    const gateway = await retryUntil(
      isAborted,
      async () => {
        const raw: unknown = await this.options.rest.get('/gateway/bot');
        if (!isGatewayBotResponse(raw)) {
          throw Object.assign(new TypeError('Invalid /gateway/bot response'), {
            isRetryable: false,
          });
        }
        return raw;
      },
      (error, attempt, retryInMs) => emitManagerError('gateway', error, attempt, retryInMs),
    );

    if (this.aborted) {
      throw new FluxerError('Connection aborted', { code: ErrorCodes.GatewayConnectionAborted });
    }
    if (!gateway) {
      throw new FluxerError('Failed to fetch gateway', { code: ErrorCodes.GatewayFetchFailed });
    }

    this.gatewayUrl = gateway.url;
    this.shardCount = this.options.shardCount ?? gateway.shards;

    const ids = this.options.shardIds ?? [...Array(this.shardCount).keys()];
    const version = this.options.version ?? '1';

    for (const id of ids) {
      if (this.aborted) break;

      const shard = new WebSocketShard({
        url: gateway.url,
        token: this.options.token,
        intents: this.options.intents,
        presence: this.options.presence,
        shardId: id,
        numShards: this.shardCount,
        version,
        debug: this.options.debug,
        diagnostics: this.options.diagnostics,
        WebSocket: WS,
      });

      shard.on('ready', (data) => this.emit('ready', { shardId: id, data }));
      shard.on('resumed', () => this.emit('resumed', id));
      shard.on('dispatch', (payload) => this.emit('dispatch', { shardId: id, payload }));
      shard.on('close', (code) => this.emit('close', { shardId: id, code }));
      shard.on('error', (err) => this.emit('error', { shardId: id, error: err }));
      shard.on('debug', (msg) => this.emit('debug', msg));

      this.shards.set(id, shard);
      try {
        shard.connect();
      } catch (err) {
        this.emit('error', {
          shardId: id,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    }
  }

  send(shardId: number, payload: Parameters<WebSocketShard['send']>[0]): void {
    this.shards.get(shardId)?.send(payload);
  }

  destroy(): void {
    this.aborted = true;
    for (const shard of this.shards.values()) shard.destroy();
    this.shards.clear();
    this.gatewayUrl = null;
    this.diagnostic('debug', 'manager.destroyed', 'Gateway manager destroyed');
  }

  getShardCount(): number {
    return this.shardCount;
  }

  private diagnostic(
    level: 'debug' | 'info' | 'warn' | 'error',
    code: string,
    summary: string,
    data?: () => Record<string, unknown>,
  ): void {
    try {
      this.options.diagnostics?.emit(level, code, summary, data);
    } catch {
      // Diagnostics must not affect gateway behavior.
    }
  }
}

function safeErrorProperty(error: unknown, key: string): unknown {
  if (typeof error !== 'object' || error === null) return undefined;
  try {
    return Reflect.get(error, key);
  } catch {
    return undefined;
  }
}

function diagnosticStack(source: DiagnosticSource | undefined, error: unknown): string | undefined {
  try {
    const stack = source?.error(error).stack;
    return typeof stack === 'string' ? stack : undefined;
  } catch {
    return undefined;
  }
}

function diagnosticErrorMetadata(
  error: unknown,
  source: DiagnosticSource | undefined,
): Record<string, unknown> {
  const rawName = safeErrorProperty(error, 'name');
  const rawCode = safeErrorProperty(error, 'code');
  const rawStatus = safeErrorProperty(error, 'statusCode') ?? safeErrorProperty(error, 'status');
  const retryable = safeErrorProperty(error, 'isRetryable');
  const stack = diagnosticStack(source, error);
  const name =
    typeof rawName === 'string' && /^[a-z][a-z0-9]*$/i.test(rawName)
      ? rawName.slice(0, 64)
      : 'Error';
  const code =
    typeof rawCode === 'number' ||
    (typeof rawCode === 'string' && rawCode.length <= 128 && /^[a-z0-9_.-]+$/i.test(rawCode))
      ? rawCode
      : undefined;
  return {
    name,
    message: 'Gateway operation failed',
    ...(code !== undefined ? { code } : {}),
    ...(typeof rawStatus === 'number' &&
    Number.isInteger(rawStatus) &&
    rawStatus >= 100 &&
    rawStatus <= 599
      ? { statusCode: rawStatus }
      : {}),
    ...(typeof retryable === 'boolean' ? { retryable } : {}),
    ...(stack ? { stack } : {}),
  };
}
