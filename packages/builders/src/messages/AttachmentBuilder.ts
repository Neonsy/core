import { ErrorCodes, FluxerError } from '@fluxerjs/util';

/** Options for attachment builder. */
export interface AttachmentPayloadOptions {
  /** Filename (required, will be prefixed with `SPOILER_` if spoiler is true). */
  name: string;
  /** Alt text / description for accessibility (optional). */
  description?: string;
  /** Whether this attachment should be hidden until clicked (optional). */
  spoiler?: boolean;
}

/** API-ready attachment payload. */
export interface APIAttachmentPayload {
  /** Attachment ID (index in files array). */
  id: number;
  /** Filename (may be prefixed with `SPOILER_`). */
  filename: string;
  /** Alt text / description (optional). */
  description?: string | null;
}

function requireFilename(name: string): string {
  if (!name?.trim()) {
    throw new FluxerError('Filename is required', { code: ErrorCodes.AttachmentFilenameRequired });
  }
  return name;
}

/**
 * Attachment metadata for message payloads (file bytes sent separately).
 * @example
 * ```ts
 * const attachment = new AttachmentBuilder(0, 'cat.png')
 *   .setDescription('Cute cat')
 *   .setSpoiler();
 * await message.reply({ files: [fileData], attachments: [attachment] });
 * ```
 */
export class AttachmentBuilder {
  /** Attachment ID (index in files array). */
  public readonly id: number;
  /** Filename (may be prefixed with `SPOILER_` if spoiler is true). */
  public filename: string;
  /** Alt text / description for accessibility. */
  public description?: string | null;
  /** Whether this attachment should be hidden until clicked. */
  public spoiler: boolean;

  constructor(id: number, filename: string, options?: Partial<AttachmentPayloadOptions>) {
    this.id = id;
    this.spoiler = options?.spoiler ?? false;
    this.filename = this.spoiler
      ? `SPOILER_${requireFilename(filename)}`
      : requireFilename(filename);
    this.description = options?.description ?? undefined;
  }

  /**
   * Set attachment filename (preserves spoiler prefix if enabled).
   * @param name - New filename
   * @returns This builder for chaining
   * @throws {@link FluxerError} If filename is empty
   */
  setName(name: string): this {
    this.filename = this.spoiler ? `SPOILER_${requireFilename(name)}` : requireFilename(name);
    return this;
  }

  /**
   * Set attachment description (alt text for accessibility). Pass null to clear.
   * @param description - Description text or null
   * @returns This builder for chaining
   */
  setDescription(description: string | null): this {
    this.description = description ?? undefined;
    return this;
  }

  /**
   * Toggle spoiler flag (adds/removes `SPOILER_` prefix from filename).
   * @param spoiler - Whether this attachment should be hidden
   * @returns This builder for chaining
   */
  setSpoiler(spoiler = true): this {
    this.spoiler = spoiler;
    if (spoiler && !this.filename.startsWith('SPOILER_')) {
      this.filename = `SPOILER_${this.filename}`;
    } else if (!spoiler && this.filename.startsWith('SPOILER_')) {
      this.filename = this.filename.slice(8);
    }
    return this;
  }

  /**
   * Serialize to API attachment payload.
   * @returns API-ready attachment metadata
   */
  toJSON(): APIAttachmentPayload {
    const payload: APIAttachmentPayload = { id: this.id, filename: this.filename };
    if (this.description != null) payload.description = this.description;
    return payload;
  }
}
