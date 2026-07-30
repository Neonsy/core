import { describe, expect, it, vi } from 'vitest';
import { DiagnosticsController } from './DiagnosticsController.js';
import { sanitizeDiagnosticData } from './sanitize.js';

describe('DiagnosticsController', () => {
  it('does not evaluate event data when disabled', () => {
    const diagnostics = new DiagnosticsController({ enabled: false });
    const data = vi.fn(() => ({ value: true }));

    diagnostics.createSource('core').emit('error', 'failed', 'Failed', data);

    expect(data).not.toHaveBeenCalled();
    expect(diagnostics.snapshot()).toEqual([]);
  });

  it('filters components and levels before evaluating data', () => {
    const diagnostics = new DiagnosticsController({
      level: 'warn',
      components: ['REST'],
    });
    const rest = diagnostics.createSource('rest');
    const gateway = diagnostics.createSource('gateway');
    const ignored = vi.fn(() => ({ ignored: true }));

    rest.emit('debug', 'request', 'Request', ignored);
    gateway.emit('error', 'closed', 'Closed', ignored);
    rest.emit('warn', 'retry', 'Retrying', () => ({ attempt: 2 }));

    expect(ignored).not.toHaveBeenCalled();
    expect(diagnostics.snapshot()).toMatchObject([
      {
        component: 'rest',
        code: 'rest.retry',
        data: { attempt: 2 },
      },
    ]);
  });

  it('rejects invalid runtime configuration', () => {
    expect(() => new DiagnosticsController({ level: 'verbose' as never })).toThrow(
      'level must be one of "debug", "info", "warn" or "error"',
    );
    expect(() => new DiagnosticsController({ sink: [null] as never })).toThrow(
      'sink must be a function or an array of functions',
    );
    expect(() => new DiagnosticsController().createSource('x'.repeat(65))).toThrow(
      'Diagnostic component must be at most 64 characters',
    );
  });

  it('rejects oversized event codes before evaluating data', () => {
    const diagnostics = new DiagnosticsController();
    const data = vi.fn(() => ({ value: true }));

    diagnostics.createSource('core').emit('info', 'x'.repeat(129), 'Invalid', data);

    expect(data).not.toHaveBeenCalled();
    expect(diagnostics.snapshot()).toEqual([]);
    expect(diagnostics.stats.dropped).toBe(1);
  });

  it('retains a bounded ordered history', () => {
    const diagnostics = new DiagnosticsController({ maxEvents: 2 });
    const source = diagnostics.createSource('core');

    source.emit('info', 'one', 'One');
    source.emit('info', 'two', 'Two');
    source.emit('info', 'three', 'Three');

    expect(diagnostics.snapshot().map((event) => event.code)).toEqual(['core.two', 'core.three']);
    expect(diagnostics.stats).toMatchObject({ captured: 3, dropped: 1 });
  });

  it('sanitizes nested secrets, identifiers, URLs and error causes', () => {
    const diagnostics = new DiagnosticsController();
    const source = diagnostics.createSource('rest');
    const cause = new Error('Bearer secret-token-value at https://example.com/a?token=x');
    const error = Object.assign(new Error('Failed for 123456789012345678'), {
      code: 'REQUEST_FAILED',
      statusCode: 503,
      cause,
      body: 'private response',
    });

    source.emit('error', 'request.failed', 'Request failed', () => ({
      token: 'secret',
      nested: {
        authorization: 'Bot abcdefghijklmnop',
        guildId: '123456789012345678',
      },
      error: source.error(error),
    }));

    const serialized = JSON.stringify(diagnostics.snapshot()[0]);
    expect(serialized).not.toContain('secret-token-value');
    expect(serialized).not.toContain('private response');
    expect(serialized).not.toContain('123456789012345678');
    expect(serialized).toContain('[REDACTED]');
    expect(serialized).toContain('REQUEST_FAILED');
    expect(serialized).toContain('503');
  });

  it('handles circular data and accessor properties without invoking them', () => {
    const diagnostics = new DiagnosticsController();
    const source = diagnostics.createSource('extension');
    const getter = vi.fn(() => 'secret');
    const value: Record<string, unknown> = {};
    value.self = value;
    Object.defineProperty(value, 'credential', { enumerable: true, get: getter });

    source.emit('info', 'custom', 'Custom', value as never);

    expect(getter).not.toHaveBeenCalled();
    expect(diagnostics.snapshot()[0]).toMatchObject({
      truncated: true,
      data: { self: '[CIRCULAR]' },
    });
  });

  it('serializes shared references without treating them as circular', () => {
    const shared = { value: true };

    expect(sanitizeDiagnosticData({ left: shared, right: shared })).toEqual({
      data: {
        left: { value: true },
        right: { value: true },
      },
      truncated: false,
    });
  });

  it('does not invoke error accessors', () => {
    const message = vi.fn(() => 'private error');
    const error = {
      name: 'Error',
      get message() {
        return message();
      },
    };

    expect(new DiagnosticsController().createSource('core').error(error)).toEqual({
      name: 'Error',
      message: 'Unknown error',
    });
    expect(message).not.toHaveBeenCalled();
  });

  it('isolates synchronous and asynchronous sink failures', async () => {
    const diagnostics = new DiagnosticsController({
      sink: [
        () => {
          throw new Error('sync sink failed');
        },
        async () => {
          throw new Error('async sink failed');
        },
      ],
    });

    expect(() => diagnostics.createSource('core').emit('error', 'failed', 'Failed')).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();

    expect(diagnostics.stats.sinkFailures).toBe(2);
    expect(diagnostics.size).toBe(1);
  });

  it('creates sanitized reports with registered component snapshots', () => {
    const diagnostics = new DiagnosticsController();
    diagnostics.registerComponent('gateway', {
      package: {
        name: '@fluxerjs/ws',
        version: '2.1.0',
      },
      snapshot: () => ({ connected: true, token: 'secret' }),
    });

    const report = diagnostics.createReport({
      packages: { '@fluxerjs/core': '2.1.0' },
      runtime: { node: '22.13.0', endpoint: 'https://private.example' },
      state: { ready: true },
    });

    expect(report).toMatchObject({
      format: 'fluxerjs-diagnostics',
      schemaVersion: 1,
      packages: {
        '@fluxerjs/core': '2.1.0',
        '@fluxerjs/ws': '2.1.0',
      },
      runtime: {
        node: '22.13.0',
        endpoint: '[REDACTED]',
      },
      state: { ready: true },
      components: {
        gateway: {
          connected: true,
          token: '[REDACTED]',
        },
      },
    });
    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.components.gateway)).toBe(true);
  });

  it('replaces oversized event data with bounded metadata', () => {
    const diagnostics = new DiagnosticsController({ maxEventBytes: 100 });

    diagnostics
      .createSource('core')
      .emit('debug', 'large', 'Large', () => ({ value: 'x'.repeat(500) }));

    expect(diagnostics.snapshot()[0]).toMatchObject({
      truncated: true,
      data: {
        omitted: 'Diagnostic data exceeded maxEventBytes',
      },
    });
    expect(diagnostics.stats.truncated).toBe(1);
  });
});
