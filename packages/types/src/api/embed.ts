/**
 * Wire types for message embeds (OpenAPI / gateway payloads).
 *
 * Prefer {@link RESTPostAPIEmbed} when *sending* embeds — response embeds may
 * include video/audio/children that create requests do not accept.
 */

/** Author block shown above an embed title. */
export interface APIEmbedAuthor {
  /** Display name. */
  name?: string;
  /** Clickable URL for the author name. */
  url?: string;
  /** Author avatar image URL. */
  icon_url?: string;
  /** CDN proxy URL for `icon_url`. */
  proxy_icon_url?: string;
}

/** Footer text/icon at the bottom of an embed. */
export interface APIEmbedFooter {
  /** Footer text (required when a footer is present). */
  text: string;
  /** Small icon beside the footer text. */
  icon_url?: string;
  /** CDN proxy URL for `icon_url`. */
  proxy_icon_url?: string;
}

/** Bitwise flags for embed media. */
export const EmbedMediaFlags = {
  /** Embed media contains explicit content */
  CONTAINS_EXPLICIT_MEDIA: 16,
  /** Embed media is animated */
  IS_ANIMATED: 32,
} as const;

/** Image, thumbnail, video, or audio media attached to an embed. */
export interface APIEmbedMedia {
  /** Source URL of the media. */
  url: string;
  /** CDN proxy URL for the media. */
  proxy_url?: string | null;
  /** MIME type when known. */
  content_type?: string | null;
  /** Content hash for cache busting / integrity. */
  content_hash?: string | null;
  /** Pixel width when known. */
  width?: number | null;
  /** Pixel height when known. */
  height?: number | null;
  /** Alt text / caption for accessibility. */
  description?: string | null;
  /** Base64 placeholder for lazy loading */
  placeholder?: string | null;
  /** Duration in seconds for video/audio. */
  duration?: number | null;
  /** EmbedMediaFlags bitfield (e.g. EmbedMediaFlags.CONTAINS_EXPLICIT_MEDIA) */
  flags?: number | null;
}

/** Named field row inside an embed. */
export interface APIEmbedField {
  /** Field title. */
  name: string;
  /** Field body (markdown supported). */
  value: string;
  /** When true, fields may render side-by-side. */
  inline?: boolean;
}

/**
 * Discriminator for how an embed is rendered.
 *
 * - `rich` — standard bot/webhook embed (title, fields, color, …)
 * - `image` — primarily an image unfurl
 * - `video` — primarily a video unfurl
 * - `gifv` — animated GIF / GIFV unfurl
 * - `article` — article / link-preview style card
 * - `link` — generic URL unfurl
 */
export type EmbedType = 'rich' | 'image' | 'video' | 'gifv' | 'article' | 'link';

/** Nested embed from unfurlers (subset of {@link APIEmbed}). */
export interface APIEmbedChild {
  /** Render kind; see {@link EmbedType}. */
  type?: EmbedType;
  /** Canonical URL associated with the embed. */
  url?: string | null;
  /** Title text. */
  title?: string | null;
  /** Accent color as a 24-bit integer (0xRRGGBB). */
  color?: number | null;
  /** ISO-8601 timestamp shown in the embed. */
  timestamp?: string | null;
  /** Body description (markdown). */
  description?: string | null;
  /** Author block. */
  author?: APIEmbedAuthor | null;
  /** Large image. */
  image?: APIEmbedMedia | null;
  /** Small thumbnail. */
  thumbnail?: APIEmbedMedia | null;
  /** Footer block. */
  footer?: APIEmbedFooter | null;
  /** Field rows. */
  fields?: APIEmbedField[] | null;
  /** Provider / site name block (same shape as author). */
  provider?: APIEmbedAuthor | null;
  /** Video media (response/unfurl only). */
  video?: APIEmbedMedia | null;
  /** Audio media (response/unfurl only). */
  audio?: APIEmbedMedia | null;
  /** Whether the embed is marked NSFW. */
  nsfw?: boolean | null;
}

/** Full embed object as returned by the API / gateway. */
export interface APIEmbed {
  /** Render kind; see {@link EmbedType}. */
  type?: EmbedType;
  /** Canonical URL associated with the embed. */
  url?: string | null;
  /** Title text. */
  title?: string | null;
  /** Accent color as a 24-bit integer (0xRRGGBB). */
  color?: number | null;
  /** ISO-8601 timestamp shown in the embed. */
  timestamp?: string | null;
  /** Body description (markdown). */
  description?: string | null;
  /** Author block. */
  author?: APIEmbedAuthor | null;
  /** Large image. */
  image?: APIEmbedMedia | null;
  /** Small thumbnail. */
  thumbnail?: APIEmbedMedia | null;
  /** Footer block. */
  footer?: APIEmbedFooter | null;
  /** Field rows. */
  fields?: APIEmbedField[] | null;
  /** Provider / site name block (same shape as author). */
  provider?: APIEmbedAuthor | null;
  /** Video media (response/unfurl only — not on create). */
  video?: APIEmbedMedia | null;
  /** Audio media (response/unfurl only — not on create). */
  audio?: APIEmbedMedia | null;
  /** Whether the embed is marked NSFW. */
  nsfw?: boolean | null;
  /** Nested embeds from unfurlers */
  children?: APIEmbedChild[] | null;
}

/** Embed author for send/create requests. */
export type RESTPostAPIEmbedAuthor = APIEmbedAuthor;

/** Embed footer for send/create requests. */
export type RESTPostAPIEmbedFooter = APIEmbedFooter;

/** Embed media for send/create requests (URL + optional description only). */
export type RESTPostAPIEmbedMedia = Pick<APIEmbedMedia, 'url' | 'description'>;

/**
 * Embed payload for message/webhook create endpoints.
 * Omits response-only fields (`video`, `audio`, `children`, `type`, …).
 */
export interface RESTPostAPIEmbed {
  /** Canonical URL associated with the embed. */
  url?: string | null;
  /** Title text. */
  title?: string | null;
  /** Accent color as a 24-bit integer (0xRRGGBB). */
  color?: number | null;
  /** ISO-8601 timestamp shown in the embed. */
  timestamp?: string | null;
  /** Body description (markdown). */
  description?: string | null;
  /** Author block. */
  author?: RESTPostAPIEmbedAuthor | null;
  /** Large image. */
  image?: RESTPostAPIEmbedMedia | null;
  /** Small thumbnail. */
  thumbnail?: RESTPostAPIEmbedMedia | null;
  /** Footer block. */
  footer?: RESTPostAPIEmbedFooter | null;
  /** Field rows. */
  fields?: APIEmbedField[] | null;
}
