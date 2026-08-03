import type { APIAllowedMentions, APIMessageReference } from '@fluxerjs/types';
import { AttachmentBuilder } from './AttachmentBuilder.js';
import { EmbedBuilder, type RESTPostAPIEmbed, validateMessageEmbeds } from './EmbedBuilder.js';

export interface MessagePayloadData {
  content?: string | null;
  embeds?: RESTPostAPIEmbed[] | null;
  attachments?: Array<{ id: number; filename: string; description?: string | null }>;
  message_reference?: APIMessageReference | null;
  allowed_mentions?: APIAllowedMentions | null;
  tts?: boolean;
  flags?: number;
}

export type MessagePayloadCreateOptions = Omit<MessagePayloadData, 'embeds'> & {
  embeds?: (RESTPostAPIEmbed | EmbedBuilder)[] | null;
};

type AttachmentInput =
  | AttachmentBuilder
  | { id: number; filename: string; description?: string | null };

type ReplyInput =
  | { channelId: string; messageId: string; guildId?: string | null }
  | { channel_id: string; message_id: string; guild_id?: string | null }
  | APIMessageReference;

function toReply(reference: ReplyInput): APIMessageReference {
  if ('channelId' in reference) {
    return {
      channel_id: reference.channelId,
      message_id: reference.messageId,
      guild_id: reference.guildId ?? undefined,
    };
  }
  return {
    channel_id: reference.channel_id,
    message_id: reference.message_id,
    guild_id: reference.guild_id ?? undefined,
  };
}

/**
 * Fluent message builder (camelCase setters → snake_case via {@link toJSON}).
 *
 * Prefer passing the builder to `channel.send(payload)` / `prepareMessagePostPayload(payload)`
 * in `@fluxerjs/core` so defaults (allowed mentions, reply ping) apply. Use {@link toJSON}
 * only for low-level REST bodies.
 *
 * @example
 * ```ts
 * const payload = new MessagePayload()
 *   .setContent('Hello!')
 *   .addEmbed(new EmbedBuilder().setTitle('Title'));
 * await channel.send(payload);
 * ```
 */
export class MessagePayload {
  /** Partial message data (built incrementally via setters). */
  public readonly data: MessagePayloadData = {};

  /**
   * Set message content. Pass null to clear.
   * @param content - Text content or null
   * @returns This builder for chaining
   */
  setContent(content: string | null): this {
    this.data.content = content ?? undefined;
    return this;
  }

  /**
   * Replace all embeds. Pass null or empty array to clear.
   * @param embeds - Array of embed objects or {@link EmbedBuilder} instances, or null
   * @returns This builder for chaining
   */
  setEmbeds(embeds: (RESTPostAPIEmbed | EmbedBuilder)[] | null): this {
    if (embeds === null || (Array.isArray(embeds) && embeds.length === 0)) {
      this.data.embeds = undefined;
      return this;
    }
    if (!Array.isArray(embeds)) {
      throw new TypeError('Message embed list must be an array.');
    }
    const resolved = embeds.map((embed) =>
      embed instanceof EmbedBuilder ? embed.toJSON() : embed,
    );
    validateMessageEmbeds(resolved);
    this.data.embeds = resolved;
    return this;
  }

  /**
   * Add an embed. Existing embeds are preserved.
   * @param embed - Embed object or {@link EmbedBuilder}
   * @returns This builder for chaining
   */
  addEmbed(embed: RESTPostAPIEmbed | EmbedBuilder): this {
    const existing = this.data.embeds ?? [];
    validateMessageEmbeds(existing);
    const list = existing.slice();
    list.push(embed instanceof EmbedBuilder ? embed.toJSON() : embed);
    validateMessageEmbeds(list);
    this.data.embeds = list;
    return this;
  }

  /**
   * Set attachments metadata (file bytes sent separately via multipart). Pass null to clear.
   * @param attachments - Array of {@link AttachmentBuilder} or attachment metadata, or null
   * @returns This builder for chaining
   */
  setAttachments(attachments: AttachmentInput[] | null): this {
    if (!attachments?.length) {
      this.data.attachments = undefined;
      return this;
    }
    this.data.attachments = attachments.map((a) =>
      a instanceof AttachmentBuilder ? a.toJSON() : a,
    );
    return this;
  }

  /**
   * Set message reference (reply target). Pass null to clear.
   * @param reference - Reply target (channel/message IDs), or null
   * @returns This builder for chaining
   */
  setReply(reference: ReplyInput | null): this {
    this.data.message_reference = reference ? toReply(reference) : undefined;
    return this;
  }

  /**
   * Set allowed mentions (controls who can be pinged). Pass null to clear.
   * @param allowedMentions - Allowed mention rules, or null
   * @returns This builder for chaining
   */
  setAllowedMentions(allowedMentions: APIAllowedMentions | null): this {
    this.data.allowed_mentions = allowedMentions ?? undefined;
    return this;
  }

  /**
   * Set text-to-speech flag.
   * @param tts - Whether to use TTS
   * @returns This builder for chaining
   */
  setTTS(tts: boolean): this {
    this.data.tts = tts;
    return this;
  }

  /**
   * Set message flags (e.g., suppress embeds).
   * @param flags - Message flags bitfield
   * @returns This builder for chaining
   */
  setFlags(flags: number): this {
    this.data.flags = flags;
    return this;
  }

  /**
   * Serialize to API payload (snake_case keys).
   * @returns API-ready message data
   */
  toJSON(): MessagePayloadData {
    validateMessageEmbeds(this.data.embeds ?? []);
    return { ...this.data };
  }

  /**
   * Create from string content or options object.
   * @param contentOrOptions - Text content or full payload options
   * @returns New MessagePayload instance
   */
  static create(contentOrOptions?: string | MessagePayloadCreateOptions): MessagePayload {
    const payload = new MessagePayload();
    if (typeof contentOrOptions === 'string') return payload.setContent(contentOrOptions);
    if (!contentOrOptions) return payload;

    const { content, embeds, attachments, message_reference, allowed_mentions, tts, flags } =
      contentOrOptions;
    if (content !== undefined) payload.setContent(content ?? null);
    if (embeds !== undefined) payload.setEmbeds(embeds);
    if (attachments?.length) payload.setAttachments(attachments);
    if (message_reference) payload.setReply(message_reference);
    if (allowed_mentions) payload.setAllowedMentions(allowed_mentions);
    if (tts !== undefined) payload.setTTS(tts);
    if (flags !== undefined) payload.setFlags(flags);
    return payload;
  }
}
