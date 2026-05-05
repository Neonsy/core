import { REST } from '@fluxerjs/rest';
import { GatewayPresenceUpdateData } from '@fluxerjs/types';

/**
 * Optional cache size limits. When exceeded, oldest entries are evicted (FIFO).
 * Omit a key or use `0` for **unbounded** growth for that bucket (memory use scales with guild/channel/user/message traffic).
 *
 * **Recommended starter** for bots in many guilds (tune to your workload):
 * `{ guilds: 200, users: 10_000, channels: 5_000, messages: 50 }`
 * — caps RSS from cached structures; raise limits if you rely heavily on cache hits.
 */
export interface CacheSizeLimits {
  channels?: number;
  guilds?: number;
  users?: number;
  /** Max messages per channel to cache. Enables channel.messages.get() and oldMessage in messageUpdate. 0 = disabled. */
  messages?: number;
}

export interface ClientOptions {
  rest?: Partial<ConstructorParameters<typeof REST>[0]>;
  /** Gateway intents. Not yet supported by Fluxer—value is always sent as 0. Set suppressIntentWarning to silence the warning. */
  intents?: number;
  /** Suppress the warning when intents are set (Fluxer does not support intents yet). */
  suppressIntentWarning?: boolean;
  /**
   * When true, delay the Ready event until all guilds from READY (including unavailable) have been received via GUILD_CREATE.
   * Other gateway dispatches (e.g. MESSAGE_CREATE) are queued and delivered after Ready so handlers can rely on post-Ready setup.
   * GUILD_CREATE still runs during sync so the guild cache can finish loading. Default: false.
   */
  waitForGuilds?: boolean;
  /** Cache size limits (channels, guilds, users, messages). Omit or 0 = unbounded per field—see {@link CacheSizeLimits}. */
  cache?: CacheSizeLimits;
  /** Initial presence (status, custom_status, etc.) sent on identify. Can also update via PresenceUpdate after connect. */
  presence?: GatewayPresenceUpdateData;
  /**
   * When `false`, gateway shards do not emit internal debug strings (fewer allocations; less `Events.Debug` noise). Default: `true`.
   */
  gatewayDebug?: boolean;
  /**
   * When `true` (default), each gateway dispatch runs user handlers on the next macrotask (`setImmediate` / `setTimeout(0)`)
   * so heavy handlers do not block the WebSocket `message` callback. When `false`, handlers run immediately (useful for tests).
   */
  gatewayDeferHandlers?: boolean;
  /** Optional WebSocket constructor (e.g. `require('ws')` in Node for compatibility) */
  WebSocket?: new (url: string) => {
    send(data: string | ArrayBufferLike): void;
    close(code?: number): void;
    readyState: number;
    addEventListener?(type: string, listener: (e: unknown) => void): void;
    on?(event: string, cb: (data?: unknown) => void): void;
  };
}
