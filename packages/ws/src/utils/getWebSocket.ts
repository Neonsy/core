/**
 * Returns the WebSocket implementation to use.
 * Prefers global WebSocket (browser, Node 22+, Deno, Bun);
 * otherwise uses the bundled `ws` package (Node 18/20).
 */

import { ErrorCodes, FluxerError } from '@fluxerjs/util';
import ws from 'ws';

export type ResolvedWebSocketConstructor = new (
  url: string,
) => {
  send(data: string | ArrayBufferLike): void;
  close(code?: number): void;
  readyState: number;
  addEventListener?(type: string, listener: (e: unknown) => void): void;
  on?(event: string, cb: (data?: unknown) => void): void;
};

let cached: ResolvedWebSocketConstructor | null = null;

function fromGlobal(): ResolvedWebSocketConstructor | null {
  if (typeof globalThis.WebSocket === 'undefined') return null;
  return globalThis.WebSocket as unknown as ResolvedWebSocketConstructor;
}

function fromRequire(): ResolvedWebSocketConstructor | null {
  if (typeof require !== 'function') return null;
  try {
    return require('ws') as ResolvedWebSocketConstructor;
  } catch {
    return null;
  }
}

function resolve(allowBundledFallback: boolean): ResolvedWebSocketConstructor | null {
  if (cached) return cached;
  const resolved =
    fromGlobal() ??
    fromRequire() ??
    (allowBundledFallback ? (ws as unknown as ResolvedWebSocketConstructor) : null);
  if (resolved) cached = resolved;
  return resolved;
}

export function getDefaultWebSocketSync(): ResolvedWebSocketConstructor {
  const resolved = resolve(false);
  if (resolved) return resolved;
  throw new FluxerError(
    'No WebSocket implementation. Use Node 22+, or run with CommonJS. The "ws" package is bundled with @fluxerjs/ws.',
    { code: ErrorCodes.WebSocketLoadFailed },
  );
}

/** Async resolver — same selection order as sync, but falls back to bundled `ws` in ESM. */
export async function getDefaultWebSocket(): Promise<ResolvedWebSocketConstructor> {
  return resolve(true)!;
}
