import type { Snowflake } from '../Common/Snowflake.js';
import type { APIUser } from './User.js';

/** Custom sticker reference. */
export interface APISticker {
  /** Sticker ID. */
  id: Snowflake;
  /** Sticker name. */
  name: string;
  /** Sticker description. */
  description: string;
  /** Sticker tags for search. */
  tags: string[];
  /** Whether the sticker is animated. */
  animated: boolean;
  /** Whether the sticker is NSFW. */
  nsfw: boolean;
}

/** Custom sticker with user context (who created it). */
export interface APIStickerWithUser extends APISticker {
  /** User who created the sticker. */
  user?: APIUser;
}

/** Response from GET /stickers/{sticker_id}/metadata. */
export interface APIStickerMetadata {
  /** Sticker ID. */
  id: Snowflake;
  /** Guild containing the sticker. */
  guild_id: Snowflake;
  /** Sticker name. */
  name: string;
  /** Whether the sticker is animated. */
  animated: boolean;
  /** Whether the sticker can be cloned to other guilds. */
  allow_cloning: boolean;
}

/** Request body for POST /guilds/{id}/stickers (create sticker). */
export interface RESTPostAPIGuildStickerJSONBody {
  /** Sticker name. */
  name: string;
  /** Sticker image data (base64). */
  image: string;
  /** Sticker description. */
  description?: string | null;
  /** Sticker tags. */
  tags?: string[];
}

/** Request body for PATCH /guilds/{id}/stickers/{sticker_id} (update sticker). */
export interface RESTPatchAPIGuildStickerJSONBody {
  /** New sticker name. */
  name?: string;
  /** New sticker description. */
  description?: string | null;
  /** New sticker tags. */
  tags?: string[];
}

/** Response from POST /guilds/{id}/stickers/bulk (bulk create stickers). */
export interface APIGuildStickerBulkCreateResponse {
  /** Successfully created stickers. */
  success: APISticker[];
  /** Failed sticker creations with error messages. */
  failed: Array<{ name: string; error: string }>;
}
