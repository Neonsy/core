/**
 * CamelCase SDK option types that serialize to OpenAPI wire bodies.
 */

import type { OverwriteType } from '@fluxerjs/types';

/** Options for {@link GuildMemberManager.search}. */
export interface GuildMemberSearchOptions {
  query?: string;
  limit?: number;
  offset?: number;
  roleIds?: string[];
  joinedAtGte?: number;
  joinedAtLte?: number;
  isBot?: boolean;
  userCreatedAtGte?: number;
  userCreatedAtLte?: number;
  sortBy?: 'joinedAt' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

/** Convert {@link GuildMemberSearchOptions} to the wire search body. */
export function toMemberSearchBody(options: GuildMemberSearchOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (options.query !== undefined) body.query = options.query;
  if (options.limit !== undefined) body.limit = options.limit;
  if (options.offset !== undefined) body.offset = options.offset;
  if (options.roleIds !== undefined) body.role_ids = options.roleIds;
  if (options.joinedAtGte !== undefined) body.joined_at_gte = options.joinedAtGte;
  if (options.joinedAtLte !== undefined) body.joined_at_lte = options.joinedAtLte;
  if (options.isBot !== undefined) body.is_bot = options.isBot;
  if (options.userCreatedAtGte !== undefined) body.user_created_at_gte = options.userCreatedAtGte;
  if (options.userCreatedAtLte !== undefined) body.user_created_at_lte = options.userCreatedAtLte;
  if (options.sortBy !== undefined) body.sort_by = options.sortBy;
  if (options.sortOrder !== undefined) body.sort_order = options.sortOrder;
  return body;
}

/** Single channel window for {@link Client.bulkFetchMessages}. */
export interface BulkFetchMessagesRequest {
  channelId: string;
  limit: number;
  before?: string;
  after?: string;
  around?: string;
}

/** Convert bulk-fetch requests to wire items. */
export function toBulkFetchWire(requests: readonly BulkFetchMessagesRequest[]): Array<{
  channel_id: string;
  limit: number;
  before?: string;
  after?: string;
  around?: string;
}> {
  return requests.map((r) => ({
    channel_id: r.channelId,
    limit: r.limit,
    ...(r.before !== undefined ? { before: r.before } : {}),
    ...(r.after !== undefined ? { after: r.after } : {}),
    ...(r.around !== undefined ? { around: r.around } : {}),
  }));
}

/** Options for {@link Webhook.edit}. */
export interface WebhookEditOptions {
  name?: string;
  avatar?: string | null;
  /** Move webhook to another channel (bot auth only). */
  channelId?: string;
}

/** Options for creating/editing packs. */
export interface PackCreateOptions {
  name: string;
  description?: string | null;
}

export interface PackEditOptions {
  name?: string;
  description?: string | null;
}

/**
 * Options for guild discovery apply/edit.
 * Maps to OpenAPI: `description`, `category_type`, `custom_tags`.
 */
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

/** CamelCase presence for {@link ClientUser.setPresence}. */
export interface PresenceUpdateOptions {
  status: 'online' | 'idle' | 'dnd' | 'invisible';
  since?: number | null;
  afk?: boolean;
  activities?: Array<{ name: string; type: number; url?: string | null }>;
  customStatus?: {
    text?: string | null;
    emojiName?: string | null;
    emojiId?: string | null;
  } | null;
}

/** Convert presence options to gateway opcode 3 payload. */
export function toPresenceWire(options: PresenceUpdateOptions): Record<string, unknown> {
  const body: Record<string, unknown> = { status: options.status };
  if (options.since !== undefined) body.since = options.since;
  if (options.afk !== undefined) body.afk = options.afk;
  if (options.activities !== undefined) body.activities = options.activities;
  if (options.customStatus !== undefined) {
    body.custom_status =
      options.customStatus === null
        ? null
        : {
            text: options.customStatus.text,
            emoji_name: options.customStatus.emojiName,
            emoji_id: options.customStatus.emojiId,
          };
  }
  return body;
}

/** Sudo / MFA verification for sensitive operations. */
export interface SudoVerificationOptions {
  password?: string;
  mfaMethod?: 'totp' | 'webauthn';
  mfaCode?: string;
  webauthnResponse?: Record<string, unknown>;
  webauthnChallenge?: string;
}

/** Convert {@link SudoVerificationOptions} to the wire sudo body. */
export function toSudoBody(options: SudoVerificationOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (options.password !== undefined) body.password = options.password;
  if (options.mfaMethod !== undefined) body.mfa_method = options.mfaMethod;
  if (options.mfaCode !== undefined) body.mfa_code = options.mfaCode;
  if (options.webauthnResponse !== undefined) body.webauthn_response = options.webauthnResponse;
  if (options.webauthnChallenge !== undefined) body.webauthn_challenge = options.webauthnChallenge;
  return body;
}

/** Options for creating a pack invite. */
export interface PackInviteCreateOptions {
  maxUses?: number;
  maxAge?: number;
  unique?: boolean;
}

/** Convert {@link PackInviteCreateOptions} to the pack invite wire body. */
export function toPackInviteBody(options: PackInviteCreateOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (options.maxUses !== undefined) body.max_uses = options.maxUses;
  if (options.maxAge !== undefined) body.max_age = options.maxAge;
  if (options.unique !== undefined) body.unique = options.unique;
  return body;
}

/** Options for creating a pack/guild emoji. */
export interface ExpressionCreateOptions {
  name: string;
  image: string;
}

/** Convert {@link ExpressionCreateOptions} to the emoji create wire body. */
export function toEmojiCreateBody(options: ExpressionCreateOptions): Record<string, unknown> {
  return { name: options.name, image: options.image };
}

/** Options for editing a pack/guild emoji. */
export interface ExpressionEditOptions {
  name: string;
}

/** Convert {@link ExpressionEditOptions} to the emoji edit wire body. */
export function toEmojiEditBody(options: ExpressionEditOptions): Record<string, unknown> {
  return { name: options.name };
}

/** Options for creating a pack/guild sticker. */
export interface StickerCreateOptions {
  name: string;
  /** Base64 image data (`image` on the wire). */
  file: string;
  description?: string | null;
  tags?: string[];
}

/** Options for editing a pack/guild sticker. */
export interface StickerEditOptions {
  name?: string;
  description?: string | null;
  tags?: string[];
}

/** Convert {@link StickerCreateOptions} to the sticker create wire body. */
export function toStickerCreateBody(options: StickerCreateOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: options.name,
    image: options.file,
  };
  if (options.description !== undefined) body.description = options.description;
  if (options.tags !== undefined) body.tags = options.tags;
  return body;
}

/** Convert {@link StickerEditOptions} to the sticker edit wire body. */
export function toStickerEditBody(options: StickerEditOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (options.name !== undefined) body.name = options.name;
  if (options.description !== undefined) body.description = options.description;
  if (options.tags !== undefined) body.tags = options.tags;
  return body;
}

/** Options for {@link GuildMember.edit}. */
export interface GuildMemberEditOptions {
  nick?: string | null;
  roles?: string[];
  avatar?: string | null;
  banner?: string | null;
  bio?: string | null;
  pronouns?: string | null;
  accentColor?: number | null;
  profileFlags?: number | null;
  mute?: boolean;
  deaf?: boolean;
  communicationDisabledUntil?: string | null;
  timeoutReason?: string | null;
  channelId?: string | null;
  connectionId?: string | null;
}

/** Convert {@link GuildMemberEditOptions} to the member PATCH wire body. */
export function toMemberEditBody(options: GuildMemberEditOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (options.nick !== undefined) body.nick = options.nick;
  if (options.roles !== undefined) body.roles = options.roles;
  if (options.avatar !== undefined) body.avatar = options.avatar;
  if (options.banner !== undefined) body.banner = options.banner;
  if (options.bio !== undefined) body.bio = options.bio;
  if (options.pronouns !== undefined) body.pronouns = options.pronouns;
  if (options.accentColor !== undefined) body.accent_color = options.accentColor;
  if (options.profileFlags !== undefined) body.profile_flags = options.profileFlags;
  if (options.mute !== undefined) body.mute = options.mute;
  if (options.deaf !== undefined) body.deaf = options.deaf;
  if (options.communicationDisabledUntil !== undefined) {
    body.communication_disabled_until = options.communicationDisabledUntil;
  }
  if (options.timeoutReason !== undefined) body.timeout_reason = options.timeoutReason;
  if (options.channelId !== undefined) body.channel_id = options.channelId;
  if (options.connectionId !== undefined) body.connection_id = options.connectionId;
  return body;
}

/** Permission overwrite in camelCase for channel edit. */
export interface ChannelPermissionOverwriteOptions {
  id: string;
  type: OverwriteType;
  allow?: string;
  deny?: string;
}

/** Options for {@link GuildChannel.edit}. */
export interface ChannelEditOptions {
  name?: string | null;
  topic?: string | null;
  parentId?: string | null;
  bitrate?: number | null;
  userLimit?: number | null;
  nsfw?: boolean;
  rateLimitPerUser?: number;
  rtcRegion?: string | null;
  permissionOverwrites?: ChannelPermissionOverwriteOptions[];
}

/** Convert {@link ChannelEditOptions} to the channel PATCH wire body. */
export function toChannelEditBody(options: ChannelEditOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (options.name !== undefined) body.name = options.name;
  if (options.topic !== undefined) body.topic = options.topic;
  if (options.parentId !== undefined) body.parent_id = options.parentId;
  if (options.bitrate !== undefined) body.bitrate = options.bitrate;
  if (options.userLimit !== undefined) body.user_limit = options.userLimit;
  if (options.nsfw !== undefined) body.nsfw = options.nsfw;
  if (options.rateLimitPerUser !== undefined) {
    body.rate_limit_per_user = options.rateLimitPerUser;
  }
  if (options.rtcRegion !== undefined) body.rtc_region = options.rtcRegion;
  if (options.permissionOverwrites !== undefined) {
    body.permission_overwrites = options.permissionOverwrites;
  }
  return body;
}

/** Options for {@link GuildChannel.createInvite}. */
export interface ChannelInviteCreateOptions {
  maxUses?: number;
  maxAge?: number;
  unique?: boolean;
  temporary?: boolean;
}

/** Convert {@link ChannelInviteCreateOptions} to the invite create wire body. */
export function toChannelInviteBody(options: ChannelInviteCreateOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (options.maxUses !== undefined) body.max_uses = options.maxUses;
  if (options.maxAge !== undefined) body.max_age = options.maxAge;
  if (options.unique !== undefined) body.unique = options.unique;
  if (options.temporary !== undefined) body.temporary = options.temporary;
  return body;
}

/** Attachment keep/add entry for message edit (camelCase). */
export interface MessageAttachmentEdit {
  id: number | string;
  filename?: string;
  uploadFilename?: string;
  fileSize?: number;
  contentType?: string;
  title?: string | null;
  description?: string | null;
  flags?: number;
}

/** Convert {@link MessageAttachmentEdit} entries to wire attachment objects. */
export function toMessageAttachmentEditWire(
  attachments: readonly MessageAttachmentEdit[],
): Array<Record<string, unknown>> {
  return attachments.map((a) => {
    const out: Record<string, unknown> = { id: a.id };
    if (a.filename !== undefined) out.filename = a.filename;
    if (a.uploadFilename !== undefined) out.upload_filename = a.uploadFilename;
    if (a.fileSize !== undefined) out.file_size = a.fileSize;
    if (a.contentType !== undefined) out.content_type = a.contentType;
    if (a.title !== undefined) out.title = a.title;
    if (a.description !== undefined) out.description = a.description;
    if (a.flags !== undefined) out.flags = a.flags;
    return out;
  });
}

/** Plan item for {@link Channel.requestAttachmentUploads}. */
export interface AttachmentUploadPlanItem {
  id: number;
  filename: string;
  fileSize: number;
  contentType: string;
}

/** Convert plan items to the attachments request wire body. */
export function toAttachmentUploadPlanBody(attachments: readonly AttachmentUploadPlanItem[]): {
  attachments: Array<Record<string, unknown>>;
} {
  return {
    attachments: attachments.map((a) => ({
      id: a.id,
      filename: a.filename,
      file_size: a.fileSize,
      content_type: a.contentType,
    })),
  };
}

/** Multipart complete item for {@link Channel.completeAttachmentUploads}. */
export interface AttachmentUploadCompleteItem {
  uploadFilename: string;
  uploadId: string;
}

/** Convert complete items to the attachments/complete wire body. */
export function toAttachmentUploadCompleteBody(uploads: readonly AttachmentUploadCompleteItem[]): {
  uploads: Array<{ upload_filename: string; upload_id: string }>;
} {
  return {
    uploads: uploads.map((u) => ({
      upload_filename: u.uploadFilename,
      upload_id: u.uploadId,
    })),
  };
}

/** Part in a multipart upload plan response. */
export interface AttachmentUploadPartPayload {
  partNumber: number;
  uploadUrl: string;
}

/** Singlepart plan response item. */
export interface AttachmentUploadSinglepartPayload {
  id: number;
  filename: string;
  uploadFilename: string;
  fileSize: number;
  contentType: string;
  uploadMode: 'singlepart';
  uploadUrl: string;
}

/** Multipart plan response item. */
export interface AttachmentUploadMultipartPayload {
  id: number;
  filename: string;
  uploadFilename: string;
  fileSize: number;
  contentType: string;
  uploadMode: 'multipart';
  uploadId: string;
  partSize: number;
  parts: AttachmentUploadPartPayload[];
}

export type AttachmentUploadPlanResponseItem =
  | AttachmentUploadSinglepartPayload
  | AttachmentUploadMultipartPayload;

/** CamelCase response from {@link Channel.requestAttachmentUploads}. */
export interface AttachmentUploadPlanResponse {
  attachments: AttachmentUploadPlanResponseItem[];
}

/** CamelCase response from {@link Channel.completeAttachmentUploads}. */
export interface AttachmentUploadCompleteResponse {
  uploads: Array<{ uploadFilename: string }>;
}

/** Map wire attachment plan response → camelCase. */
export function toAttachmentUploadPlanResponse(data: {
  attachments: Array<{
    id: number;
    filename: string;
    upload_filename: string;
    file_size: number;
    content_type: string;
    upload_mode: 'singlepart' | 'multipart';
    upload_url?: string;
    upload_id?: string;
    part_size?: number;
    parts?: Array<{ part_number: number; upload_url: string }>;
  }>;
}): AttachmentUploadPlanResponse {
  return {
    attachments: data.attachments.map((item) => {
      const base = {
        id: item.id,
        filename: item.filename,
        uploadFilename: item.upload_filename,
        fileSize: item.file_size,
        contentType: item.content_type,
      };
      if (item.upload_mode === 'multipart') {
        const parts = (item.parts ?? []).map((p) => ({
          partNumber: p.part_number,
          uploadUrl: p.upload_url,
        }));
        return {
          ...base,
          uploadMode: 'multipart' as const,
          uploadId: item.upload_id ?? '',
          partSize: item.part_size ?? 0,
          parts,
        };
      }
      return {
        ...base,
        uploadMode: 'singlepart' as const,
        uploadUrl: item.upload_url ?? '',
      };
    }),
  };
}

/** CamelCase RTC region from {@link Channel.fetchRtcRegions}. */
export interface RtcRegionPayload {
  id: string;
  name: string;
  emoji: string;
}

/** CamelCase slowmode state from {@link Channel.fetchSlowmode}. */
export interface ChannelSlowmodePayload {
  rateLimitPerUser: number;
  retryAfterMs: number;
  nextSendAllowedAt: string | null;
}

/** CamelCase discovery application. */
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

/** CamelCase user profile sub-object. */
export interface UserProfilePayload {
  pronouns?: string | null;
  bio?: string | null;
  banner?: string | null;
  accentColor?: number | null;
  bannerColor?: number | null;
  theme?: string | null;
}

/** CamelCase connected account. */
export interface ConnectedAccountPayload {
  name?: string | null;
  type?: string | null;
}

/** CamelCase profile response from {@link UserManager.fetchWithProfile}. */
export interface ProfilePayload {
  userProfile?: UserProfilePayload | null;
  mutualGuilds?: Array<{ id: string }> | null;
  mutualGuildIds?: string[] | null;
  connectedAccounts?: ConnectedAccountPayload[] | null;
}

/** Map wire profile → camelCase. */
export function toProfilePayload(data: {
  user_profile?: {
    pronouns?: string | null;
    bio?: string | null;
    banner?: string | null;
    accent_color?: number | null;
    banner_color?: number | null;
    theme?: string | null;
  } | null;
  mutual_guilds?: Array<{ id: string }> | null;
  mutual_guild_ids?: string[] | null;
  connected_accounts?: Array<{ name?: string | null; type?: string | null }> | null;
}): ProfilePayload {
  const profile = data.user_profile;
  return {
    ...(data.user_profile !== undefined
      ? {
          userProfile: profile
            ? {
                ...(profile.pronouns !== undefined ? { pronouns: profile.pronouns } : {}),
                ...(profile.bio !== undefined ? { bio: profile.bio } : {}),
                ...(profile.banner !== undefined ? { banner: profile.banner } : {}),
                ...(profile.accent_color !== undefined
                  ? { accentColor: profile.accent_color }
                  : {}),
                ...(profile.banner_color !== undefined
                  ? { bannerColor: profile.banner_color }
                  : {}),
                ...(profile.theme !== undefined ? { theme: profile.theme } : {}),
              }
            : null,
        }
      : {}),
    ...(data.mutual_guilds !== undefined ? { mutualGuilds: data.mutual_guilds } : {}),
    ...(data.mutual_guild_ids !== undefined ? { mutualGuildIds: data.mutual_guild_ids } : {}),
    ...(data.connected_accounts !== undefined
      ? { connectedAccounts: data.connected_accounts }
      : {}),
  };
}

/** Small emoji payload from pack list/create. */
export interface PackEmojiPayload {
  id: string;
  name: string;
  animated?: boolean;
}

/** Small sticker payload from pack list/create. */
export interface PackStickerPayload {
  id: string;
  name: string;
  description: string;
  tags: string[];
  animated: boolean;
  nsfw: boolean;
}

/** Invite metadata payload (camelCase). */
export interface PackInvitePayload {
  code: string;
  maxUses?: number;
  maxAge?: number;
  uses?: number;
  temporary?: boolean;
  unique?: boolean;
  createdAt?: string;
  expiresAt?: string | null;
}

/** Bulk create result (camelCase). */
export interface PackBulkCreatePayload<T> {
  success: T[];
  failed: Array<{ name: string; error: string }>;
}
