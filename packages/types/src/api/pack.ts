import type { Snowflake } from '../common/snowflake.js';

/**
 * Expression pack kind (OpenAPI PackType).
 * - `emoji` — emoji pack
 * - `sticker` — sticker pack
 */
export type PackType = 'emoji' | 'sticker';

/** Request body for POST /packs (create pack). */
export interface APIPackCreateRequest {
  /** Pack name. */
  name: string;
  /** Pack description. */
  description?: string | null;
}

/** Request body for PATCH /packs/{id} (update pack). */
export interface APIPackUpdateRequest {
  /** Pack name. */
  name?: string;
  /** Pack description. */
  description?: string | null;
}

/** Pack summary from GET /packs or pack list responses. */
export interface APIPackSummary {
  /** Pack ID. */
  id: Snowflake;
  /** Pack name. */
  name: string;
  /** Pack description. */
  description: string | null;
  /** Pack type (emoji or sticker). */
  type: PackType;
  /** Creator user ID. */
  creator_id: Snowflake;
  /** ISO-8601 timestamp when created. */
  created_at: string;
  /** ISO-8601 timestamp when last updated. */
  updated_at: string;
  /** ISO-8601 timestamp when installed (if installed). */
  installed_at?: string;
}

/** Dashboard section for one pack type (emoji or sticker). */
export interface APIPackDashboardSection {
  /** Limit of installed packs. */
  installed_limit: number;
  /** Limit of created packs. */
  created_limit: number;
  /** Installed packs. */
  installed: APIPackSummary[];
  /** Created packs. */
  created: APIPackSummary[];
}

/** Response from GET /packs/dashboard (user's pack dashboard). */
export interface APIPackDashboard {
  /** Emoji pack section. */
  emoji: APIPackDashboardSection;
  /** Sticker pack section. */
  sticker: APIPackDashboardSection;
}
