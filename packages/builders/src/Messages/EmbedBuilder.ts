import type {
  APIEmbed,
  APIEmbedField,
  RESTPostAPIEmbed,
  RESTPostAPIEmbedAuthor,
  RESTPostAPIEmbedFooter,
  RESTPostAPIEmbedMedia,
} from '@fluxerjs/types';
import { ErrorCodes, FluxerError, resolveColor } from '@fluxerjs/util';

export type { RESTPostAPIEmbed } from '@fluxerjs/types';

/** Options for embed media (image/thumbnail). */
export interface EmbedMediaOptions {
  /** Media URL (HTTP(S) or `attachment://filename`). */
  url: string;
  /** Alt text for accessibility (max 4096 characters). */
  description?: string | null;
}

/** Options for embed author. */
export interface EmbedAuthorOptions {
  /** Author name (max 256 characters). */
  name: string;
  /** Author icon URL (optional). */
  iconURL?: string;
  /** Author URL (clickable name) (optional). */
  url?: string;
}

/** Options for embed footer. */
export interface EmbedFooterOptions {
  /** Footer text (max 2048 characters). */
  text: string;
  /** Footer icon URL (optional). */
  iconURL?: string;
}

/** Embed field data (name-value pair). */
export interface EmbedFieldData {
  /** Field name (max 256 characters). */
  name: string;
  /** Field value (max 1024 characters). */
  value: string;
  /** Whether this field should display inline. */
  inline?: boolean;
}

const MAX = {
  title: 256,
  description: 4096,
  fields: 25,
  fieldName: 256,
  fieldValue: 1024,
  footerText: 2048,
  authorName: 256,
  mediaDescription: 4096,
} as const;

const MESSAGE_REMOVED_FORMAT_REGEX = /\u202E/g;
// biome-ignore lint/complexity/useRegexLiterals: the literal form is rejected as a control character
const MESSAGE_REMOVED_CONTROL_REGEX = new RegExp('\\u000C', 'g');
const ATTACHMENT_FILENAME_REGEX = /^[\p{L}\p{N}\p{M}_.-]+$/u;
const HOST_LABEL_REGEX = /^[a-z\u00A1-\uFFFF0-9-]+$/i;
const FULLWIDTH_ASCII_REGEX = /[\uFF01-\uFF5E]/;
const IPV4_OCTET_REGEX = /^(?:0|[1-9]\d{0,2})$/;
const URL_WHITESPACE_REGEX = /\s/;
const URL_ANGLE_BRACKET_REGEX = /[<>]/;
const URL_MAX_LENGTH = 2048;

function normalizeFluxerString(value: string): string {
  return value
    .replace(MESSAGE_REMOVED_CONTROL_REGEX, '')
    .replace(MESSAGE_REMOVED_FORMAT_REGEX, '')
    .trim();
}

function invalidUrl(message: string, code: string, reason: string): never {
  throw new FluxerError(`${message}: ${reason}.`, { code });
}

function extractHttpHostname(url: string): string {
  const schemeEnd = url.indexOf('://') + 3;
  const remainder = url.slice(schemeEnd);
  const authorityEnd = remainder.search(/[/?#]/);
  const authority = authorityEnd === -1 ? remainder : remainder.slice(0, authorityEnd);

  if (authority.startsWith('[')) {
    const closingBracket = authority.indexOf(']');
    return closingBracket === -1 ? '' : authority.slice(0, closingBracket + 1);
  }

  const portSeparator = authority.lastIndexOf(':');
  return portSeparator === -1 ? authority : authority.slice(0, portSeparator);
}

function isIPv4Hostname(hostname: string): boolean {
  const octets = hostname.split('.');
  return (
    octets.length === 4 &&
    octets.every((octet) => IPV4_OCTET_REGEX.test(octet) && Number.parseInt(octet, 10) <= 255)
  );
}

function getInvalidFluxerHostnameReason(hostname: string): string | undefined {
  if (hostname.startsWith('[') && hostname.endsWith(']')) return undefined;
  if (hostname.endsWith('.')) return 'host must not end with a dot';
  if (isIPv4Hostname(hostname)) return undefined;

  const labels = hostname.split('.');
  const finalLabel = labels.at(-1) ?? '';
  if (/^\d+$/.test(finalLabel)) return 'host must not end with a numeric-only label';

  for (const label of labels) {
    if (label.length === 0) return 'host must not contain empty labels';
    if (label.length > 63) return 'host labels must not exceed 63 characters';
    if (label.includes('_')) return 'host labels must not contain underscores';
    if (label.startsWith('-') || label.endsWith('-')) {
      return 'host labels must not start or end with a hyphen';
    }
    if (!HOST_LABEL_REGEX.test(label) || FULLWIDTH_ASCII_REGEX.test(label)) {
      return 'host contains invalid characters';
    }
  }

  return undefined;
}

function normalizeHttpUrl(url: unknown, label: string, code: string, message: string): string {
  if (typeof url !== 'string') {
    throw new TypeError(`${label} must be a string.`);
  }
  const normalized = normalizeFluxerString(url);

  if (normalized.length === 0) {
    invalidUrl(message, code, `${label} cannot be empty`);
  }
  if (normalized.length > URL_MAX_LENGTH) {
    invalidUrl(
      message,
      code,
      `${label} has ${normalized.length} characters. Maximum is ${URL_MAX_LENGTH}`,
    );
  }
  if (URL_WHITESPACE_REGEX.test(normalized)) {
    invalidUrl(message, code, `${label} must not contain whitespace`);
  }
  if (URL_ANGLE_BRACKET_REGEX.test(normalized)) {
    invalidUrl(message, code, `${label} must not contain angle brackets`);
  }
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    invalidUrl(message, code, `${label} must start with lowercase http:// or https://`);
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    invalidUrl(message, code, `${label} must be a valid HTTP(S) URL`);
  }

  if (parsed.username !== '' || parsed.password !== '') {
    invalidUrl(message, code, `${label} must not include credentials`);
  }
  if (parsed.hostname === '') {
    invalidUrl(message, code, `${label} must include a host`);
  }
  if (parsed.port === '0') {
    invalidUrl(message, code, `${label} port must be between 1 and 65535`);
  }
  const hostnameReason = getInvalidFluxerHostnameReason(extractHttpHostname(normalized));
  if (hostnameReason) {
    invalidUrl(message, code, `${label} ${hostnameReason}`);
  }

  return normalized;
}

function normalizeMediaUrl(url: unknown): string {
  if (typeof url !== 'string') {
    throw new TypeError('Embed media URL must be a string.');
  }
  const normalized = normalizeFluxerString(url);
  if (normalized.length === 0) {
    invalidUrl(
      'Invalid embed media URL',
      ErrorCodes.InvalidEmbedMediaUrl,
      'Embed media URL cannot be empty',
    );
  }
  if (normalized.length > URL_MAX_LENGTH) {
    invalidUrl(
      'Invalid embed media URL',
      ErrorCodes.InvalidEmbedMediaUrl,
      `Embed media URL has ${normalized.length} characters. Maximum is ${URL_MAX_LENGTH}`,
    );
  }
  if (normalized.startsWith('attachment://')) {
    const filename = normalized.slice('attachment://'.length);
    if (ATTACHMENT_FILENAME_REGEX.test(filename)) return normalized;
    invalidUrl(
      'Invalid embed media URL',
      ErrorCodes.InvalidEmbedMediaUrl,
      'attachment filenames may contain only letters, numbers, marks, underscores, periods, and hyphens',
    );
  }
  return normalizeHttpUrl(
    normalized,
    'Embed media URL',
    ErrorCodes.InvalidEmbedMediaUrl,
    'Invalid embed media URL',
  );
}

function toMedia(
  input: string | EmbedMediaOptions,
  kind: 'image' | 'thumbnail',
): RESTPostAPIEmbedMedia {
  if (typeof input !== 'string') assertObject(`Embed ${kind} options`, input);
  const url = normalizeMediaUrl(typeof input === 'string' ? input : input.url);
  if (typeof input === 'string') return { url };
  if (input.description != null) {
    assertLength(`Embed ${kind} description`, input.description, 1, MAX.mediaDescription);
  }
  return input.description != null ? { url, description: input.description } : { url };
}

function assertObject(label: string, value: unknown): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
}

function assertLength(
  label: string,
  value: unknown,
  min: number,
  max: number,
): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`${label} must be a string.`);
  }
  const normalizedLength = normalizeFluxerString(value).length;
  const size =
    normalizedLength === value.length
      ? `${value.length} characters`
      : `${value.length} supplied characters (${normalizedLength} after Fluxer normalization)`;
  if (normalizedLength < min) {
    throw new RangeError(`${label} has ${size}. Minimum is ${min}.`);
  }
  if (normalizedLength > max) {
    throw new RangeError(`${label} has ${size}. Maximum is ${max}.`);
  }
}

function assertMaxCount(label: string, actual: number, max: number): void {
  if (actual > max) {
    throw new RangeError(`${label} has ${actual} entries. Maximum is ${max}.`);
  }
}

function toField(field: EmbedFieldData, index: number, label = 'Embed'): APIEmbedField {
  assertObject(`${label} field ${index + 1}`, field);
  assertLength(`${label} field ${index + 1} name`, field.name, 1, MAX.fieldName);
  assertLength(`${label} field ${index + 1} value`, field.value, 0, MAX.fieldValue);
  return {
    name: field.name,
    value: field.value,
    inline: field.inline,
  };
}

/** Validate one embed's account-independent limits. @internal */
export function validateEmbedData(data: Partial<RESTPostAPIEmbed>, label = 'Embed'): void {
  assertObject(label, data);
  if (data.url != null) {
    normalizeHttpUrl(data.url, `${label} URL`, ErrorCodes.InvalidEmbedUrl, 'Invalid embed URL');
  }
  if (data.title != null) assertLength(`${label} title`, data.title, 0, MAX.title);
  if (data.description != null) {
    assertLength(
      `${label} description`,
      data.description,
      data.description === '' ? 0 : 1,
      MAX.description,
    );
  }
  if (data.author != null) {
    assertObject(`${label} author`, data.author);
    if (data.author.name != null) {
      assertLength(`${label} author name`, data.author.name, 1, MAX.authorName);
      if (data.author.url != null) {
        normalizeHttpUrl(
          data.author.url,
          `${label} author URL`,
          ErrorCodes.InvalidEmbedUrl,
          'Invalid embed URL',
        );
      }
      if (data.author.icon_url != null) {
        normalizeHttpUrl(
          data.author.icon_url,
          `${label} author icon URL`,
          ErrorCodes.InvalidEmbedUrl,
          'Invalid embed URL',
        );
      }
    }
  }
  if (data.footer != null) {
    assertObject(`${label} footer`, data.footer);
    if (data.footer.text != null) {
      assertLength(`${label} footer text`, data.footer.text, 1, MAX.footerText);
      if (data.footer.icon_url != null) {
        normalizeHttpUrl(
          data.footer.icon_url,
          `${label} footer icon URL`,
          ErrorCodes.InvalidEmbedUrl,
          'Invalid embed URL',
        );
      }
    }
  }
  if (data.image != null) {
    assertObject(`${label} image`, data.image);
    if (data.image.url != null) {
      normalizeMediaUrl(data.image.url);
      if (data.image.description != null) {
        assertLength(`${label} image description`, data.image.description, 1, MAX.mediaDescription);
      }
    }
  }
  if (data.thumbnail != null) {
    assertObject(`${label} thumbnail`, data.thumbnail);
    if (data.thumbnail.url != null) {
      normalizeMediaUrl(data.thumbnail.url);
      if (data.thumbnail.description != null) {
        assertLength(
          `${label} thumbnail description`,
          data.thumbnail.description,
          1,
          MAX.mediaDescription,
        );
      }
    }
  }
  if (data.fields != null) {
    if (!Array.isArray(data.fields)) {
      throw new TypeError(`${label} field list must be an array.`);
    }
    assertMaxCount(`${label} field list`, data.fields.length, MAX.fields);
    for (const [index, field] of data.fields.entries()) {
      toField(field, index, label);
    }
  }
}

/** Validate account-independent limits for each embed in a message. @internal */
export function validateMessageEmbeds(
  embeds: unknown,
): asserts embeds is readonly RESTPostAPIEmbed[] {
  if (!Array.isArray(embeds)) {
    throw new TypeError('Message embed list must be an array.');
  }
  for (const [index, embed] of embeds.entries()) {
    validateEmbedData(embed, `Message embed ${index + 1}`);
  }
}

/**
 * Request-only embed builder. Emits {@link RESTPostAPIEmbed} (no video/audio).
 * @example
 * ```ts
 * const embed = new EmbedBuilder()
 *   .setTitle('Hello')
 *   .setDescription('World')
 *   .setColor('#5865F2')
 *   .setTimestamp();
 * await channel.send({ embeds: [embed] });
 * ```
 */
export class EmbedBuilder {
  /** Partial embed data (built incrementally via setters). */
  public readonly data: Partial<RESTPostAPIEmbed> = {};

  /**
   * Set embed title (max 256 characters). Pass null to clear.
   * @param title - Title text or null
   * @returns This builder for chaining
   * @throws {RangeError} If title exceeds 256 characters
   */
  setTitle(title: string | null): this {
    if (title !== null) assertLength('Embed title', title, 0, MAX.title);
    this.data.title = title ?? undefined;
    return this;
  }

  /**
   * Set embed description (max 4096 characters). Pass null to clear.
   * @param description - Description text or null
   * @returns This builder for chaining
   * @throws {RangeError} If description exceeds 4096 characters
   */
  setDescription(description: string | null): this {
    if (description !== null && description !== '') {
      assertLength('Embed description', description, 1, MAX.description);
    }
    this.data.description = description === null || description === '' ? undefined : description;
    return this;
  }

  /**
   * Set embed URL (title becomes clickable). Pass null to clear.
   * @param url - HTTP(S) URL or null
   * @returns This builder for chaining
   * @throws {@link FluxerError} If URL is invalid
   */
  setURL(url: string | null): this {
    this.data.url =
      url === null
        ? undefined
        : normalizeHttpUrl(url, 'Embed URL', ErrorCodes.InvalidEmbedUrl, 'Invalid embed URL');
    return this;
  }

  /**
   * Set embed color. Pass null to clear.
   * @param color - Number (24-bit RGB), hex string (`#5865F2`), or RGB tuple, or null
   * @returns This builder for chaining
   */
  setColor(color: number | string | [number, number, number] | null): this {
    this.data.color =
      color === null ? undefined : typeof color === 'number' ? color : resolveColor(color);
    return this;
  }

  /**
   * Set embed timestamp. Pass null to clear.
   * @param timestamp - Date object, Unix ms, or undefined (defaults to now), or null
   * @returns This builder for chaining
   */
  setTimestamp(timestamp?: Date | number | null): this {
    if (timestamp === null) {
      this.data.timestamp = undefined;
      return this;
    }
    const date =
      timestamp === undefined
        ? new Date()
        : timestamp instanceof Date
          ? timestamp
          : new Date(timestamp);
    this.data.timestamp = date.toISOString();
    return this;
  }

  /**
   * Set embed author. Pass null to clear.
   * @param options - Author name, icon URL, and URL, or null
   * @returns This builder for chaining
   */
  setAuthor(options: EmbedAuthorOptions | null): this {
    if (options === null) {
      this.data.author = undefined;
      return this;
    }
    assertObject('Embed author options', options);
    assertLength('Embed author name', options.name, 1, MAX.authorName);
    const author: RESTPostAPIEmbedAuthor = { name: options.name };
    if (options.url != null) {
      author.url = normalizeHttpUrl(
        options.url,
        'Embed author URL',
        ErrorCodes.InvalidEmbedUrl,
        'Invalid embed URL',
      );
    }
    if (options.iconURL != null) {
      author.icon_url = normalizeHttpUrl(
        options.iconURL,
        'Embed author icon URL',
        ErrorCodes.InvalidEmbedUrl,
        'Invalid embed URL',
      );
    }
    this.data.author = author;
    return this;
  }

  /**
   * Set embed footer. Pass null to clear.
   * @param options - Footer text and optional icon URL, or null
   * @returns This builder for chaining
   */
  setFooter(options: EmbedFooterOptions | null): this {
    if (options === null) {
      this.data.footer = undefined;
      return this;
    }
    assertObject('Embed footer options', options);
    assertLength('Embed footer text', options.text, 1, MAX.footerText);
    const footer: RESTPostAPIEmbedFooter = { text: options.text };
    if (options.iconURL != null) {
      footer.icon_url = normalizeHttpUrl(
        options.iconURL,
        'Embed footer icon URL',
        ErrorCodes.InvalidEmbedUrl,
        'Invalid embed URL',
      );
    }
    this.data.footer = footer;
    return this;
  }

  /**
   * Set embed image (large media below description). Pass null to clear.
   * @param input - URL string or media options, or null
   * @returns This builder for chaining
   * @throws {@link FluxerError} If URL is invalid
   * @throws {RangeError} If the media description exceeds 4096 characters
   */
  setImage(input: string | EmbedMediaOptions | null): this {
    this.data.image = input === null ? undefined : toMedia(input, 'image');
    return this;
  }

  /**
   * Set embed thumbnail (small media in top-right corner). Pass null to clear.
   * @param input - URL string or media options, or null
   * @returns This builder for chaining
   * @throws {@link FluxerError} If URL is invalid
   * @throws {RangeError} If the media description exceeds 4096 characters
   */
  setThumbnail(input: string | EmbedMediaOptions | null): this {
    this.data.thumbnail = input === null ? undefined : toMedia(input, 'thumbnail');
    return this;
  }

  /**
   * Replace all fields (max 25). Pass empty array to clear.
   * @param fields - Field objects (name, value, inline)
   * @returns This builder for chaining
   */
  setFields(...fields: EmbedFieldData[]): this {
    assertMaxCount('Embed field list', fields.length, MAX.fields);
    this.data.fields = fields.length
      ? fields.map((field, index) => toField(field, index))
      : undefined;
    return this;
  }

  /**
   * Add fields (up to 25 total). Existing fields are preserved.
   * @param fields - Field objects to append
   * @returns This builder for chaining
   */
  addFields(...fields: EmbedFieldData[]): this {
    const existing = this.data.fields ?? [];
    if (!Array.isArray(existing)) {
      throw new TypeError('Embed field list must be an array.');
    }
    const current = existing.map((field, index) => toField(field, index));
    assertMaxCount('Embed field list', current.length + fields.length, MAX.fields);
    current.push(...fields.map((field, index) => toField(field, current.length + index)));
    this.data.fields = current.length ? current : undefined;
    return this;
  }

  /**
   * Splice fields (like Array.prototype.splice).
   * @param index - Start index
   * @param deleteCount - Number of fields to remove
   * @param fields - Fields to insert at index
   * @returns This builder for chaining
   */
  spliceFields(index: number, deleteCount: number, ...fields: EmbedFieldData[]): this {
    const existing = this.data.fields ?? [];
    if (!Array.isArray(existing)) {
      throw new TypeError('Embed field list must be an array.');
    }
    const current = existing.map((field, fieldIndex) => toField(field, fieldIndex));
    const insertionIndex =
      index < 0 ? Math.max(current.length + index, 0) : Math.min(index, current.length);
    current.splice(
      index,
      deleteCount,
      ...fields.map((field, offset) => toField(field, insertionIndex + offset)),
    );
    assertMaxCount('Embed field list', current.length, MAX.fields);
    this.data.fields = current.length ? current : undefined;
    return this;
  }

  /**
   * Wire payload: request keys only, snake_case nested media/author/footer.
   * @returns API-ready embed object
   * @throws {RangeError} If an account-independent embed limit is exceeded
   */
  toJSON(): RESTPostAPIEmbed {
    const d = this.data;
    validateEmbedData(d);

    const out: RESTPostAPIEmbed = { description: d.description ?? null };
    if (d.title != null) out.title = d.title;
    if (d.url != null) out.url = d.url;
    if (d.color != null) out.color = d.color;
    if (d.timestamp != null) out.timestamp = d.timestamp;
    if (d.author) out.author = d.author;
    if (d.footer) out.footer = d.footer;
    if (d.image) out.image = d.image;
    if (d.thumbnail) out.thumbnail = d.thumbnail;
    if (d.fields?.length) out.fields = d.fields;
    return out;
  }

  /**
   * Copy request fields only — response video/audio/type/provider are ignored.
   * @param data - API embed from message or webhook
   * @returns New builder instance with copied data
   */
  static from(data: APIEmbed | RESTPostAPIEmbed): EmbedBuilder {
    const b = new EmbedBuilder();
    if (data.title != null) b.data.title = data.title;
    if (data.description != null) b.data.description = data.description;
    if (data.url != null) b.data.url = data.url;
    if (data.color != null) b.data.color = data.color;
    if (data.timestamp != null) b.data.timestamp = data.timestamp;
    if (data.author?.name) {
      b.data.author = {
        name: data.author.name,
        url: data.author.url,
        icon_url: data.author.icon_url,
      };
    }
    if (data.footer?.text) {
      b.data.footer = { text: data.footer.text, icon_url: data.footer.icon_url };
    }
    if (data.image?.url) {
      b.data.image = { url: data.image.url, description: data.image.description };
    }
    if (data.thumbnail?.url) {
      b.data.thumbnail = { url: data.thumbnail.url, description: data.thumbnail.description };
    }
    if (data.fields?.length) b.data.fields = data.fields;
    return b;
  }
}
