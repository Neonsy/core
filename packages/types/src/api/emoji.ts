import type { Snowflake } from '../Common/Snowflake.js';
import type { APIUser } from './User.js';

/** Custom emoji reference. */
export interface APIEmoji {
  /** Emoji ID. */
  id: Snowflake;
  /** Emoji name. */
  name: string;
  /** Whether the emoji is animated. */
  animated: boolean;
  /** Whether the emoji is NSFW. */
  nsfw: boolean;
}

/** Custom emoji with user context (who created it). */
export interface APIEmojiWithUser extends APIEmoji {
  /** User who created the emoji. */
  user?: APIUser;
}

/** Response from GET /emojis/{emoji_id}/metadata. */
export interface APIEmojiMetadata {
  /** Emoji ID. */
  id: Snowflake;
  /** Guild containing the emoji. */
  guild_id: Snowflake;
  /** Emoji name. */
  name: string;
  /** Whether the emoji is animated. */
  animated: boolean;
  /** Whether the emoji can be cloned to other guilds. */
  allow_cloning: boolean;
}

/** Request body for POST /guilds/{id}/emojis (create emoji). */
export interface RESTPostAPIGuildEmojiJSONBody {
  /** Emoji name. */
  name: string;
  /** Emoji image data (base64). */
  image: string;
}

/** Request body for PATCH /guilds/{id}/emojis/{emoji_id} (update emoji). */
export interface RESTPatchAPIGuildEmojiJSONBody {
  /** New emoji name. */
  name: string;
}

/** Response from POST /guilds/{id}/emojis/bulk (bulk create emojis). */
export interface APIGuildEmojiBulkCreateResponse {
  /** Successfully created emojis. */
  success: APIEmoji[];
  /** Failed emoji creations with error messages. */
  failed: Array<{ name: string; error: string }>;
}
