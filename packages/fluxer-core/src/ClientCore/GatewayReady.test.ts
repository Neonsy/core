import { createLogger } from '@fluxerjs/util';
import { GatewayCloseError } from '@fluxerjs/ws';
import { describe, expect, it, vi } from 'vitest';
import { Events } from '../Helpers/Events.js';
import { Client } from './Client.js';
import { connectClientGateway } from './GatewayReady.js';

class ClosingWebSocket {
  static current: ClosingWebSocket | null = null;
  readyState = 1;
  private readonly listeners = new Map<string, (event: unknown) => void>();

  constructor(_url: string) {
    ClosingWebSocket.current = this;
  }

  addEventListener(type: string, listener: (event: unknown) => void): void {
    this.listeners.set(type, listener);
  }

  send(_data: string | ArrayBufferLike): void {}

  close(_code?: number): void {
    this.readyState = 3;
  }

  emit(type: string, event: unknown): void {
    this.listeners.get(type)?.(event);
  }
}

describe('connectClientGateway', () => {
  it('forwards a terminal close error to client consumers with structured logging', async () => {
    const sink = vi.fn();
    const client = new Client({
      WebSocket: ClosingWebSocket,
      logger: createLogger({ sink }),
    });
    vi.spyOn(client.rest, 'get').mockResolvedValue({
      url: 'wss://gateway.fluxer.app',
      shards: 1,
    });
    const onError = vi.fn();
    client.on(Events.Error, onError);

    const manager = await connectClientGateway(client, 'test-token');
    ClosingWebSocket.current?.emit('close', {
      code: 4004,
      reason: 'authentication failed',
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(GatewayCloseError);
    expect(onError.mock.calls[0]?.[0]).toMatchObject({
      code: 'GATEWAY_FATAL_CLOSE',
      shardId: 0,
      closeCode: 4004,
      reason: 'authentication failed',
    });
    expect(sink).toHaveBeenCalledWith(
      'error',
      'gateway error',
      expect.objectContaining({
        shardId: 0,
        error: expect.objectContaining({ closeCode: 4004, reason: 'authentication failed' }),
      }),
    );

    manager.destroy();
  });
});
