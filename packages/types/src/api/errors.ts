/**
 * API error codes returned by the Fluxer API.
 * Subset of commonly used codes for bot development.
 *
 * Error categories:
 * - Auth: Unauthorized, Forbidden, InvalidToken, etc.
 * - Not found: UnknownUser, UnknownGuild, UnknownChannel, etc.
 * - Validation: BadRequest, ValidationError, InvalidFormBody
 * - Rate limit: RateLimited, SlowmodeRateLimited
 * - Server: InternalServerError, BadGateway, ServiceUnavailable
 * - Bot-specific: BotsCannotSendFriendRequests, BotAlreadyInGuild, etc.
 * - Content: CannotSendEmptyMessage, FileSizeTooLarge, MaxEmojis, etc.
 */
export enum APIErrorCode {
  // Auth
  /** User not authenticated */
  Unauthorized = 'UNAUTHORIZED',
  /** User lacks permission */
  Forbidden = 'FORBIDDEN',
  /** Missing Authorization header */
  MissingAuthorization = 'MISSING_AUTHORIZATION',
  /** Invalid auth token */
  InvalidAuthToken = 'INVALID_AUTH_TOKEN',
  /** Invalid token (deprecated, use InvalidAuthToken) */
  InvalidToken = 'INVALID_TOKEN',
  /** 2FA required */
  TwoFactorRequired = 'TWO_FACTOR_REQUIRED',
  /** Sudo mode required (sensitive operation) */
  SudoModeRequired = 'SUDO_MODE_REQUIRED',

  // Not found
  /** Resource not found */
  NotFound = 'NOT_FOUND',
  /** User not found */
  UnknownUser = 'UNKNOWN_USER',
  /** Guild not found */
  UnknownGuild = 'UNKNOWN_GUILD',
  /** Channel not found */
  UnknownChannel = 'UNKNOWN_CHANNEL',
  /** Message not found */
  UnknownMessage = 'UNKNOWN_MESSAGE',
  /** Role not found */
  UnknownRole = 'UNKNOWN_ROLE',
  /** Emoji not found */
  UnknownEmoji = 'UNKNOWN_EMOJI',
  /** Sticker not found */
  UnknownSticker = 'UNKNOWN_STICKER',
  /** Webhook not found */
  UnknownWebhook = 'UNKNOWN_WEBHOOK',
  /** Invite not found */
  UnknownInvite = 'UNKNOWN_INVITE',

  // Validation
  /** Invalid request parameters */
  BadRequest = 'BAD_REQUEST',
  /** Request body validation failed */
  ValidationError = 'VALIDATION_ERROR',
  /** Invalid request format */
  InvalidRequest = 'INVALID_REQUEST',
  /** Invalid form body */
  InvalidFormBody = 'INVALID_FORM_BODY',

  // Rate limit
  /** Global or per-route rate limit hit */
  RateLimited = 'RATE_LIMITED',
  /** Slowmode rate limit hit */
  SlowmodeRateLimited = 'SLOWMODE_RATE_LIMITED',

  // Server
  /** Internal server error */
  InternalServerError = 'INTERNAL_SERVER_ERROR',
  /** Bad gateway */
  BadGateway = 'BAD_GATEWAY',
  /** Gateway timeout */
  GatewayTimeout = 'GATEWAY_TIMEOUT',
  /** Service unavailable */
  ServiceUnavailable = 'SERVICE_UNAVAILABLE',

  // Bot-specific
  /** Bots cannot send friend requests */
  BotsCannotSendFriendRequests = 'BOTS_CANNOT_SEND_FRIEND_REQUESTS',
  /** Bot already in guild */
  BotAlreadyInGuild = 'BOT_ALREADY_IN_GUILD',
  /** Bot application not found */
  BotApplicationNotFound = 'BOT_APPLICATION_NOT_FOUND',
  /** Bot is private (cannot be added publicly) */
  BotIsPrivate = 'BOT_IS_PRIVATE',
  /** Application is not a bot */
  NotABotApplication = 'NOT_A_BOT_APPLICATION',

  // Content
  /** Cannot send empty message */
  CannotSendEmptyMessage = 'CANNOT_SEND_EMPTY_MESSAGE',
  /** File size exceeds limit */
  FileSizeTooLarge = 'FILE_SIZE_TOO_LARGE',
  /** Guild emoji limit reached */
  MaxEmojis = 'MAX_EMOJIS',
  /** Guild sticker limit reached */
  MaxStickers = 'MAX_STICKERS',
  /** Channel webhook limit reached */
  MaxWebhooks = 'MAX_WEBHOOKS',
}

/** Standard API error response body. */
export interface APIErrorBody {
  /** Error code (see {@link APIErrorCode}). */
  code: APIErrorCode | string;
  /** Human-readable error message. */
  message: string;
  /** Field-level validation errors. */
  errors?: Array<{ path: string; message: string; code?: string }>;
}

/** Rate limit error response body (includes retry_after). */
export interface RateLimitErrorBody extends APIErrorBody {
  /** Rate limit error code. */
  code: 'RATE_LIMITED';
  /** Seconds to wait before retrying. */
  retry_after: number;
  /** Whether this is a global rate limit. */
  global?: boolean;
}
