import { describe, expect, it, vi } from 'vitest';
import { Client } from './Client.js';

describe('Client diagnostics', () => {
  it('does not capture diagnostics unless enabled', () => {
    const client = new Client();
    const data = vi.fn(() => ({ value: true }));

    client.diagnostics.createSource('core').emit('error', 'failed', 'Failed', data);

    expect(client.diagnostics.enabled).toBe(false);
    expect(data).not.toHaveBeenCalled();
    expect(client.diagnostics.snapshot()).toEqual([]);
  });

  it('supports filtered capture and application-owned sinks', () => {
    const sink = vi.fn();
    const client = new Client({
      diagnostics: {
        components: ['core'],
        level: 'info',
        sink,
      },
    });
    const source = client.diagnostics.createSource('core');

    source.emit('debug', 'ignored', 'Ignored');
    source.emit('info', 'ready', 'Ready', { guilds: 0 });

    expect(client.diagnostics.snapshot()).toMatchObject([
      {
        code: 'core.ready',
        data: { guilds: 0 },
      },
    ]);
    expect(sink).toHaveBeenCalledTimes(1);
  });

  it('creates a sanitized support snapshot without instance endpoints', () => {
    const client = new Client({
      diagnostics: true,
      instance: {
        api: 'https://private.example/api',
        gateway: 'wss://private.example/gateway',
      },
      waitForGuilds: true,
    });
    client.diagnostics.createSource('core').emit('error', 'login.failed', 'Login failed', {
      token: 'bot-secret',
      guildId: '123456789012345678',
    });

    const report = client.createDiagnosticReport();
    const serialized = JSON.stringify(report);

    expect(report).toMatchObject({
      format: 'fluxerjs-diagnostics',
      packages: {
        '@fluxerjs/core': expect.stringMatching(/^\d+\.\d+\.\d+/),
      },
      state: {
        ready: false,
        connected: false,
        caches: {
          guilds: 0,
          channels: 0,
          users: 0,
        },
        configuration: {
          waitForGuilds: true,
        },
      },
    });
    expect(serialized).not.toContain('private.example');
    expect(serialized).not.toContain('bot-secret');
    expect(serialized).not.toContain('123456789012345678');
    expect(Object.isFrozen(report)).toBe(true);
  });
});
