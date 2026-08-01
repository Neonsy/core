import type { Snowflake } from '../Common/Snowflake.js';
import type { GuildNSFWLevel } from './Guild.js';

/** Response from GET /guilds/{id}/discovery (discovery eligibility and current application). */
export interface APIDiscoveryStatus {
  /** Current discovery application (if applied). */
  application?: APIDiscoveryApplication | null;
  /** Whether the guild is eligible for discovery. */
  eligible: boolean;
  /** Minimum member count required for discovery. */
  min_member_count: number;
}

/** Discovery application payload (GET status / POST apply / PATCH edit). */
export interface APIDiscoveryApplication {
  /** Guild ID. */
  guild_id: Snowflake;
  /** Guild NSFW level. */
  guild_nsfw_level?: GuildNSFWLevel | null;
  /** Application status (pending, approved, rejected, etc.). */
  status: string;
  /** Guild description for discovery. */
  description: string;
  /** Discovery category ID from the discovery categories list. */
  category_type: number;
  /** Primary language code. */
  primary_language?: string | null;
  /** Custom tags for search. */
  custom_tags?: string[];
  /** ISO-8601 timestamp when applied. */
  applied_at?: string;
  /** ISO-8601 timestamp when reviewed. */
  reviewed_at?: string | null;
}

/** Request body for POST /guilds/{id}/discovery (apply for discovery). */
export interface RESTPostAPIGuildDiscoveryJSONBody {
  /** Guild description. */
  description: string;
  /** Discovery category ID. */
  category_type: number;
  /** Primary language code. */
  primary_language?: string;
  /** Custom tags. */
  custom_tags?: string[];
}

/** Request body for PATCH /guilds/{id}/discovery (update discovery application). */
export interface RESTPatchAPIGuildDiscoveryJSONBody {
  /** Guild description. */
  description?: string;
  /** Discovery category ID. */
  category_type?: number;
  /** Primary language code. */
  primary_language?: string;
  /** Custom tags. */
  custom_tags?: string[];
}
