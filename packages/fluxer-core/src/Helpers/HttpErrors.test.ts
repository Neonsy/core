import { FluxerAPIError, RateLimitError } from '@fluxerjs/rest';
import { describe, expect, it } from 'vitest';
import { FluxerError } from '../LibErrors/FluxerError.js';
import { httpStatus, qs, rethrowMapped } from './HttpErrors.js';

function apiError(status: number, message = 'boom'): FluxerAPIError {
  return new FluxerAPIError({ code: 'UNKNOWN', message }, status);
}

describe('httpStatus', () => {
  it('reads statusCode from a FluxerAPIError', () => {
    expect(httpStatus(apiError(404))).toBe(404);
  });

  it('reads a numeric statusCode off a plain object', () => {
    expect(httpStatus({ statusCode: 500 })).toBe(500);
  });

  it('returns undefined for a non-numeric statusCode', () => {
    expect(httpStatus({ statusCode: 'nope' })).toBeUndefined();
  });

  it('returns undefined for values without a statusCode', () => {
    expect(httpStatus(new Error('x'))).toBeUndefined();
    expect(httpStatus(null)).toBeUndefined();
    expect(httpStatus('string')).toBeUndefined();
  });
});

describe('qs', () => {
  it('builds a query string from defined values', () => {
    expect(qs({ limit: 10, after: 'abc' })).toBe('?limit=10&after=abc');
  });

  it('skips null, undefined, and empty-string values', () => {
    expect(qs({ a: undefined, b: '', c: 'keep' })).toBe('?c=keep');
  });

  it('returns an empty string when nothing is set', () => {
    expect(qs({ a: undefined, b: '' })).toBe('');
    expect(qs({})).toBe('');
  });

  it('stringifies numbers', () => {
    expect(qs({ n: 0 })).toBe('?n=0');
  });
});

describe('rethrowMapped', () => {
  it('rethrows a RateLimitError unchanged', () => {
    const err = new RateLimitError(
      { code: 'RATE_LIMITED', message: 'slow down', retry_after: 1 },
      429,
    );
    expect(() => rethrowMapped(err, { fallback: 'fb' })).toThrow(err);
  });

  it('rethrows an existing FluxerError unchanged', () => {
    const err = new FluxerError('already mapped', { code: 'EXISTING' });
    expect(() => rethrowMapped(err, { fallback: 'fb' })).toThrow(err);
  });

  it('maps a 404 to the notFound coded error and preserves cause', () => {
    const cause = apiError(404);
    try {
      rethrowMapped(cause, {
        fallback: 'fb',
        notFound: { code: 'NOT_FOUND', message: 'gone' },
      });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(FluxerError);
      expect((err as FluxerError).message).toBe('gone');
      expect((err as FluxerError).code).toBe('NOT_FOUND');
      expect((err as FluxerError).cause).toBe(cause);
    }
  });

  it('falls through to a generic FluxerError using the error message', () => {
    const cause = new Error('underlying');
    try {
      rethrowMapped(cause, { fallback: 'fallback message', code: 'GENERIC' });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(FluxerError);
      expect((err as FluxerError).message).toBe('underlying');
      expect((err as FluxerError).code).toBe('GENERIC');
      expect((err as FluxerError).cause).toBe(cause);
    }
  });

  it('uses the fallback message when the cause has none', () => {
    expect(() => rethrowMapped({}, { fallback: 'fallback message' })).toThrow('fallback message');
  });

  it('does not map a 404 when no notFound option is given', () => {
    try {
      rethrowMapped(apiError(404), { fallback: 'fallback message' });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect((err as FluxerError).message).toBe('boom');
    }
  });
});
