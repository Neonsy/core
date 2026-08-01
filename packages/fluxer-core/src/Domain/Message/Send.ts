import { MessagePayload as MessagePayloadBuilder } from '@fluxerjs/builders';
import type { APIMessage } from '@fluxerjs/types';
import { Routes } from '@fluxerjs/types';
import {
  type MessagePrepareInput,
  type MessageReplyTarget,
  type MessageSendOptions,
  messagePayloadToSendOptions,
  prepareMessagePostPayload,
} from '../../Helpers/MessageUtils/index.js';
import { ErrorCodes } from '../../LibErrors/ErrorCodes.js';
import { FluxerError } from '../../LibErrors/FluxerError.js';
import type { Message } from './Message.js';
import type { PreparedMessagePost, ReplyOptions } from './Types.js';

function toReplyTarget(ref: {
  channel_id: string;
  message_id: string;
  guild_id?: string;
}): MessageReplyTarget {
  return {
    channelId: ref.channel_id,
    messageId: ref.message_id,
    ...(ref.guild_id != null ? { guildId: ref.guild_id } : {}),
  };
}

function toSendOptions(content: MessagePrepareInput): MessageSendOptions {
  if (typeof content === 'string') return { content };
  if (content instanceof MessagePayloadBuilder) return messagePayloadToSendOptions(content);
  return { ...content };
}

/** Build POST payload. Exposed as `Message._createMessageBody` for tests. */
export async function createMessageBody(
  content: MessagePrepareInput,
  referenced_message?: { channel_id: string; message_id: string; guild_id?: string },
  ping?: boolean,
): Promise<PreparedMessagePost> {
  if (typeof content === 'string' && content.length === 0) {
    throw new FluxerError('Cannot send an empty message', { code: ErrorCodes.EmptyMessage });
  }
  const opts = toSendOptions(content);
  if (referenced_message) {
    opts.replyTo = toReplyTarget(referenced_message);
    if (ping !== undefined) opts.ping = ping;
  }
  return prepareMessagePostPayload(opts);
}

function asReplyTarget(value: Message | MessageReplyTarget): MessageReplyTarget {
  if ('messageId' in value) return value;
  return {
    channelId: value.channelId,
    messageId: value.id,
    guildId: value.guildId,
  };
}

/** POST a prepared payload to this message's channel. */
export async function sendPrepared(
  message: Message,
  payload: PreparedMessagePost,
): Promise<Message> {
  const data = await message.client.rest.post<APIMessage>(
    Routes.channelMessages(message.channelId),
    payload,
  );
  message.client._addMessageToCache(message.channelId, data);
  return new (message.constructor as typeof Message)(message.client, data);
}

/** Send a standalone message in this channel (not a reply). */
export async function sendMessage(
  message: Message,
  options: MessagePrepareInput,
): Promise<Message> {
  return message._send(
    await prepareMessagePostPayload(options, {
      defaultAllowedMentions: message.client.options.defaultAllowedMentions,
    }),
  );
}

/** Send to another channel via the channel manager. */
export async function sendMessageTo(
  message: Message,
  channelId: string,
  options: MessagePrepareInput,
): Promise<Message> {
  return message.client.channels.send(channelId, options);
}

/**
 * Reply to a message. Second-arg `ReplyOptions` wins over first-arg reply fields.
 * `ping: false` → `allowed_mentions.replied_user=false` (via `prepareMessagePostPayload`).
 */
export async function replyToMessage(
  message: Message,
  options: string | (MessageSendOptions & ReplyOptions),
  replyOptions?: ReplyOptions,
): Promise<Message> {
  const opts = typeof options === 'string' ? { content: options } : { ...options };
  const { replyTo: inlineReplyTo, ping: inlinePing, ...sendOpts } = opts;

  const ping = replyOptions?.ping ?? inlinePing ?? message.client.options.defaultReplyPing;
  const replyTo = asReplyTarget(replyOptions?.replyTo ?? inlineReplyTo ?? message);

  return message._send(
    await prepareMessagePostPayload(
      { ...sendOpts, replyTo, ping },
      { defaultAllowedMentions: message.client.options.defaultAllowedMentions },
    ),
  );
}
