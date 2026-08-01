import { LimitedCollection } from '@fluxerjs/collection';
import { type APIChannel, type APIMessage, Routes } from '@fluxerjs/types';
import { Channel, type GuildChannel } from '../Domain/Channel/index.js';
import { cacheChannel, putChannel } from '../Domain/Guild/Cache.js';
import { Message } from '../Domain/Message/index.js';
import { rethrowMapped } from '../Helpers/HttpErrors.js';
import {
  type MessagePrepareInput,
  prepareMessagePostPayload,
} from '../Helpers/MessageUtils/index.js';
import { ErrorCodes } from '../LibErrors/ErrorCodes.js';
import { FluxerError } from '../LibErrors/FluxerError.js';
import type { Client } from './Client.js';
import { MessageManager } from './MessageManager.js';

/**
 * Channel cache + fetch/send helpers.
 * Extends {@link LimitedCollection} (`.get()`, `.set()`, `.filter()`, …).
 * FIFO-evicts (and keeps guild indexes / message caches aligned) at `cache.channels`.
 */
export class ChannelManager extends LimitedCollection<string, Channel | GuildChannel> {
  constructor(private readonly client: Client) {
    super({
      maxSize: client.cache.limits.channels,
      onEvict: (_id, channel) => client.cache.cascadeChannel(channel, 'global'),
    });
  }

  override delete(key: string): boolean {
    const channel = this.get(key);
    const deleted = super.delete(key);
    if (deleted && channel && !this.client.cache.cascading) {
      this.client.cache.cascadeChannel(channel, 'global');
    }
    return deleted;
  }

  /** Retrieve from cache, otherwise {@link fetch}. */
  async resolve(channelId: string): Promise<Channel> {
    return this.get(channelId) ?? this.fetch(channelId);
  }

  /**
   * Fetch a channel by ID.
   * Returns the cached channel unless `force` is set, in which case REST metadata is applied.
   * @throws {@link FluxerError} with CHANNEL_NOT_FOUND if missing
   */
  async fetch(channelId: string, options?: { force?: boolean }): Promise<Channel> {
    const cached = this.get(channelId);
    if (cached && !options?.force) return cached;

    try {
      const data = await this.client.rest.get<APIChannel>(Routes.channel(channelId));
      const guildId =
        'guild_id' in data ? (data as APIChannel & { guild_id?: string }).guild_id : undefined;
      if (guildId) {
        const guild = this.client.guilds.get(guildId);
        if (guild) {
          const channel = cacheChannel(guild, data);
          if (channel) return channel;
        }
      }
      const channel = Channel.fromOrCreate(this.client, data);
      if (!channel) {
        throw new FluxerError('Channel data invalid or unsupported type', {
          code: ErrorCodes.ChannelNotFound,
        });
      }
      putChannel(this.client, channel);
      return channel;
    } catch (err) {
      rethrowMapped(err, {
        notFound: {
          code: ErrorCodes.ChannelNotFound,
          message: `Channel ${channelId} not found`,
        },
        fallback: `Channel ${channelId} not found`,
      });
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
