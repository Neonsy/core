import { serializeError } from '@fluxerjs/util';
import { describe, expect, it } from 'vitest';
import { HTTPError, RESTRequestError } from './index.js';

describe('HTTPError', () => {
  it('creates error with status and body', () => {
    const err = new HTTPError(404, '{"error":"not found"}');
    expect(err.message).toContain('404');
    expect(err.message).toContain('Unexpected response body');
    expect(err.message).not.toContain('not found');
    expect(err.name).toBe('HTTPError');
  });

  it('stores statusCode and body', () => {
    const err = new HTTPError(500, 'Internal Server Error');
    expect(err.statusCode).toBe(500);
    expect(err.body).toBe('Internal Server Error');
  });

  it('includes request context when provided', () => {
    const err = new HTTPError(500, 'Internal Server Error', {
      method: 'GET',
      path: '/gateway/bot',
      attempts: 4,
    });
    expect(err.message).toBe('GET /gateway/bot failed with HTTP 500: Unexpected response body');
    expect(err).toMatchObject({ method: 'GET', path: '/gateway/bot', attempts: 4 });
  });

  it('accepts null body', () => {
    const err = new HTTPError(502, null);
    expect(err.body).toBeNull();
    expect(err.message).toContain('502');
  });

  it('uses status hint when body is empty', () => {
    const err = new HTTPError(503, '');
    expect(err.message).toContain('Service Unavailable');
  });

  it('isRetryable returns true for 429', () => {
    const err = new HTTPError(429, 'Too Many Requests');
    expect(err.isRetryable).toBe(true);
  });

  it('isRetryable returns true for 5xx', () => {
    expect(new HTTPError(500, '').isRetryable).toBe(true);
    expect(new HTTPError(502, '').isRetryable).toBe(true);
    expect(new HTTPError(503, '').isRetryable).toBe(true);
    expect(new HTTPError(504, '').isRetryable).toBe(true);
  });

  it('isRetryable returns false for 4xx (except 429)', () => {
    expect(new HTTPError(400, '').isRetryable).toBe(false);
    expect(new HTTPError(403, '').isRetryable).toBe(false);
    expect(new HTTPError(404, '').isRetryable).toBe(false);
  });

  it('isRetryable returns true for 599 (upper boundary)', () => {
    expect(new HTTPError(599, '').isRetryable).toBe(true);
  });

  it('retains the full body without copying it into the message', () => {
    const body = 'x'.repeat(1_000);
    const err = new HTTPError(500, body);
    expect(err.message).toContain('Unexpected response body');
    expect(err.message).not.toContain(body);
    expect(err.body).toBe(body);
    expect(Object.keys(err)).not.toContain('body');
  });

  it('uses the status hint without copying a response body into the message', () => {
    const err = new HTTPError(502, 'Custom error body');
    expect(err.message).toContain('Bad Gateway');
    expect(err.message).not.toContain('Custom error body');
  });

  it('serializes safe HTTP context without exposing response content', () => {
    const body = 'PRIVATE_RESPONSE_MARKER_7f9e';
    const err = new HTTPError(503, body, {
      method: 'GET',
      path: '/guilds/:id',
      attempts: 4,
    });

    expect(JSON.parse(JSON.stringify(err))).toEqual({
      name: 'HTTPError',
      message:
        'GET /guilds/:id failed with HTTP 503: Service Unavailable. Fluxer API is down or overloaded. Try again later.',
      statusCode: 503,
      method: 'GET',
      path: '/guilds/:id',
      attempts: 4,
      isRetryable: true,
    });
    expect(JSON.stringify(err)).not.toContain('"body"');
    expect(JSON.stringify(err)).not.toContain(body);
    expect(JSON.stringify(serializeError(err))).not.toContain(body);
  });

  it('serializes REST request classification and retry context', () => {
    const err = new RESTRequestError('Request timed out', {
      code: 'REST_REQUEST_TIMEOUT',
      kind: 'timeout',
      method: 'GET',
      path: '/channels/:id',
      attempts: 4,
      retryable: true,
    });

    expect(JSON.parse(JSON.stringify(err))).toEqual({
      name: 'RESTRequestError',
      message: 'Request timed out',
      code: 'REST_REQUEST_TIMEOUT',
      kind: 'timeout',
      method: 'GET',
      path: '/channels/:id',
      attempts: 4,
      isRetryable: true,
    });
  });
});
