import { describe, expect, it, vi } from 'vitest';
import { createLogger, type LogLevel, serializeError } from './Logger.js';

describe('createLogger', () => {
  it('defaults to the warn level and drops lower-severity logs', () => {
    const sink = vi.fn();
    const log = createLogger({ sink });
    expect(log.level).toBe('warn');

    log.error('e');
    log.warn('w');
    log.info('i');
    log.debug('d');

    const levels = sink.mock.calls.map((c) => c[0] as LogLevel);
    expect(levels).toEqual(['error', 'warn']);
  });

  it('emits everything at debug level', () => {
    const sink = vi.fn();
    const log = createLogger({ level: 'debug', sink });
    log.error('e');
    log.warn('w');
    log.info('i');
    log.debug('d');
    expect(sink).toHaveBeenCalledTimes(4);
  });

  it('passes the message and fields to the sink', () => {
    const sink = vi.fn();
    const log = createLogger({ level: 'info', sink });
    log.info('hello', { requestId: 'r1' });
    expect(sink).toHaveBeenCalledWith('info', 'hello', { requestId: 'r1' });
  });

  it('omits fields when there are none', () => {
    const sink = vi.fn();
    const log = createLogger({ level: 'info', sink });
    log.info('hello');
    expect(sink).toHaveBeenCalledWith('info', 'hello', undefined);
  });

  it('child() merges base fields into every log', () => {
    const sink = vi.fn();
    const child = createLogger({ level: 'info', sink }).child({ shard: 0 });
    child.info('up', { extra: true });
    expect(sink).toHaveBeenCalledWith('info', 'up', { shard: 0, extra: true });
  });

  it('child() inherits the parent level and sink', () => {
    const sink = vi.fn();
    const child = createLogger({ level: 'error', sink }).child({ a: 1 });
    expect(child.level).toBe('error');
    child.warn('ignored');
    expect(sink).not.toHaveBeenCalled();
  });
});

describe('serializeError', () => {
  it('serializes a basic error', () => {
    const out = serializeError(new Error('boom'));
    expect(out).toMatchObject({ name: 'Error', message: 'boom' });
  });

  it('includes code, statusCode, method, and path when present', () => {
    const err = Object.assign(new Error('api'), {
      code: 'X',
      statusCode: 500,
      method: 'GET',
      path: '/a',
    });
    expect(serializeError(err)).toMatchObject({
      code: 'X',
      statusCode: 500,
      method: 'GET',
      path: '/a',
    });
  });

  it('includes bounded request and validation metadata', () => {
    const err = Object.assign(new Error('validation failed'), {
      attempts: 2,
      kind: 'response',
      isRetryable: false,
      retryAfter: 3,
      global: true,
      errors: [{ path: 'content', message: 'too long', code: 'MAX_LENGTH' }],
    });
    expect(serializeError(err)).toMatchObject({
      attempts: 2,
      kind: 'response',
      isRetryable: false,
      retryAfter: 3,
      global: true,
      errors: [{ path: 'content', message: 'too long', code: 'MAX_LENGTH' }],
    });
  });

  it('includes gateway close context', () => {
    const err = Object.assign(new Error('gateway closed'), {
      shardId: 2,
      closeCode: 4004,
      reason: 'authentication failed',
    });
    expect(serializeError(err)).toMatchObject({
      shardId: 2,
      closeCode: 4004,
      reason: 'authentication failed',
    });
  });

  it('walks the cause chain', () => {
    const root = new Error('root');
    const wrapped = new Error('wrapped', { cause: root });
    const out = serializeError(wrapped) as Record<string, unknown>;
    expect((out.cause as Record<string, unknown>).message).toBe('root');
  });

  it('stops at max cause depth', () => {
    let err = new Error('deep');
    for (let i = 0; i < 8; i++) err = new Error(`l${i}`, { cause: err });
    // Should not throw and should terminate with a sentinel string somewhere.
    expect(() => JSON.stringify(serializeError(err))).not.toThrow();
    expect(JSON.stringify(serializeError(err))).toContain('[MaxCauseDepth]');
  });

  it('stringifies non-object inputs', () => {
    expect(serializeError('plain')).toBe('plain');
    expect(serializeError(null)).toBe('null');
    expect(serializeError(undefined)).toBe('undefined');
    expect(serializeError(42)).toBe('42');
  });
});
