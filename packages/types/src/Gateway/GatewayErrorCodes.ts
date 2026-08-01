/**
 * Gateway wire error codes (Fluxer `GatewayErrorCodes`).
 * Seen on VOICE_STATE_ACK / gateway error payloads.
 */
export const GatewayErrorCodes = {
  DmInvalidChannelType: 'DM_INVALID_CHANNEL_TYPE',
  DmNotRecipient: 'DM_NOT_RECIPIENT',
  UnknownError: 'UNKNOWN_ERROR',
  VoiceChannelFull: 'VOICE_CHANNEL_FULL',
  VoiceChannelNotFound: 'VOICE_CHANNEL_NOT_FOUND',
  VoiceConnectionLimitReached: 'VOICE_CONNECTION_LIMIT_REACHED',
  VoiceConnectionNotFound: 'VOICE_CONNECTION_NOT_FOUND',
  VoiceGuildIdMissing: 'VOICE_GUILD_ID_MISSING',
  VoiceGuildNotFound: 'VOICE_GUILD_NOT_FOUND',
  VoiceInvalidChannelId: 'VOICE_INVALID_CHANNEL_ID',
  VoiceInvalidChannelType: 'VOICE_INVALID_CHANNEL_TYPE',
  VoiceInvalidGuildId: 'VOICE_INVALID_GUILD_ID',
  VoiceInvalidState: 'VOICE_INVALID_STATE',
  VoiceInvalidUserId: 'VOICE_INVALID_USER_ID',
  VoiceMemberNotFound: 'VOICE_MEMBER_NOT_FOUND',
  VoiceMemberTimedOut: 'VOICE_MEMBER_TIMED_OUT',
  VoiceMissingConnectionId: 'VOICE_MISSING_CONNECTION_ID',
  VoicePermissionDenied: 'VOICE_PERMISSION_DENIED',
  VoiceTokenFailed: 'VOICE_TOKEN_FAILED',
  VoiceUnclaimedAccount: 'VOICE_UNCLAIMED_ACCOUNT',
  VoiceUserMismatch: 'VOICE_USER_MISMATCH',
  VoiceUserNotInVoice: 'VOICE_USER_NOT_IN_VOICE',
} as const;

export type GatewayErrorCode = (typeof GatewayErrorCodes)[keyof typeof GatewayErrorCodes];
