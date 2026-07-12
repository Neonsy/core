import { BitField, type BitFieldResolvable } from './BitField.js';

/**
 * Permission flags aligned with the Fluxer API (`1n << n`).
 * Administrator (bit 3) implies all permissions in {@link PermissionsBitField.has}.
 */
export const PermissionFlags = {
  CreateInstantInvite: 1n << 0n,
  KickMembers: 1n << 1n,
  BanMembers: 1n << 2n,
  Administrator: 1n << 3n,
  ManageChannels: 1n << 4n,
  ManageGuild: 1n << 5n,
  AddReactions: 1n << 6n,
  ViewAuditLog: 1n << 7n,
  PrioritySpeaker: 1n << 8n,
  Stream: 1n << 9n,
  ViewChannel: 1n << 10n,
  SendMessages: 1n << 11n,
  SendTtsMessages: 1n << 12n,
  ManageMessages: 1n << 13n,
  EmbedLinks: 1n << 14n,
  AttachFiles: 1n << 15n,
  ReadMessageHistory: 1n << 16n,
  MentionEveryone: 1n << 17n,
  UseExternalEmojis: 1n << 18n,
  Connect: 1n << 20n,
  Speak: 1n << 21n,
  MuteMembers: 1n << 22n,
  DeafenMembers: 1n << 23n,
  MoveMembers: 1n << 24n,
  UseVad: 1n << 25n,
  ChangeNickname: 1n << 26n,
  ManageNicknames: 1n << 27n,
  ManageRoles: 1n << 28n,
  ManageWebhooks: 1n << 29n,
  /** Manage emojis & stickers (expressions). */
  ManageExpressions: 1n << 30n,
  UseExternalStickers: 1n << 37n,
  ModerateMembers: 1n << 40n,
  CreateExpressions: 1n << 43n,
  PinMessages: 1n << 51n,
  BypassSlowmode: 1n << 52n,
  UpdateRtcRegion: 1n << 53n,
  ViewChannelMembers: 1n << 54n,
} as const;

/** OR of all permission flags (guild owner / Administrator override). */
export const ALL_PERMISSIONS_BIGINT: bigint = Object.values(PermissionFlags).reduce(
  (a, b) => a | b,
  0n,
);

export type PermissionString = keyof typeof PermissionFlags;
export type PermissionResolvable = BitFieldResolvable<PermissionString>;

export class PermissionsBitField extends BitField<PermissionString> {
  static override Flags = PermissionFlags;

  private get isAdmin(): boolean {
    return (this.bitfield & PermissionFlags.Administrator) !== 0n;
  }

  /** Administrator implies every permission. */
  override has(bit: PermissionResolvable): boolean {
    return this.isAdmin || super.has(bit);
  }

  override any(bit: PermissionResolvable): boolean {
    return this.isAdmin || super.any(bit);
  }

  override missing(bit: PermissionResolvable): PermissionString[] {
    return this.isAdmin ? [] : super.missing(bit);
  }
}

/** Resolve permission(s) to an API bitfield string (decimal bigint). */
export function resolvePermissionsToBitfield(perms: PermissionResolvable): string {
  return PermissionsBitField.resolve(perms).toString();
}
