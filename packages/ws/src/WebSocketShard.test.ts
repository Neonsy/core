import { GatewayOpcodes } from '@fluxerjs/types';
import { describe, expect, it, vi } from 'vitest';
import { GatewayCloseError } from './GatewayCloseError.js';
import { GatewayCloseCodes } from './Utils/Constants.js';
import { narrowGatewayPayload, shouldReconnectOnClose, WebSocketShard } from './WebSocketShard.js';

class MockWebSocket {
  readyState = 1;
  // biome-ignore lint/complexity/noUselessConstructor: required WebSocket(url) signature for mocks
  constructor(_url: string) {}
  send(_data: string | ArrayBufferLike): void {}
  close(_code?: number): void {}
}

describe('narrowGatewayPayload', () => {
  it('returns null for non-objects', () => {
    expect(narrowGatewayPayload(null)).toBeNull();
    expect(narrowGatewayPayload('x')).toBeNull();
    expect(narrowGatewayPayload(1)).toBeNull();
  });

  it('requires numeric op', () => {
    expect(narrowGatewayPayload({ d: {} })).toBeNull();
    expect(narrowGatewayPayload({ op: '10' })).toBeNull();
  });

  it('narrows a valid payload once', () => {
    const payload = narrowGatewayPayload({
      op: GatewayOpcodes.HeartbeatAck,
      d: null,
      s: 3,
      t: null,
    });
    expect(payload).toEqual({ op: GatewayOpcodes.HeartbeatAck, d: null, s: 3 });
  });
});

describe('shouldReconnectOnClose', () => {
  it('reconnects on normal and abnormal closures', () => {
    expect(shouldReconnectOnClose(GatewayCloseCodes.Normal)).toBe(true);
    expect(shouldReconnectOnClose(GatewayCloseCodes.AbnormalClosure)).toBe(true);
    expect(shouldReconnectOnClose(1012)).toBe(true);
  });

  it('does not reconnect on terminal protocol, auth, or configuration closes', () => {
    expect(shouldReconnectOnClose(GatewayCloseCodes.AuthenticationFailed)).toBe(false);
    expect(shouldReconnectOnClose(GatewayCloseCodes.ProtocolError)).toBe(false);
    expect(shouldReconnectOnClose(GatewayCloseCodes.InvalidShard)).toBe(false);
    expect(shouldReconnectOnClose(GatewayCloseCodes.ShardingRequired)).toBe(false);
    expect(shouldReconnectOnClose(GatewayCloseCodes.InvalidAPIVersion)).toBe(false);
  });

  it('reconnects on recoverable gateway codes', () => {
    expect(shouldReconnectOnClose(GatewayCloseCodes.UnknownOpcode)).toBe(true);
    expect(shouldReconnectOnClose(GatewayCloseCodes.DecodeError)).toBe(true);
    expect(shouldReconnectOnClose(GatewayCloseCodes.NotAuthenticated)).toBe(true);
    expect(shouldReconnectOnClose(GatewayCloseCodes.AlreadyAuthenticated)).toBe(true);
    expect(shouldReconnectOnClose(GatewayCloseCodes.SessionTimeout)).toBe(true);
    expect(shouldReconnectOnClose(GatewayCloseCodes.RateLimited)).toBe(true);
    expect(shouldReconnectOnClose(GatewayCloseCodes.AckBackpressure)).toBe(true);
  });
});

describe('GatewayCloseError', () => {
  it('serializes terminal close context', () => {
    const err = new GatewayCloseError(2, GatewayCloseCodes.AuthenticationFailed, 'invalid token');

    expect(JSON.parse(JSON.stringify(err))).toEqual({
      name: 'GatewayCloseError',
      message:
        'Gateway shard 2 closed with 4004 (AuthenticationFailed) and will not reconnect: invalid token',
      code: 'GATEWAY_FATAL_CLOSE',
      shardId: 2,
      closeCode: GatewayCloseCodes.AuthenticationFailed,
      reason: 'invalid token',
      isRetryable: false,
    });
  });
});

describe('WebSocketShard', () => {
  it('emits a contextual error for a terminal close', () => {
    const shard = new WebSocketShard({
      url: 'wss://gateway.fluxer.app',
      token: 'test-token',
      shardId: 2,
      numShards: 3,
      WebSocket: MockWebSocket,
    });
    const onError = vi.fn();
    const onClose = vi.fn();
    shard.on('error', onError);
    shard.on('close', onClose);

    (shard as unknown as { onClose(code: number, reason: string | null): void }).onClose(
      GatewayCloseCodes.AuthenticationFailed,
      'invalid token',
    );

    expect(onClose).toHaveBeenCalledWith(GatewayCloseCodes.AuthenticationFailed, 'invalid token');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toMatchObject({
      name: 'GatewayCloseError',
      code: 'GATEWAY_FATAL_CLOSE',
      shardId: 2,
      closeCode: GatewayCloseCodes.AuthenticationFailed,
      reason: 'invalid token',
      isRetryable: false,
    });
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(GatewayCloseError);
  });

  it('cancels a reconnect scheduled by a socket error when the close is terminal', () => {
    const shard = new WebSocketShard({
      url: 'wss://gateway.fluxer.app',
      token: 'test-token',
      shardId: 2,
      numShards: 3,
      WebSocket: MockWebSocket,
    });
    const onError = vi.fn();
    shard.on('error', onError);
    const internal = shard as unknown as {
      ws: MockWebSocket | null;
      reconnectTimeout: ReturnType<typeof setTimeout> | null;
      onSocketError(error: unknown): void;
      onClose(code: number, reason: string | null): void;
    };
    internal.ws = new MockWebSocket('wss://gateway.fluxer.app');

    internal.onSocketError(new Error('socket failed'));
    expect(internal.reconnectTimeout).not.toBeNull();

    internal.onClose(GatewayCloseCodes.AuthenticationFailed, 'invalid token');

    expect(internal.reconnectTimeout).toBeNull();
    expect(onError).toHaveBeenCalledTimes(2);
    expect(onError.mock.calls[1]?.[0]).toBeInstanceOf(GatewayCloseError);
  });

  it('does not emit an error for a recoverable close', () => {
    const shard = new WebSocketShard({
      url: 'wss://gateway.fluxer.app',
      token: 'test-token',
      shardId: 0,
      numShards: 1,
      WebSocket: MockWebSocket,
    });
    const onError = vi.fn();
    shard.on('error', onError);

    (shard as unknown as { onClose(code: number, reason: string | null): void }).onClose(
      GatewayCloseCodes.SessionTimeout,
      'resume later',
    );

    expect(onError).not.toHaveBeenCalled();
    shard.destroy();
  });

  it('emits error and debug when gateway sends GatewayError with string payload', () => {
    const shard = new WebSocketShard({
      url: 'wss://gateway.fluxer.app',
      token: 'test-token',
      shardId: 0,
      numShards: 1,
      WebSocket: MockWebSocket,
    });

    const onError = vi.fn();
    const onDebug = vi.fn();
    shard.on('error', onError);
    shard.on('debug', onDebug);

    shard.handlePayload({
      op: GatewayOpcodes.GatewayError,
      d: 'bad gateway state',
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(String(onError.mock.calls[0]?.[0]?.message ?? '')).toContain('bad gateway state');
    expect(onDebug).toHaveBeenCalledTimes(1);
    expect(String(onDebug.mock.calls[0]?.[0] ?? '')).toContain('Gateway error: bad gateway state');
  });

  it('does not emit debug when debug option is false', () => {
    const shard = new WebSocketShard({
      url: 'wss://gateway.fluxer.app',
      token: 'test-token',
      shardId: 0,
      numShards: 1,
      debug: false,
      WebSocket: MockWebSocket,
    });

    const onDebug = vi.fn();
    shard.on('debug', onDebug);
    shard.on('error', () => {});

    shard.handlePayload({
      op: GatewayOpcodes.GatewayError,
      d: 'ignored',
    });

    expect(onDebug).not.toHaveBeenCalled();
  });

  it('stringifies non-string GatewayError payloads', () => {
    const shard = new WebSocketShard({
      url: 'wss://gateway.fluxer.app',
      token: 'test-token',
      shardId: 0,
      numShards: 1,
      WebSocket: MockWebSocket,
    });

    const onError = vi.fn();
    shard.on('error', onError);

    shard.handlePayload({
      op: GatewayOpcodes.GatewayError,
      d: { code: 500, detail: 'oops' },
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(String(onError.mock.calls[0]?.[0]?.message ?? '')).toContain(
      '{"code":500,"detail":"oops"}',
    );
  });

  it('narrows gateway payloads after a single JSON.parse', () => {
    const parseSpy = vi.spyOn(JSON, 'parse');
    const raw = JSON.stringify({ op: GatewayOpcodes.HeartbeatAck });
    const once = JSON.parse(raw);
    expect(narrowGatewayPayload(once)?.op).toBe(GatewayOpcodes.HeartbeatAck);
    expect(parseSpy).toHaveBeenCalledTimes(1);
    parseSpy.mockRestore();
  });

  it('Reconnect opcode closes socket without double-scheduling connect', () => {
    const closes: number[] = [];
    class TrackingWS {
      readyState = 1;
      // biome-ignore lint/complexity/noUselessConstructor: required WebSocket(url) signature for mocks
      constructor(_url: string) {}
      send(): void {}
      close(code?: number): void {
        closes.push(code ?? 1000);
        this.readyState = 3;
      }
    }

    const shard = new WebSocketShard({
      url: 'wss://gateway.fluxer.app',
      token: 'test-token',
      shardId: 0,
      numShards: 1,
      WebSocket: TrackingWS,
    });

    (shard as unknown as { ws: TrackingWS }).ws = new TrackingWS('wss://x');
    shard.handlePayload({ op: GatewayOpcodes.Reconnect });
    expect(closes).toEqual([1000]);
  });

  it('HeartbeatAck clears the awaiting-ack flag', () => {
    const shard = new WebSocketShard({
      url: 'wss://gateway.fluxer.app',
      token: 'test-token',
      shardId: 0,
      numShards: 1,
      WebSocket: MockWebSocket,
    });

    (shard as unknown as { lastHeartbeatAck: boolean }).lastHeartbeatAck = false;
    shard.handlePayload({ op: GatewayOpcodes.HeartbeatAck });
    expect((shard as unknown as { lastHeartbeatAck: boolean }).lastHeartbeatAck).toBe(true);
  });
});
