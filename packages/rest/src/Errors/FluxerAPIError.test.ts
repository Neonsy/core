import { describe, expect, it } from 'vitest';
import { FluxerAPIError, RateLimitError } from './index.js';

describe('FluxerAPIError', () => {
  it('creates error with message from body', () => {
    const err = new FluxerAPIError(
      { message: 'Channel not found', code: 'CHANNEL_NOT_FOUND' },
      404,
    );
    expect(err.message).toBe('Channel not found');
    expect(err.name).toBe('FluxerAPIError');
  });

  it('stores code and statusCode', () => {
    const err = new FluxerAPIError({ message: 'Rate limited', code: 'RATE_LIMITED' }, 429);
    expect(err.code).toBe('RATE_LIMITED');
    expect(err.statusCode).toBe(429);
  });

  it('stores optional errors field', () => {
    const errors = [{ path: 'field', message: 'invalid value' }];
    const err = new FluxerAPIError(
      { message: 'Validation failed', code: 'VALIDATION_ERROR', errors },
      400,
    );
    expect(err.errors).toEqual(errors);
    expect(err.message).toContain('field: invalid value');
  });

  it('ignores malformed validation metadata without losing the API error', () => {
    const body = {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: [null, { path: 'name', message: 'Required', code: 'REQUIRED' }, 'invalid'],
    } as never;

    const err = new FluxerAPIError(body, 400);

    expect(err).toMatchObject({
      name: 'FluxerAPIError',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      errors: [{ path: 'name', message: 'Required', code: 'REQUIRED' }],
    });
    expect(err.message).toBe('Validation failed (name: Required)');
    expect(err.rawBody).toBe(body);
  });

  it('accepts a non-array errors field without throwing', () => {
    const body = {
      message: 'Bad request',
      code: 'BAD_REQUEST',
      errors: 'not-an-array',
    } as never;

    const err = new FluxerAPIError(body, 400);

    expect(err.message).toBe('Bad request');
    expect(err.errors).toBeUndefined();
  });

  it('includes request context when provided', () => {
    const err = new FluxerAPIError(
      { message: 'Channel not found', code: 'CHANNEL_NOT_FOUND' },
      404,
      { method: 'GET', path: '/channels/:id', attempts: 2 },
    );
    expect(err.message).toBe(
      'GET /channels/:id failed with HTTP 404 [CHANNEL_NOT_FOUND]: Channel not found',
    );
    expect(err).toMatchObject({ method: 'GET', path: '/channels/:id', attempts: 2 });
  });

  it('isRetryable returns true for 429', () => {
    const err = new FluxerAPIError({ message: 'Rate limited', code: 'RATE_LIMITED' }, 429);
    expect(err.isRetryable).toBe(true);
  });

  it('isRetryable returns true for 5xx', () => {
    expect(new FluxerAPIError({ message: 'Server error', code: 'INTERNAL' }, 500).isRetryable).toBe(
      true,
    );
    expect(
      new FluxerAPIError({ message: 'Bad gateway', code: 'BAD_GATEWAY' }, 502).isRetryable,
    ).toBe(true);
    expect(
      new FluxerAPIError({ message: 'Unavailable', code: 'UNAVAILABLE' }, 503).isRetryable,
    ).toBe(true);
  });

  it('isRetryable returns false for 4xx (except 429)', () => {
    expect(new FluxerAPIError({ message: 'Not found', code: 'NOT_FOUND' }, 404).isRetryable).toBe(
      false,
    );
    expect(new FluxerAPIError({ message: 'Forbidden', code: 'FORBIDDEN' }, 403).isRetryable).toBe(
      false,
    );
    expect(
      new FluxerAPIError({ message: 'Bad request', code: 'BAD_REQUEST' }, 400).isRetryable,
    ).toBe(false);
  });

  it('serializes safe API context without the raw response body', () => {
    const errors = [{ path: 'name', message: 'Required', code: 'REQUIRED' }];
    const err = new FluxerAPIError({ message: 'Bad input', code: 'BAD_INPUT', errors }, 400, {
      method: 'POST',
      path: '/guilds/:id',
      attempts: 1,
    });

    expect(JSON.parse(JSON.stringify(err))).toEqual({
      name: 'FluxerAPIError',
      message: 'POST /guilds/:id failed with HTTP 400 [BAD_INPUT]: Bad input (name: Required)',
      code: 'BAD_INPUT',
      statusCode: 400,
      errors,
      method: 'POST',
      path: '/guilds/:id',
      attempts: 1,
      isRetryable: false,
    });
    expect(JSON.stringify(err)).not.toContain('rawBody');
  });

  it('serializes rate-limit context', () => {
    const err = new RateLimitError(
      { message: 'Slow down', code: 'RATE_LIMITED', retry_after: 2.5, global: true },
      429,
      { method: 'GET', path: '/channels/:id', attempts: 4 },
    );

    expect(JSON.parse(JSON.stringify(err))).toMatchObject({
      name: 'RateLimitError',
      code: 'RATE_LIMITED',
      statusCode: 429,
      method: 'GET',
      path: '/channels/:id',
      attempts: 4,
      isRetryable: true,
      retryAfter: 2.5,
      global: true,
    });
  });
});
