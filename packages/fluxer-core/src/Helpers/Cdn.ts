import { CDN_URL, STATIC_CDN_URL } from './Constants.js';

export interface CdnUrlOptions {
  size?: number;
  extension?: string;
  /** Media CDN base (avatars, banners, emojis). Defaults to hosted Fluxer. */
  mediaBase?: string;
  /** Static CDN base (default avatars). Defaults to hosted Fluxer. */
  staticCdnBase?: string;
}

function mediaBase(options?: CdnUrlOptions): string {
  return (options?.mediaBase ?? CDN_URL).replace(/\/+$/, '');
}

function staticBase(options?: CdnUrlOptions): string {
  return (options?.staticCdnBase ?? STATIC_CDN_URL).replace(/\/+$/, '');
}

function getExtension(hash: string | null, options?: CdnUrlOptions): string {
  const ext = options?.extension ?? 'png';
  // Animated avatars/banners have hash starting with a_
  if (hash?.startsWith('a_')) return 'gif';
  return ext;
}

function appendSize(options?: CdnUrlOptions): string {
  return options?.size ? `?size=${options.size}` : '';
}

/**
 * Build a user avatar URL from raw API data.
 * @param userId - The user's snowflake ID
 * @param avatarHash - The avatar hash from the API, or null if no custom avatar
 * @param options - Optional size, extension, and CDN bases
 * @returns The avatar URL, or null if no avatar hash
 */
export function cdnAvatarURL(
  userId: string,
  avatarHash: string | null,
  options?: CdnUrlOptions,
): string | null {
  if (!avatarHash) return null;
  const ext = getExtension(avatarHash, options);
  const size = appendSize(options);
  return `${mediaBase(options)}/avatars/${userId}/${avatarHash}.${ext}${size}`;
}

/**
 * Build an avatar URL, or the default avatar when none set.
 */
export function cdnDisplayAvatarURL(
  userId: string,
  avatarHash: string | null,
  options?: CdnUrlOptions,
): string {
  return cdnAvatarURL(userId, avatarHash, options) ?? cdnDefaultAvatarURL(userId, options);
}

/**
 * Build a user or guild banner URL from raw API data.
 */
export function cdnBannerURL(
  resourceId: string,
  bannerHash: string | null,
  options?: CdnUrlOptions,
): string | null {
  if (!bannerHash) return null;
  const ext = getExtension(bannerHash, options);
  const size = appendSize(options);
  return `${mediaBase(options)}/banners/${resourceId}/${bannerHash}.${ext}${size}`;
}

/**
 * Build a guild member avatar URL (guild-specific avatar).
 */
export function cdnMemberAvatarURL(
  guildId: string,
  userId: string,
  avatarHash: string | null,
  options?: CdnUrlOptions,
): string | null {
  if (!avatarHash) return null;
  const ext = getExtension(avatarHash, options);
  const size = appendSize(options);
  return `${mediaBase(options)}/guilds/${guildId}/users/${userId}/avatars/${avatarHash}.${ext}${size}`;
}

/**
 * Build a guild member banner URL (guild-specific banner).
 */
export function cdnMemberBannerURL(
  guildId: string,
  userId: string,
  bannerHash: string | null,
  options?: CdnUrlOptions,
): string | null {
  if (!bannerHash) return null;
  const ext = getExtension(bannerHash, options);
  const size = appendSize(options);
  return `${mediaBase(options)}/guilds/${guildId}/users/${userId}/banners/${bannerHash}.${ext}${size}`;
}

/**
 * Get the default avatar URL (used when user has no custom avatar).
 * Fluxer uses index = userId % 6 (six default avatar variants).
 */
export function cdnDefaultAvatarURL(
  userIdOrIndex: string | number,
  options?: Pick<CdnUrlOptions, 'staticCdnBase'>,
): string {
  const index =
    typeof userIdOrIndex === 'string'
      ? Number(BigInt(userIdOrIndex) % 6n)
      : Math.abs(Math.floor(userIdOrIndex) % 6);
  return `${staticBase(options)}/avatars/${index}.png`;
}

/** Build a guild icon/banner/splash URL. */
export function cdnGuildAssetURL(
  kind: 'icons' | 'banners' | 'splashes',
  id: string,
  hash: string | null,
  options?: Pick<CdnUrlOptions, 'size' | 'mediaBase'>,
): string | null {
  if (!hash) return null;
  const size = options?.size ? `?size=${options.size}` : '';
  return `${mediaBase(options)}/${kind}/${id}/${hash}.png${size}`;
}

/** Build an emoji CDN URL. */
export function cdnEmojiURL(
  emojiId: string,
  animated: boolean,
  options?: Pick<CdnUrlOptions, 'mediaBase'>,
): string {
  const ext = animated ? 'gif' : 'png';
  return `${mediaBase(options)}/emojis/${emojiId}.${ext}`;
}

/** Build a sticker CDN URL. */
export function cdnStickerURL(
  stickerId: string,
  animated: boolean,
  options?: Pick<CdnUrlOptions, 'mediaBase'>,
): string {
  const ext = animated ? 'gif' : 'png';
  return `${mediaBase(options)}/stickers/${stickerId}.${ext}`;
}
