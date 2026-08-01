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

export type GuildData = Partial<APIGuild> & {
  id: string;
  roles?: APIRole[];
  ownerId?: string;
};

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

export type GuildBanOptions = {
  reason?: string;
  /** Delete message history for this many days (0–7). */
  deleteMessageDays?: number;
  /** Temporary ban duration in seconds. */
  banDurationSeconds?: number;
};

export type ChannelPositionUpdate = {
  id: string;
  position?: number;
  parentId?: string | null;
  lockPermissions?: boolean;
};
