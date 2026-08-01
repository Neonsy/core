import type { EmbedBuilder } from '@fluxerjs/builders';
import type { RESTPostAPIEmbed } from '@fluxerjs/types';
import type { MessageAttachmentEdit } from '../../ClientCore/SdkOptions/index.js';
import type {
  AllowedMentionsOptions,
  MessageReplyTarget,
  prepareMessagePostPayload,
} from '../../Helpers/MessageUtils/index.js';
import type { Message } from './Message.js';

/** Options for PATCH /channels/{id}/messages/{id}. */
export interface MessageEditOptions {
  content?: string | null;
  embeds?: (RESTPostAPIEmbed | EmbedBuilder)[];
  allowedMentions?: AllowedMentionsOptions;
  flags?: number;
  /** Keep by snowflake `id`, or add via `uploadFilename` from the presigned upload flow. */
  attachments?: MessageAttachmentEdit[];
}

export type PreparedMessagePost = Awaited<ReturnType<typeof prepareMessagePostPayload>>;

/** @deprecated Use {@link PreparedMessagePost}. */
export type MessagePayload = PreparedMessagePost;

/** Second-arg / inline options for `message.reply()`. */
export interface ReplyOptions {
  /** `false` suppresses the replied-user ping (`allowed_mentions.replied_user`). Default: client `defaultReplyPing`. */
  ping?: boolean;
  /** Reply to a different message. Default: this message. */
  replyTo?: Message | MessageReplyTarget;
}

export type {
  AllowedMentionsOptions,
  MessagePrepareInput,
  MessageReplyTarget,
  MessageSendOptions,
} from '../../Helpers/MessageUtils/index.js';
export { AllowedMentions } from '../../Helpers/MessageUtils/index.js';
