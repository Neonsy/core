/** Guild discovery SDK options and payloads. */

/** Options for applying a guild to discovery. */
export interface DiscoveryApplicationOptions {
  description?: string;
  /** Discovery category (`category_type` on the wire). */
  primaryCategoryId?: number | string;
  /** Custom search tags (`custom_tags` on the wire). */
  keywords?: string[];
  /** Primary language code (`primary_language` on the wire). */
  primaryLanguage?: string;
}

/** Convert {@link DiscoveryApplicationOptions} to the discovery wire body. */
export function toDiscoveryBody(options: DiscoveryApplicationOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (options.description !== undefined) body.description = options.description;
  if (options.primaryCategoryId !== undefined) {
    body.category_type =
      typeof options.primaryCategoryId === 'string'
        ? Number(options.primaryCategoryId)
        : options.primaryCategoryId;
  }
  if (options.keywords !== undefined) body.custom_tags = options.keywords;
  if (options.primaryLanguage !== undefined) body.primary_language = options.primaryLanguage;
  return body;
}

/** CamelCase view of a guild's discovery application record. */
export interface DiscoveryApplicationPayload {
  guildId: string;
  guildNsfwLevel?: number | null;
  status: string;
  description: string;
  categoryType: number;
  primaryLanguage?: string | null;
  customTags?: string[];
  appliedAt?: string;
  reviewedAt?: string | null;
}

/** CamelCase discovery status. */
export interface DiscoveryStatusPayload {
  application?: DiscoveryApplicationPayload | null;
  eligible: boolean;
  minMemberCount: number;
}

/** Map wire discovery application → camelCase. */
export function toDiscoveryApplicationPayload(data: {
  guild_id: string;
  guild_nsfw_level?: number | null;
  status: string;
  description: string;
  category_type: number;
  primary_language?: string | null;
  custom_tags?: string[];
  applied_at?: string;
  reviewed_at?: string | null;
}): DiscoveryApplicationPayload {
  return {
    guildId: data.guild_id,
    ...(data.guild_nsfw_level !== undefined ? { guildNsfwLevel: data.guild_nsfw_level } : {}),
    status: data.status,
    description: data.description,
    categoryType: data.category_type,
    ...(data.primary_language !== undefined ? { primaryLanguage: data.primary_language } : {}),
    ...(data.custom_tags !== undefined ? { customTags: data.custom_tags } : {}),
    ...(data.applied_at !== undefined ? { appliedAt: data.applied_at } : {}),
    ...(data.reviewed_at !== undefined ? { reviewedAt: data.reviewed_at } : {}),
  };
}

/** Map wire discovery status → camelCase. */
export function toDiscoveryStatusPayload(data: {
  application?: {
    guild_id: string;
    guild_nsfw_level?: number | null;
    status: string;
    description: string;
    category_type: number;
    primary_language?: string | null;
    custom_tags?: string[];
    applied_at?: string;
    reviewed_at?: string | null;
  } | null;
  eligible: boolean;
  min_member_count: number;
}): DiscoveryStatusPayload {
  return {
    ...(data.application !== undefined
      ? {
          application: data.application ? toDiscoveryApplicationPayload(data.application) : null,
        }
      : {}),
    eligible: data.eligible,
    minMemberCount: data.min_member_count,
  };
}
