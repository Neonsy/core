import type { APIErrorBody, RateLimitErrorBody } from '@fluxerjs/types';

export type RequestContext = { method?: string; path?: string };

function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

const STATUS_HINTS: Record<number, string> = {
  502: 'Bad Gateway — Fluxer API may be temporarily unavailable.',
  503: 'Service Unavailable — Fluxer API is down or overloaded. Try again later.',
  504: 'Gateway Timeout — Fluxer API did not respond in time.',
};

export class HTTPError extends Error {
  readonly statusCode: number;
  readonly body: string | null;
  readonly method?: string;
  readonly path?: string;

  constructor(statusCode: number, body: string | null, context?: RequestContext) {
    const detail = body?.trim() || STATUS_HINTS[statusCode] || 'No body';
    super(`HTTP ${statusCode}: ${detail}`);
    this.name = 'HTTPError';
    this.statusCode = statusCode;
    this.body = body;
    this.method = context?.method;
    this.path = context?.path;
    Object.setPrototypeOf(this, HTTPError.prototype);
  }

  get isRetryable(): boolean {
    return isRetryableStatus(this.statusCode);
  }
}

export class FluxerAPIError extends Error {
  readonly code: APIErrorBody['code'];
  readonly statusCode: number;
  readonly errors?: APIErrorBody['errors'];
  readonly method?: string;
  readonly path?: string;
  readonly rawBody: APIErrorBody;

  constructor(body: APIErrorBody, statusCode: number, context?: RequestContext) {
    super(body.message);
    this.name = 'FluxerAPIError';
    this.code = body.code;
    this.statusCode = statusCode;
    this.errors = body.errors;
    this.rawBody = body;
    this.method = context?.method;
    this.path = context?.path;
    Object.setPrototypeOf(this, FluxerAPIError.prototype);
  }

  get isRetryable(): boolean {
    return isRetryableStatus(this.statusCode);
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
}
