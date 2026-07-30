import { describe, it, expect, vi } from 'vitest';
import { DiagnosticsController } from '@fluxerjs/diagnostics';
import { WebSocketManager, type WebSocketConstructor } from './WebSocketManager.js';

const FakeWebSocket = class {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  readyState = 0;
  close = vi.fn();
  send = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  constructor(_url: string) {}
} as unknown as WebSocketConstructor;

describe('WebSocketManager.connect', () => {
  it('rejects immediately on non-retryable REST errors instead of looping', async () => {
    const diagnostics = new DiagnosticsController();
    const fatal = Object.assign(new Error('Unauthorized'), {
      name: 'FluxerAPIError',
      statusCode: 401,
      isRetryable: false,
    });
    const get = vi.fn().mockRejectedValue(fatal);
    const manager = new WebSocketManager({
      token: 'test-token',
      intents: 0,
      rest: { get },
      diagnostics: diagnostics.createSource('gateway'),
      WebSocket: FakeWebSocket,
    });

    const errors: Error[] = [];
    manager.on('error', ({ error }: { error: Error }) => {
      errors.push(error);
    });

    await expect(manager.connect()).rejects.toBe(fatal);
    expect(get).toHaveBeenCalledTimes(1);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe(fatal);
    expect(diagnostics.snapshot().map((event) => event.code)).toEqual([
      'gateway.connect.started',
      'gateway.connect.attempt_failed',
      'gateway.connect.failed',
    ]);
    expect(diagnostics.snapshot()[1]).toMatchObject({
      data: {
        error: {
          name: 'FluxerAPIError',
          statusCode: 401,
          retryable: false,
        },
      },
    });
    expect(JSON.stringify(diagnostics.snapshot())).not.toContain('Unauthorized');
  });

  it('records shard initialization without gateway credentials or URLs', async () => {
    const diagnostics = new DiagnosticsController();
    const manager = new WebSocketManager({
      token: 'private-token',
      intents: 0,
      rest: {
        get: vi.fn().mockResolvedValue({
          url: 'wss://private.example',
          shards: 1,
        }),
      },
      diagnostics: diagnostics.createSource('gateway'),
      WebSocket: FakeWebSocket,
    });

    await manager.connect();

    expect(diagnostics.snapshot()).toMatchObject([
      { code: 'gateway.connect.started' },
      {
        code: 'gateway.shard.connecting',
        data: { shardId: 0 },
      },
      {
        code: 'gateway.connect.initialized',
        data: {
          shardCount: 1,
          initializedShards: 1,
        },
      },
    ]);
    const serialized = JSON.stringify(diagnostics.snapshot());
    expect(serialized).not.toMatch(/private-token|private\.example/);
    expect(diagnostics.createReport()).toMatchObject({
      packages: {
        '@fluxerjs/ws': expect.stringMatching(/^\d+\.\d+\.\d+/),
      },
      components: {
        gateway: {
          shardCount: 1,
          initializedShards: 1,
          connectedShards: 0,
          destroyed: false,
        },
      },
    });
  });

  it('includes sanitized error stacks only when explicitly enabled', async () => {
    const diagnostics = new DiagnosticsController({ captureStacks: true });
    const fatal = Object.assign(new Error('Bearer private-stack-token'), {
      isRetryable: false,
    });
    const manager = new WebSocketManager({
      token: 'test-token',
      intents: 0,
      rest: { get: vi.fn().mockRejectedValue(fatal) },
      diagnostics: diagnostics.createSource('gateway'),
      WebSocket: FakeWebSocket,
    });
    manager.on('error', () => {});

    await expect(manager.connect()).rejects.toBe(fatal);

    expect(diagnostics.snapshot()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'gateway.connect.failed',
          data: expect.objectContaining({
            error: expect.objectContaining({
              stack: expect.stringContaining('Bearer [REDACTED]'),
            }),
          }),
        }),
      ]),
    );
    expect(JSON.stringify(diagnostics.snapshot())).not.toContain('private-stack-token');
  });
});
