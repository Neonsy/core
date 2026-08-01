import type { Snowflake } from '../Common/Snowflake.js';

/**
 * Public user flags bitfield (OpenAPI PublicUserFlags).
 * - `Staff` — Fluxer staff member
 * - `CtpMember` — Closed Testing Program participant
 * - `Partner` — Fluxer partner
 * - `BugHunter` — Bug hunter
 * - `FriendlyBot` — Approved bot account
 * - `FriendlyBotManualApproval` — Bot requires manual approval
 * - `Spammer` — Marked as spammer
 * Full account flags (including private bits) live in `@fluxerjs/util` UserFlagsBitField.
 */
export const PublicUserFlags = {
  Staff: 1,
  CtpMember: 2,
  Partner: 4,
  BugHunter: 8,
  FriendlyBot: 16,
  FriendlyBotManualApproval: 32,
  Spammer: 64,
} as const;

/** Union of all valid {@link PublicUserFlags} values. */
export type PublicUserFlagsValue = (typeof PublicUserFlags)[keyof typeof PublicUserFlags];

/**
 * Guild member profile flags (OpenAPI GuildMemberProfileFlags).
 * - `AvatarUnset` — member explicitly unset their guild avatar
 * - `BannerUnset` — member explicitly unset their guild banner
 */
export const GuildMemberProfileFlags = {
  AvatarUnset: 1,
  BannerUnset: 2,
} as const;

/** Union of all valid {@link GuildMemberProfileFlags} values. */
export type GuildMemberProfileFlagsValue =
  (typeof GuildMemberProfileFlags)[keyof typeof GuildMemberProfileFlags];

/**
 * Relationship type (OpenAPI RelationshipTypes).
 * - `Friend` — mutual friend
 * - `Blocked` — blocked user
 * - `IncomingRequest` — received friend request
 * - `OutgoingRequest` — sent friend request
 */
export enum RelationshipType {
  Friend = 1,
  Blocked = 2,
  IncomingRequest = 3,
  OutgoingRequest = 4,
}

/**
 * Partial user object returned by the API (messages, members, webhooks, etc.).
 * @see GET /users/{id} - Returns id, username, discriminator, global_name, avatar, avatar_color, flags
 * @see GET /users/@me - Returns full user with bot, email, premium fields, etc.
 */
export interface APIUserPartial {
  /** User ID. */
  id: Snowflake;
  /** Username. */
  username: string;
  /** Discriminator (4-digit tag). */
  discriminator: string;
  /** Display name. */
  global_name: string | null;
  /** Avatar hash. */
  avatar: string | null;
  /** RGB color as integer (e.g. 7577782) for profile decoration. */
  avatar_color: number | null;
  /** {@link PublicUserFlags} bitfield (public bits); private bits may also be set. */
  flags: number;
  /** Account-wide reply mention preference. */
  mention_flags?: number;
  /** Whether this is a bot account. */
  bot?: boolean;
  /** Whether this is an official system user. */
  system?: boolean;
}

/** Alias for {@link APIUserPartial} — user object from API responses. */
export type APIUser = APIUserPartial;

/**
 * User profile sub-object from GET /users/{id}/profile.
 * @see https://docs.fluxer.app/api-reference
 */
export interface APIUserProfile {
  /** User pronouns. */
  pronouns?: string | null;
  /** User bio. */
  bio?: string | null;
  /** Profile banner hash. */
  banner?: string | null;
  /** Accent color as RGB integer. */
  accent_color?: number | null;
  /** Banner color as RGB integer. */
  banner_color?: number | null;
  /** Theme preference. */
  theme?: string | null;
}

/**
 * Connected account from profile response (e.g. GitHub, Twitter, etc.).
 */
export interface APIConnectedAccount {
  /** Account name. */
  name?: string | null;
  /** Service type (e.g. "github", "twitter"). */
  type?: string | null;
}

/**
 * Full profile response from GET /users/{id}/profile.
 * Optionally use ?guild_id=GUILD_ID for server-specific profile.
 */
export interface APIProfileResponse {
  /** User profile sub-object. */
  user_profile?: APIUserProfile | null;
  /** Mutual guilds (deprecated, use mutual_guild_ids). */
  mutual_guilds?: Array<{ id: Snowflake }> | null;
  /** Mutual guild IDs. */
  mutual_guild_ids?: Snowflake[] | null;
  /** Connected accounts. */
  connected_accounts?: APIConnectedAccount[] | null;
}

/**
 * Guild member from GET /guilds/{guild_id}/members or GET /guilds/{guild_id}/members/{user_id}.
 */
export interface APIGuildMember {
  /** User object for this member. */
  user: APIUserPartial;
  /** Guild nickname. */
  nick?: string | null;
  /** Guild-specific avatar hash. */
  avatar?: string | null;
  /** Guild-specific banner hash. */
  banner?: string | null;
  /** Guild-specific accent color as RGB integer. */
  accent_color?: number | null;
  /** Role IDs assigned to this member. */
  roles: Snowflake[];
  /** ISO-8601 timestamp when the member joined. */
  joined_at: string;
  /** Whether the member is server muted. */
  mute: boolean;
  /** Whether the member is server deafened. */
  deaf: boolean;
  /** ISO-8601 timestamp until the member is timed out. */
  communication_disabled_until?: string | null;
  /** {@link GuildMemberProfileFlags} bitfield. */
  profile_flags?: number | null;
  /** Per-guild reply mention preference override. */
  mention_flags?: number | null;
}
