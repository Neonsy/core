import { Collection } from '@fluxerjs/collection';
import { type APIChannel, type APIMessage, Routes } from '@fluxerjs/types';
import { FluxerAPIError, RateLimitError } from '@fluxerjs/rest';
import { FluxerError } from '../errors/FluxerError.js';
import { ErrorCodes } from '../errors/ErrorCodes.js';
import { prepareMessagePostPayload, type MessagePrepareInput } from '../util/messageUtils.js';
import type { Client } from './Client.js';
import { Channel, type GuildChannel } from '../structures/Channel.js';
import { Message } from '../structures/Message.js';
import { MessageManager } from './MessageManager.js';

function rethrowNotFound(err: unknown, message: string, code: string): never {
  if (err instanceof RateLimitError) throw err;
  if (err instanceof FluxerAPIError && err.statusCode === 404) {
    throw new FluxerError(message, { code, cause: err });
  }
  throw err instanceof FluxerError ? err : new FluxerError(String(err), { cause: err as Error });
}

/**
 * Channel cache + fetch/send helpers.
 * Extends {@link Collection} (`.get()`, `.set()`, `.filter()`, …).
 */
export class ChannelManager extends Collection<string, Channel | GuildChannel> {
  private readonly maxSize: number;

  constructor(private readonly client: Client) {
    super();
    this.maxSize = client.options?.cache?.channels ?? 0;
  }

  /** Set a channel in the cache (evicts oldest if at capacity). */
  override set(key: string, value: Channel): this {
    if (this.maxSize > 0 && this.size >= this.maxSize && !this.has(key)) {
      const oldest = this.keys().next().value;
      if (oldest !== undefined) this.delete(oldest);
    }
    return super.set(key, value);
  }

  /** Retrieve from cache, otherwise {@link fetch}. */
  async resolve(channelId: string): Promise<Channel> {
    return this.get(channelId) ?? this.fetch(channelId);
  }

  /**
   * Fetch a channel by ID (returns cache if present).
   * @throws {@link FluxerError} with CHANNEL_NOT_FOUND if missing
   */
  async fetch(channelId: string): Promise<Channel> {
    const cached = this.get(channelId);
    if (cached) return cached;

    try {
      const data = await this.client.rest.get<APIChannel>(Routes.channel(channelId));
      const channel = Channel.fromOrCreate(this.client, data);
      if (!channel) {
        throw new FluxerError('Channel data invalid or unsupported type', {
          code: ErrorCodes.ChannelNotFound,
        });
      }
      this.set(channel.id, channel);
      if ('guildId' in channel) {
        this.client.guilds.get(channel.guildId)?.channels.set(channel.id, channel);
      }
      return channel;
    } catch (err) {
      rethrowNotFound(err, `Channel ${channelId} not found`, ErrorCodes.ChannelNotFound);
    }
  }

  /**
   * Fetch a message by channel + message ID (no channel resolve required).
   * Prefer `channel.messages.fetch(messageId)` when you already have a text channel.
   */
  async fetchMessage(channelId: string, messageId: string): Promise<Message> {
    return new MessageManager(this.client, channelId).fetch(messageId);
  }

  /**
   * Send to a channel by ID without resolving it first.
   * @example
   * await client.channels.send(logChannelId, 'User joined!');
   */
  async send(channelId: string, payload: MessagePrepareInput): Promise<Message> {
    const postPayload = await prepareMessagePostPayload(payload, {
      defaultAllowedMentions: this.client.options.defaultAllowedMentions,
    });
    const data = (await this.client.rest.post(
      Routes.channelMessages(channelId),
      postPayload,
    )) as APIMessage;
    this.client._addMessageToCache(channelId, data);
    return new Message(this.client, data);
  }
}
