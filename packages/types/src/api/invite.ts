import type { Snowflake } from '../common/snowflake.js';
import type { APIChannelPartial } from './channel.js';
import type { APIUser } from './user.js';

/**
 * Invite type discriminator (OpenAPI InviteType).
 * - `Guild` — invite to a guild
 * - `GroupDM` — invite to a group DM
 * - `EmojiPack` — invite to clone an emoji pack
 * - `StickerPack` — invite to clone a sticker pack
 */
export enum InviteType {
  Guild = 0,
  GroupDM = 1,
  EmojiPack = 2,
  StickerPack = 3,
}

/** Partial guild embedded on guild invites. */
export interface APIGuildPartial {
  /** Guild ID. */
  id: Snowflake;
  /** Guild name. */
  name: string;
  /** Guild icon hash. */
  icon?: string | null;
  /** Guild banner hash. */
  banner?: string | null;
  /** Invite splash hash. */
  splash?: string | null;
  /** Guild features. */
  features?: string[];
}

/** Pack summary embedded on pack invites. */
export interface APIPackInviteInfo {
  /** Pack ID. */
  id: Snowflake;
  /** Pack name. */
  name: string;
  /** Pack description. */
  description?: string | null;
  /** Pack type (emoji or sticker). */
  type: 'emoji' | 'sticker';
  /** Creator user ID. */
  creator_id: Snowflake;
  /** ISO-8601 timestamp when the pack was created. */
  created_at: string;
  /** ISO-8601 timestamp when the pack was last updated. */
  updated_at: string;
  /** Pack creator user object. */
  creator: APIUser;
}

/** Request body for POST /channels/{id}/invites (ChannelInviteCreateRequest). */
export interface ChannelInviteCreateRequest {
  /** Maximum number of uses (null = unlimited). */
  max_uses?: number | null;
  /** Expiration in seconds (null = never). */
  max_age?: number | null;
  /** Whether to create a unique code (no reuse). */
  unique?: boolean | null;
  /** Whether membership is temporary (kicked on disconnect). */
  temporary?: boolean | null;
}

/** Request body for POST /packs/{id}/invites (PackInviteCreateRequest). */
export interface PackInviteCreateRequest {
  /** Maximum number of uses (null = unlimited). */
  max_uses?: number | null;
  /** Expiration in seconds (null = never). */
  max_age?: number | null;
  /** Whether to create a unique code (no reuse). */
  unique?: boolean | null;
}

/** Shared fields on all invite types. */
interface InviteShared {
  /** Invite code (the part after `/invite/`). */
  code: string;
  /** User who created the invite. */
  inviter?: APIUser | null;
  /** ISO-8601 expiration timestamp. */
  expires_at?: string | null;
  /** Whether membership is temporary (kicked on disconnect). Always present on REST responses; may be absent on gateway partials. */
  temporary?: boolean;
  /** ISO-8601 creation timestamp. */
  created_at?: string;
  /** Current use count. */
  uses?: number;
  /** Maximum use count (null = unlimited). */
  max_uses?: number;
  /** Maximum age in seconds (null = never). */
  max_age?: number;
}

/** Guild invite (type 0). */
export interface APIGuildInvite extends InviteShared {
  type: InviteType.Guild;
  /** Guild being invited to. */
  guild: APIGuildPartial;
  /** Channel the invite targets. */
  channel: APIChannelPartial;
  /** Total guild member count. */
  member_count?: number;
  /** Online member count. */
  presence_count?: number;
}

/** Group DM invite (type 1). */
export interface APIGroupDmInvite extends InviteShared {
  type: InviteType.GroupDM;
  /** Group DM channel. */
  channel: APIChannelPartial;
  /** Total member count. */
  member_count?: number;
}

/** Pack invite (type 2 or 3). */
export interface APIPackInvite extends InviteShared {
  type: InviteType.EmojiPack | InviteType.StickerPack;
  /** Pack being invited to clone. */
  pack: APIPackInviteInfo;
}

/** Union of all invite types (GET /invites/{code}). */
export type APIInviteResponse = APIGuildInvite | APIGroupDmInvite | APIPackInvite;

/** Guild invite with full metadata (list/metadata responses). */
export type APIGuildInviteMetadata = APIGuildInvite &
  Required<Pick<InviteShared, 'created_at' | 'uses' | 'max_uses' | 'max_age' | 'temporary'>> &
  Required<Pick<APIGuildInvite, 'member_count' | 'presence_count'>>;

/** Group DM invite with full metadata (list/metadata responses). */
export type APIGroupDmInviteMetadata = APIGroupDmInvite &
  Required<Pick<InviteShared, 'created_at' | 'uses' | 'max_uses' | 'max_age' | 'temporary'>> &
  Required<Pick<APIGroupDmInvite, 'member_count'>>;

/** Pack invite with full metadata (list/metadata responses). */
export type APIPackInviteMetadata = APIPackInvite &
  Required<Pick<InviteShared, 'created_at' | 'uses' | 'max_uses' | 'temporary'>>;

/** Union of all invite metadata types. */
export type APIInviteMetadata =
  | APIGuildInviteMetadata
  | APIGroupDmInviteMetadata
  | APIPackInviteMetadata;

/** Any invite payload (REST, list, or gateway INVITE_CREATE). */
export type APIInvite = APIInviteResponse;

/** Type guard to check if invite is a guild invite. */
export function isGuildInvite(invite: APIInvite): invite is APIGuildInvite {
  return invite.type === InviteType.Guild;
}

/** Type guard to check if invite is a group DM invite. */
export function isGroupDmInvite(invite: APIInvite): invite is APIGroupDmInvite {
  return invite.type === InviteType.GroupDM;
}

/** Type guard to check if invite is a pack invite. */
export function isPackInvite(invite: APIInvite): invite is APIPackInvite {
  return invite.type === InviteType.EmojiPack || invite.type === InviteType.StickerPack;
}
