import type {
  APIGuild,
  APIRole,
  DefaultMessageNotifications,
  GuildExplicitContentFilter,
  GuildFeature,
  GuildMFALevel,
  GuildNSFWLevel,
  GuildVerificationLevel,
  SplashCardAlignment,
  SystemChannelFlagsValue,
} from '@fluxerjs/types';

export type GuildData = APIGuild & { roles?: APIRole[]; ownerId?: string };

/** CamelCase SDK options for PATCH /guilds/{id}. */
export type GuildEditOptions = {
  name?: string;
  icon?: string | null;
  systemChannelId?: string | null;
  systemChannelFlags?: number | SystemChannelFlagsValue;
  afkChannelId?: string | null;
  afkTimeout?: number;
  defaultMessageNotifications?: DefaultMessageNotifications;
  verificationLevel?: GuildVerificationLevel;
  mfaLevel?: GuildMFALevel;
  explicitContentFilter?: GuildExplicitContentFilter;
  banner?: string | null;
  splash?: string | null;
  embedSplash?: string | null;
  splashCardAlignment?: SplashCardAlignment;
  nsfwLevel?: GuildNSFWLevel;
  features?: GuildFeature[];
};

/** Serialize {@link GuildEditOptions} to OpenAPI guild update body. */
export function toGuildEditBody(options: GuildEditOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (options.name !== undefined) body.name = options.name;
  if (options.icon !== undefined) body.icon = options.icon;
  if (options.systemChannelId !== undefined) body.system_channel_id = options.systemChannelId;
  if (options.systemChannelFlags !== undefined) {
    body.system_channel_flags = options.systemChannelFlags;
  }
  if (options.afkChannelId !== undefined) body.afk_channel_id = options.afkChannelId;
  if (options.afkTimeout !== undefined) body.afk_timeout = options.afkTimeout;
  if (options.defaultMessageNotifications !== undefined) {
    body.default_message_notifications = options.defaultMessageNotifications;
  }
  if (options.verificationLevel !== undefined) {
    body.verification_level = options.verificationLevel;
  }
  if (options.mfaLevel !== undefined) body.mfa_level = options.mfaLevel;
  if (options.explicitContentFilter !== undefined) {
    body.explicit_content_filter = options.explicitContentFilter;
  }
  if (options.banner !== undefined) body.banner = options.banner;
  if (options.splash !== undefined) body.splash = options.splash;
  if (options.embedSplash !== undefined) body.embed_splash = options.embedSplash;
  if (options.splashCardAlignment !== undefined) {
    body.splash_card_alignment = options.splashCardAlignment;
  }
  if (options.nsfwLevel !== undefined) body.nsfw_level = options.nsfwLevel;
  if (options.features !== undefined) body.features = options.features;
  return body;
}

export type GuildBanOptions = {
  reason?: string;
  /** Delete message history for this many days (0–7). */
  deleteMessageDays?: number;
  /** Temporary ban duration in seconds. */
  banDurationSeconds?: number;
};

export function toGuildBanBody(options: GuildBanOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (options.reason !== undefined) body.reason = options.reason;
  if (options.deleteMessageDays !== undefined) {
    body.delete_message_days = options.deleteMessageDays;
  }
  if (options.banDurationSeconds !== undefined) {
    body.ban_duration_seconds = options.banDurationSeconds;
  }
  return body;
}

export type ChannelPositionUpdate = {
  id: string;
  position?: number;
  parentId?: string | null;
  lockPermissions?: boolean;
};

export function toChannelPositionBody(
  updates: ChannelPositionUpdate[],
): Array<Record<string, unknown>> {
  return updates.map((u) => {
    const row: Record<string, unknown> = { id: u.id };
    if (u.position !== undefined) row.position = u.position;
    if (u.parentId !== undefined) row.parent_id = u.parentId;
    if (u.lockPermissions !== undefined) row.lock_permissions = u.lockPermissions;
    return row;
  });
}
