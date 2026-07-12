import { BitField, type BitFieldResolvable } from './BitField.js';

/**
 * User flag bits matching the API UserFlags schema (int64).
 * Stored as bigint so bits ≥ 32 work with {@link BitField} operations.
 */
export const UserFlagsBits = {
  Staff: 1n << 0n,
  CtpMember: 1n << 1n,
  Partner: 1n << 2n,
  BugHunter: 1n << 3n,
  FriendlyBot: 1n << 4n,
  FriendlyBotManualApproval: 1n << 5n,
  HighGlobalRateLimit: 1n << 33n,
  Deleted: 1n << 34n,
  DisabledSuspiciousActivity: 1n << 35n,
  SelfDeleted: 1n << 36n,
  PremiumDiscriminator: 1n << 37n,
  Disabled: 1n << 38n,
  HasSessionStarted: 1n << 39n,
  PremiumBadgeHidden: 1n << 40n,
  PremiumBadgeMasked: 1n << 41n,
  PremiumBadgeTimestampHidden: 1n << 42n,
  PremiumBadgeSequenceHidden: 1n << 43n,
  PremiumPerksSanitized: 1n << 44n,
  PremiumPurchaseDisabled: 1n << 45n,
  PremiumEnabledOverride: 1n << 46n,
  RateLimitBypass: 1n << 47n,
  ReportBanned: 1n << 48n,
  VerifiedNotUnderage: 1n << 49n,
  PendingManualVerification: 1n << 50n,
  HasDismissedPremiumOnboarding: 1n << 51n,
  UsedMobileClient: 1n << 52n,
  AppStoreReviewer: 1n << 53n,
  DmHistoryBackfilled: 1n << 54n,
  HasRelationshipsIndexed: 1n << 55n,
  MessagesByAuthorBackfilled: 1n << 56n,
  StaffHidden: 1n << 57n,
} as const;

export type UserFlagsString = keyof typeof UserFlagsBits;

export type UserFlagsResolvable = BitFieldResolvable<UserFlagsString>;

export class UserFlagsBitField extends BitField<UserFlagsString> {
  static override Flags = UserFlagsBits;
}
