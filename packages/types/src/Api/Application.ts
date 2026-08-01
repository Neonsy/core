import type { Snowflake } from '../Common/Snowflake.js';
import type { APIMessage } from './Message.js';
import type { APIUserPartial } from './User.js';

/** Bot/application info from GET /applications/@me. */
export interface APIApplicationMe {
  /** Application ID. */
  id: Snowflake;
  /** Application name. */
  name: string;
  /** Application icon hash. */
  icon?: string | null;
  /** Application description. */
  description?: string | null;
  /** Whether the bot is public (can be added by anyone). */
  bot_public?: boolean;
  /** Whether the bot requires OAuth2 code grant flow. */
  bot_require_code_grant?: boolean;
  /** Verification key for interactions. */
  verify_key?: string;
  /** Application owner. */
  owner?: APIUserPartial | null;
  /** Application flags bitfield. */
  flags?: number;
}

/** Application from GET /oauth2/applications/@me. */
export interface APIOAuthApplication {
  /** Application ID. */
  id: Snowflake;
  /** Application name. */
  name: string;
  /** OAuth2 redirect URIs. */
  redirect_uris?: string[];
  /** Whether the bot is public. */
  bot_public?: boolean;
  /** Whether the bot requires OAuth2 code grant flow. */
  bot_require_code_grant?: boolean;
  /** OAuth2 client secret. */
  client_secret?: string;
  /** Associated bot user. */
  bot?: APIUserPartial | null;
  /** Application icon hash. */
  icon?: string | null;
  /** Application description. */
  description?: string | null;
}

/** Response from GET /users/check-tag. */
export interface APIUserTagCheck {
  /** Whether the username#discriminator is taken. */
  taken: boolean;
}

/** Response from POST /users/@me/preload-messages — map of channel ID → latest message or null. */
export type APIPreloadMessagesResponse = Record<string, APIMessage | null>;

/** Request body for POST /users/@me/preload-messages. */
export interface RESTPostAPIPreloadMessagesJSONBody {
  /** Channel IDs to preload latest messages for. */
  channels: Snowflake[];
}
