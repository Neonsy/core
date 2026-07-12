import type { REST } from '@fluxerjs/rest';
import type { APIInstance, APIInstanceEndpoints, GatewayPresenceUpdateData } from '@fluxerjs/types';

/**
 * Optional cache size limits (FIFO eviction when exceeded).
 * Use `0` for unbounded growth on that bucket.
 * @see {@link DEFAULT_CACHE_LIMITS}
 */
export interface CacheSizeLimits {
  /** Max channels cached globally. `0` = unbounded. */
  channels?: number;
  /** Max guilds cached. `0` = unbounded. */
  guilds?: number;
  /** Max users cached globally. `0` = unbounded. */
  users?: number;
  /** Max messages per channel (`channel.messages.get` / `oldMessage`). `0` = off. */
  messages?: number;
  /** Max members per guild. `0` = unbounded. */
  members?: number;
}

/**
 * Default cache policy — opt out per field with `0`.
 * Applied when {@link ClientOptions.cache} is omitted or partial.
 */
export const DEFAULT_CACHE_LIMITS: Required<CacheSizeLimits> = {
  guilds: 200,
  users: 10_000,
  channels: 5_000,
  messages: 50,
  members: 5_000,
};

/**
 * Configuration options for {@link Client}.
 * @example
 * ```ts
 * const client = new Client({
 *   instance: { api: 'https://api.example.com' },
 *   cache: { guilds: 100, messages: 20 },
 *   waitForGuilds: true,
 * });
 * ```
 */
export interface ClientOptions {
  /**
   * Instance endpoints for this client (API, CDN, invite, etc.).
   * Pass a partial map to override hosted defaults, or a full discovery document.
   * Prefer this over `rest.api` for multi-instance / self-hosted bots.
   * @see {@link Client.fromDiscovery}
   */
  instance?: Partial<APIInstanceEndpoints> | APIInstance;
  /**
   * REST options. Prefer {@link ClientOptions.instance} for the API host.
   * If both `instance.api` (or resolved default) and `rest.api` are set and differ, construction throws.
   */
  rest?: Partial<ConstructorParameters<typeof REST>[0]>;
  /**
   * Gateway intents (Fluxer currently always sends `0`).
   * Reserved for future use.
   */
  intents?: number;
  /** Silence the intents-not-supported warning. */
  suppressIntentWarning?: boolean;
  /**
   * Delay Ready until all READY guilds arrive via GUILD_CREATE; queue other dispatches until then.
   * @default false
   */
  waitForGuilds?: boolean;
  /**
   * Cache size limits per bucket. Defaults to {@link DEFAULT_CACHE_LIMITS}. Pass `0` per field for unbounded.
   * @see {@link CacheSizeLimits}
   */
  cache?: CacheSizeLimits;
  /**
   * Default allowed mentions when a send omits them (per-call wins).
   * @example
   * ```ts
   * defaultAllowedMentions: {
   *   parse: ['users'],
   *   repliedUser: false,
   * }
   * ```
   */
  defaultAllowedMentions?: {
    /** Mention types to parse (`roles`, `users`, `everyone`). */
    parse?: Array<'roles' | 'users' | 'everyone'>;
    /** Specific role IDs allowed to be mentioned. */
    roles?: string[];
    /** Specific user IDs allowed to be mentioned. */
    users?: string[];
    /** Whether to ping the user being replied to. */
    repliedUser?: boolean;
  };
  /**
   * Default reply ping for `message.reply` when `ping` is omitted.
   * @default true
   */
  defaultReplyPing?: boolean;
  /**
   * Initial presence on identify (also updatable via `client.user.setPresence`).
   */
  presence?: GatewayPresenceUpdateData;
  /**
   * Emit gateway debug strings.
   * @default true
   */
  gatewayDebug?: boolean;
  /**
   * Defer dispatch handlers to the next macrotask so WS `message` stays responsive.
   * @default true (`false` useful in tests)
   */
  gatewayDeferHandlers?: boolean;
  /**
   * Optional WebSocket constructor (e.g. `ws` in Node).
   * Provide if the runtime lacks a native WebSocket implementation.
   */
  WebSocket?: new (
    url: string,
  ) => {
    send(data: string | ArrayBufferLike): void;
    close(code?: number): void;
    readyState: number;
    addEventListener?(type: string, listener: (e: unknown) => void): void;
    on?(event: string, cb: (data?: unknown) => void): void;
  };
}
