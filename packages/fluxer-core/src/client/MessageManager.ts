import { APIMessage, Routes } from '@fluxerjs/types';
import { Collection } from '@fluxerjs/collection';
import { FluxerAPIError, RateLimitError } from '@fluxerjs/rest';
import { FluxerError } from '../errors/FluxerError.js';
import { ErrorCodes } from '../errors/ErrorCodes.js';
import { Client } from './Client.js';
import { Message } from '../structures/Message';

/** Options for GET /channels/{id}/messages (list/paginate). */
export interface FetchMessagesOptions {
  /** Number of messages to return (1–100, default 50). */
  limit?: number;
  /** Return messages with IDs before this snowflake. */
  before?: string;
  /** Return messages with IDs after this snowflake. */
  after?: string;
  /** Return messages around this snowflake. */
  around?: string;
}

/**
 * Manages messages for a channel. Access via channel.messages.
 * @example
 * const message = channel.messages.get(messageId);  // from cache (if enabled)
 * const message = await channel.messages.fetch(messageId);  // from API
 * const messages = await channel.messages.fetch({ limit: 50, before: messageId });
 * if (message) await message.edit({ content: 'Updated!' });
 */
export class MessageManager {
  constructor(
    private readonly client: Client,
    private readonly channelId: string,
  ) {}

  /**
   * Get a message from cache. Returns undefined if not cached or caching is disabled.
   * Requires options.cache.messages > 0.
   * @param messageId - Snowflake of the message
   */
  get(messageId: string): Message | undefined {
    const data = this.client._getMessageCache(this.channelId)?.get(messageId);
    return data ? new Message(this.client, data) : undefined;
  }

  /**
   * Fetch a message by ID from this channel.
   * When message caching is enabled, the fetched message is added to the cache.
   * @param messageId - Snowflake of the message
   * @returns The message
   * @throws FluxerError with MESSAGE_NOT_FOUND if the message does not exist
   */
  async fetch(messageId: string): Promise<Message>;
  /**
   * Fetch multiple messages from this channel.
   * GET /channels/{channel_id}/messages — supports limit, before, after, and around.
   * Returns messages in reverse chronological order (newest first).
   * @param options - Pagination options
   * @returns Collection of messages keyed by message ID
   */
  async fetch(options: FetchMessagesOptions): Promise<Collection<string, Message>>;
  async fetch(
    messageIdOrOptions: string | FetchMessagesOptions,
  ): Promise<Message | Collection<string, Message>> {
    if (typeof messageIdOrOptions === 'string') {
      return this.fetchOne(messageIdOrOptions);
    }
    return this.fetchMany(messageIdOrOptions);
  }

  private async fetchOne(messageId: string): Promise<Message> {
    try {
      const data = await this.client.rest.get<APIMessage>(
        Routes.channelMessage(this.channelId, messageId),
      );
      this.client._addMessageToCache(this.channelId, data);
      return new Message(this.client, data);
    } catch (err) {
      if (err instanceof RateLimitError) throw err;
      if (err instanceof FluxerAPIError && err.statusCode === 404) {
        throw new FluxerError(`Message ${messageId} not found in channel ${this.channelId}`, {
          code: ErrorCodes.MessageNotFound,
          cause: err,
        });
      }
      throw err instanceof FluxerError
        ? err
        : new FluxerError(String(err), { cause: err as Error });
    }
  }

  private async fetchMany(options: FetchMessagesOptions): Promise<Collection<string, Message>> {
    const params = new URLSearchParams();
    if (options.limit != null) {
      if (options.limit < 1 || options.limit > 100) {
        throw new RangeError('limit must be between 1 and 100');
      }
      params.set('limit', String(options.limit));
    }
    if (options.before) params.set('before', options.before);
    if (options.after) params.set('after', options.after);
    if (options.around) params.set('around', options.around);
    const qs = params.toString();
    const route = Routes.channelMessages(this.channelId) + (qs ? `?${qs}` : '');

    const data = await this.client.rest.get<APIMessage[]>(route);
    const collection = new Collection<string, Message>();
    for (const msg of data) {
      this.client._addMessageToCache(this.channelId, msg);
      collection.set(msg.id, new Message(this.client, msg));
    }
    return collection;
  }
}
