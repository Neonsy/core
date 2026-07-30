export { Client, type ClientEvents, type ClientEventMethods } from './client/Client.js';
export {
  DiagnosticsController,
  type DiagnosticComponentRegistration,
  type DiagnosticData,
  type DiagnosticError,
  type DiagnosticEvent,
  type DiagnosticInputData,
  type DiagnosticLevel,
  type DiagnosticReport,
  type DiagnosticReportContext,
  type DiagnosticSink,
  type DiagnosticsOptions,
  type DiagnosticsStats,
  type DiagnosticSource,
  type DiagnosticValue,
} from '@fluxerjs/diagnostics';
export type {
  MessageDeleteBulkPayload,
  InviteDeletePayload,
  TypingStartPayload,
  GuildEmojisUpdatePayload,
  AuditLogEntryPayload,
  AuditLogFetchPayload,
  VanityURLPayload,
  GuildMemberSearchHit,
  GuildMemberSearchPayload,
  PackSummaryPayload,
  PartialUserGuildPayload,
  MessageReactionRemoveAllPayload,
  MessageReactionPayload,
  MessageReactionRemoveEmojiPayload,
  GuildRoleDeletePayload,
  ReactionEmojiPayload,
  PresenceUpdatePayload,
} from './client/eventPayloads.js';
export { ChannelManager } from './client/ChannelManager.js';
export { GuildMemberManager } from './client/GuildMemberManager.js';
export {
  UserManager,
  type FetchedUserWithProfile,
} from './client/UserManager.js';
export {
  PackManager,
  toPackSummaryPayload,
  type PackDashboardPayload,
  type PackDashboardSectionPayload,
} from './client/PackManager.js';
export {
  MessageManager,
  type FetchMessagesOptions,
  type BulkFetchMessagesOptions,
  type BulkFetchMessagesResult,
  type BulkFetchMessagesChannelResult,
} from './client/MessageManager.js';
export { ClientUser } from './client/ClientUser.js';
export {
  toMemberSearchBody,
  toBulkFetchWire,
  toPresenceWire,
  toDiscoveryBody,
  toSudoBody,
  toPackInviteBody,
  toEmojiCreateBody,
  toEmojiEditBody,
  toStickerCreateBody,
  toStickerEditBody,
  toMemberEditBody,
  toChannelEditBody,
  toChannelInviteBody,
  toMessageAttachmentEditWire,
  toAttachmentUploadPlanBody,
  toAttachmentUploadCompleteBody,
  toDiscoveryStatusPayload,
  toDiscoveryApplicationPayload,
  toProfilePayload,
  type GuildMemberSearchOptions,
  type BulkFetchMessagesRequest,
  type WebhookEditOptions,
  type PackCreateOptions,
  type PackEditOptions,
  type DiscoveryApplicationOptions,
  type PresenceUpdateOptions,
  type SudoVerificationOptions,
  type PackInviteCreateOptions,
  type ExpressionCreateOptions,
  type ExpressionEditOptions,
  type StickerCreateOptions,
  type StickerEditOptions,
  type GuildMemberEditOptions,
  type ChannelEditOptions,
  type ChannelInviteCreateOptions,
  type MessageAttachmentEdit,
  type AttachmentUploadPlanItem,
  type AttachmentUploadCompleteItem,
  type AttachmentUploadPlanResponse,
  type AttachmentUploadCompleteResponse,
  type DiscoveryStatusPayload,
  type DiscoveryApplicationPayload,
  type ProfilePayload,
  type RtcRegionPayload,
  type ChannelSlowmodePayload,
  type PackEmojiPayload,
  type PackStickerPayload,
  type PackInvitePayload,
  type PackBulkCreatePayload,
} from './client/sdkOptions.js';
export { Base } from './structures/Base.js';
export { User } from './structures/User.js';
export { Guild } from './structures/Guild.js';
export {
  Channel,
  GuildChannel,
  TextChannel,
  VoiceChannel,
  CategoryChannel,
  LinkChannel,
  DMChannel,
  type FetchPinnedMessagesOptions,
  type PinnedMessagesPage,
  type UploadFileForSend,
} from './structures/Channel.js';
export {
  Message,
  type MessageEditOptions,
  type MessageSendOptions,
  type ReplyOptions,
  type AllowedMentionsOptions,
  type MessageReplyTarget,
} from './structures/Message.js';
export { AllowedMentions } from './util/messageUtils.js';
export type { PartialMessage } from './structures/PartialMessage.js';
export { MessageReaction } from './structures/MessageReaction.js';
export {
  Webhook,
  type WebhookSendOptions,
  type WebhookMessageEditOptions,
} from './structures/Webhook.js';
export { GuildMember } from './structures/GuildMember.js';
export {
  GuildMemberRoleManager,
  type RoleResolvable,
} from './structures/GuildMemberRoleManager.js';
export { Role } from './structures/Role.js';
export type { RoleCreateOptions, RoleEditOptions } from './structures/roleOptions.js';
export { Invite } from './structures/Invite.js';
export { GuildBan } from './structures/GuildBan.js';
export { GuildEmoji } from './structures/GuildEmoji.js';
export { GuildSticker } from './structures/GuildSticker.js';
export { Events } from './util/Events.js';
export {
  MessageCollector,
  type MessageCollectorOptions,
  type MessageCollectorEndReason,
} from './util/MessageCollector.js';
export {
  ReactionCollector,
  type ReactionCollectorOptions,
  type ReactionCollectorEndReason,
  type CollectedReaction,
} from './util/ReactionCollector.js';
export { FluxerError, type FluxerErrorOptions } from './errors/FluxerError.js';
export { ErrorCodes } from './errors/ErrorCodes.js';

// Re-export builders for convenience
export { EmbedBuilder, MessagePayload, AttachmentBuilder } from '@fluxerjs/builders';

// Re-export Routes, GatewayOpcodes, MessageAttachmentFlags for REST/gateway API calls
export {
  Routes,
  GatewayOpcodes,
  MessageAttachmentFlags,
  MessageFlags,
  MessageReferenceType,
  MessageType,
  ChannelType,
  OverwriteType,
  InviteType,
  AuditLogActionType,
  GuildNSFWLevel,
  ContentWarningLevel,
  SplashCardAlignment,
  SystemChannelFlags,
  GuildOperations,
  PublicUserFlags,
  GuildMemberProfileFlags,
  RelationshipType,
  type APIAllowedMentions,
  type AllowedMentionType,
  type APIGuildMemberSearchResponse,
  type APIBulkMessageFetchRequest,
  type APIBulkMessageFetchResponse,
  type APIBulkMessageFetchResponseChannel,
} from '@fluxerjs/types';

// Re-export Tenor URL resolver and mention parsers for embeds and moderation
export { resolveTenorToImageUrl, parseUserMention, parsePrefixCommand } from '@fluxerjs/util';

// Re-export permission helpers for role/member permission checks
export {
  PermissionsBitField,
  PermissionFlags,
  resolvePermissionsToBitfield,
  UserFlagsBitField,
  UserFlagsBits,
  MessageFlagsBitField,
  MessageFlagsBits,
  type PermissionString,
  type PermissionResolvable,
  type UserFlagsString,
  type UserFlagsResolvable,
  type MessageFlagsString,
  type MessageFlagsResolvable,
} from '@fluxerjs/util';

export { CDN_URL, STATIC_CDN_URL } from './util/Constants.js';
export {
  cdnAvatarURL,
  cdnDisplayAvatarURL,
  cdnBannerURL,
  cdnMemberAvatarURL,
  cdnMemberBannerURL,
  cdnDefaultAvatarURL,
  cdnGuildAssetURL,
  cdnEmojiURL,
  cdnStickerURL,
} from './util/cdn.js';
export type { CdnUrlOptions } from './util/cdn.js';
export type { ClientOptions, CacheSizeLimits } from './util/Options.js';
export { DEFAULT_CACHE_LIMITS } from './util/Options.js';
export {
  DEFAULT_INSTANCE_ENDPOINTS,
  parseInstanceDiscovery,
  resolveInstanceEndpoints,
  normalizeApiOrigin,
  inviteUrl,
  type ResolvedInstance,
} from './util/instance.js';
export type { DiscoveryOrigin } from './client/Client.js';
export type {
  APIInstance,
  APIInstanceEndpoints,
  APIWellKnownFluxer,
} from '@fluxerjs/types';
export {
  ClientCluster,
  BETA_CLIENT_CLUSTER_WARNING,
  type ClientRuntime,
  type ClientRuntimeStatus,
  type ClientClusterDiagnosticRuntime,
  type ClientClusterDiagnosticReport,
  type ClientClusterOptions,
  type AddClientRuntimeOptions,
  type RestartClientRuntimeOptions,
} from './client/ClientCluster.js';
export {
  ClientClusterEvents,
  type ClientClusterEventName,
  type ClientClusterEventMap,
  type ClientClusterEventListener,
} from './client/ClientClusterEvents.js';
