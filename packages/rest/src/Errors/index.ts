import type { APIErrorBody, RateLimitErrorBody } from '@fluxerjs/types';
import { FluxerError } from '@fluxerjs/util';

export type RequestContext = { method?: string; path?: string; attempts?: number };

const ERROR_DETAIL_MAX = 500;
const VALIDATION_DETAIL_MAX = 3;

function truncate(value: string, max = ERROR_DETAIL_MAX): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1)}…`;
}

function requestLabel(context: RequestContext | undefined): string | null {
  if (!context?.method && !context?.path) return null;
  return [context.method?.toUpperCase(), context.path].filter(Boolean).join(' ');
}

type ValidationErrorDetail = NonNullable<APIErrorBody['errors']>[number];

function isValidationErrorDetail(value: unknown): value is ValidationErrorDetail {
  if (typeof value !== 'object' || value === null) return false;
  const detail = value as Record<string, unknown>;
  return (
    typeof detail.path === 'string' &&
    typeof detail.message === 'string' &&
    (detail.code === undefined || typeof detail.code === 'string')
  );
}

function normalizeValidationErrors(value: unknown): APIErrorBody['errors'] {
  if (!Array.isArray(value)) return undefined;
  if (value.every(isValidationErrorDetail)) return value;
  const valid = value.filter(isValidationErrorDetail);
  return valid.length > 0 ? valid : undefined;
}

function validationDetail(errors: APIErrorBody['errors']): string {
  if (!errors?.length) return '';
  const visible = errors
    .slice(0, VALIDATION_DETAIL_MAX)
    .map((error) => `${truncate(error.path, 120)}: ${truncate(error.message, 240)}`);
  const remaining = errors.length - visible.length;
  return ` (${visible.join('; ')}${remaining > 0 ? `; ${remaining} more` : ''})`;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

const STATUS_HINTS: Record<number, string> = {
  502: 'Bad Gateway. Fluxer API may be temporarily unavailable.',
  503: 'Service Unavailable. Fluxer API is down or overloaded. Try again later.',
  504: 'Gateway Timeout. Fluxer API did not respond in time.',
};

export class HTTPError extends FluxerError {
  readonly statusCode: number;
  readonly body: string | null;
  readonly method?: string;
  readonly path?: string;
  readonly attempts?: number;

  constructor(statusCode: number, body: string | null, context?: RequestContext) {
    const detail =
      STATUS_HINTS[statusCode] ?? (body?.trim() ? 'Unexpected response body' : 'No response body');
    const request = requestLabel(context);
    super(`${request ? `${request} failed with ` : ''}HTTP ${statusCode}: ${detail}`);
    this.name = 'HTTPError';
    this.statusCode = statusCode;
    this.body = body;
    Object.defineProperty(this, 'body', {
      value: body,
      enumerable: false,
      writable: false,
      configurable: false,
    });
    this.method = context?.method;
    this.path = context?.path;
    this.attempts = context?.attempts;
    Object.setPrototypeOf(this, HTTPError.prototype);
  }

  get isRetryable(): boolean {
    return isRetryableStatus(this.statusCode);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      statusCode: this.statusCode,
      ...(this.method !== undefined ? { method: this.method } : {}),
      ...(this.path !== undefined ? { path: this.path } : {}),
      ...(this.attempts !== undefined ? { attempts: this.attempts } : {}),
      isRetryable: this.isRetryable,
    };
  }
}

export class FluxerAPIError extends FluxerError {
  readonly code: APIErrorBody['code'];
  readonly statusCode: number;
  readonly errors?: APIErrorBody['errors'];
  readonly method?: string;
  readonly path?: string;
  readonly attempts?: number;
  readonly rawBody: APIErrorBody;

  constructor(body: APIErrorBody, statusCode: number, context?: RequestContext) {
    const errors = normalizeValidationErrors(body.errors);
    const request = requestLabel(context);
    const prefix = request
      ? `${request} failed with HTTP ${statusCode} [${String(body.code)}]: `
      : '';
    super(`${prefix}${body.message}${validationDetail(errors)}`);
    this.name = 'FluxerAPIError';
    this.code = body.code;
    this.statusCode = statusCode;
    this.errors = errors;
    this.rawBody = body;
    this.method = context?.method;
    this.path = context?.path;
    this.attempts = context?.attempts;
    Object.setPrototypeOf(this, FluxerAPIError.prototype);
  }

  get isRetryable(): boolean {
    return isRetryableStatus(this.statusCode);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      statusCode: this.statusCode,
      ...(this.errors !== undefined ? { errors: this.errors } : {}),
      ...(this.method !== undefined ? { method: this.method } : {}),
      ...(this.path !== undefined ? { path: this.path } : {}),
      ...(this.attempts !== undefined ? { attempts: this.attempts } : {}),
      isRetryable: this.isRetryable,
    };
  }
}

export type RESTRequestErrorKind = 'transport' | 'timeout' | 'response';

export interface RESTRequestErrorOptions extends RequestContext {
  code: string;
  kind: RESTRequestErrorKind;
  cause?: unknown;
  statusCode?: number;
  retryable?: boolean;
}

/** Failure outside a valid Fluxer API error response. */
export class RESTRequestError extends FluxerError {
  readonly kind: RESTRequestErrorKind;
  readonly method?: string;
  readonly path?: string;
  readonly attempts?: number;
  readonly statusCode?: number;
  private readonly retryable: boolean;

  constructor(message: string, options: RESTRequestErrorOptions) {
    super(message, { code: options.code, cause: options.cause });
    this.name = 'RESTRequestError';
    this.kind = options.kind;
    this.method = options.method;
    this.path = options.path;
    this.attempts = options.attempts;
    this.statusCode = options.statusCode;
    this.retryable = options.retryable ?? false;
    Object.setPrototypeOf(this, RESTRequestError.prototype);
  }

  get isRetryable(): boolean {
    return this.retryable;
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      kind: this.kind,
      ...(this.method !== undefined ? { method: this.method } : {}),
      ...(this.path !== undefined ? { path: this.path } : {}),
      ...(this.attempts !== undefined ? { attempts: this.attempts } : {}),
      ...(this.statusCode !== undefined ? { statusCode: this.statusCode } : {}),
      isRetryable: this.isRetryable,
    };
  }
}

export class RateLimitError extends FluxerAPIError {
  readonly retryAfter: number;
  readonly global: boolean;

  constructor(body: RateLimitErrorBody, statusCode: number, context?: RequestContext) {
    super(body, statusCode, context);
    this.retryAfter = body.retry_after;
    this.global = body.global ?? false;
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
      global: this.global,
    };
  }
}
