/** Emoji / sticker SDK options. */

/** Options for creating a guild/pack emoji (`name` + base64 `image`). */
export interface ExpressionCreateOptions {
  name: string;
  image: string;
}

/** Convert {@link ExpressionCreateOptions} to the emoji create wire body. */
export function toEmojiCreateBody(options: ExpressionCreateOptions): Record<string, unknown> {
  return { name: options.name, image: options.image };
}

/** Options for editing a pack/guild emoji. */
export interface ExpressionEditOptions {
  name: string;
}

/** Convert {@link ExpressionEditOptions} to the emoji edit wire body. */
export function toEmojiEditBody(options: ExpressionEditOptions): Record<string, unknown> {
  return { name: options.name };
}

/** Options for creating a pack/guild sticker. */
export interface StickerCreateOptions {
  name: string;
  /** Base64 image data (`image` on the wire). */
  file: string;
  description?: string | null;
  tags?: string[];
}

/** Options for editing a pack/guild sticker. */
export interface StickerEditOptions {
  name?: string;
  description?: string | null;
  tags?: string[];
}

/** Convert {@link StickerCreateOptions} to the sticker create wire body. */
export function toStickerCreateBody(options: StickerCreateOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: options.name,
    image: options.file,
  };
  if (options.description !== undefined) body.description = options.description;
  if (options.tags !== undefined) body.tags = options.tags;
  return body;
}

/** Convert {@link StickerEditOptions} to the sticker edit wire body. */
export function toStickerEditBody(options: StickerEditOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (options.name !== undefined) body.name = options.name;
  if (options.description !== undefined) body.description = options.description;
  if (options.tags !== undefined) body.tags = options.tags;
  return body;
}
