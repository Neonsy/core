import { describe, it, expect, vi } from 'vitest';
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
  });
});
