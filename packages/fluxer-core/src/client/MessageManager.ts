import type { APIMessage } from '@fluxerjs/types';
import { Routes } from '@fluxerjs/types';
import { Collection } from '@fluxerjs/collection';
import { FluxerAPIError, RateLimitError } from '@fluxerjs/rest';
import { FluxerError } from '../errors/FluxerError.js';
import { ErrorCodes } from '../errors/ErrorCodes.js';
import type { Client } from './Client.js';
import { Message } from '../structures/Message.js';
import type { BulkFetchMessagesRequest } from './sdkOptions.js';

/** Options for GET /channels/{id}/messages. */
export interface FetchMessagesOptions {
  limit?: number;
  before?: string;
  after?: string;
  around?: string;
}

/** Options for {@link Client.bulkFetchMessages}. */
export interface BulkFetchMessagesOptions {
  /** When true (default), hydrate {@link Message}s and update the cache. */
  hydrate?: boolean;
}

export interface BulkFetchMessagesChannelResult {
  channelId: string;
  messages: Collection<string, Message>;
}

export interface BulkFetchMessagesResult {
  channels: BulkFetchMessagesChannelResult[];
}

const BULK = {
  requests: { min: 1, max: 25 },
  limit: { min: 1, max: 25 },
  totalMax: 250,
} as const;

/** Validates POST /channels/messages/bulk request entries client-side. */
export function validateBulkMessageFetchRequests(
  requests: readonly BulkFetchMessagesRequest[],
): void {
  const { requests: req, limit, totalMax } = BULK;
  if (requests.length < req.min || requests.length > req.max) {
    throw new FluxerError(`bulkFetchMessages requires between ${req.min} and ${req.max} requests`, {
      code: ErrorCodes.InvalidFetchLimit,
    });
  }
  let total = 0;
  for (const request of requests) {
    if (request.limit < limit.min || request.limit > limit.max) {
      throw new FluxerError(
        `limit must be between ${limit.min} and ${limit.max} for channel ${request.channelId}`,
        { code: ErrorCodes.InvalidFetchLimit },
      );
    }
    total += request.limit;
  }
  if (total > totalMax) {
    throw new FluxerError(`bulkFetchMessages total message limit must not exceed ${totalMax}`, {
      code: ErrorCodes.InvalidFetchLimit,
    });
  }
}

/**
 * Per-channel message cache + fetch. Access via `channel.messages`.
 *
 * `fetch` always writes through the client message cache (when enabled) and
 * constructs {@link Message} from the cached payload so `get` stays coherent.
 */
export class MessageManager {
  constructor(
    private readonly client: Client,
    private readonly channelId: string,
  ) {}

  /** Retrieve a cached message by ID, or `undefined` if missing / caching disabled. */
  get(messageId: string): Message | undefined {
    const data = this.client._getMessageCache(this.channelId)?.get(messageId);
    return data ? new Message(this.client, data) : undefined;
  }

  /** Fetch a single message by ID. */
  async fetch(messageId: string): Promise<Message>;
  /** Fetch multiple messages with query options (limit, before, after, around). */
  async fetch(options: FetchMessagesOptions): Promise<Collection<string, Message>>;
  async fetch(
    idOrOptions: string | FetchMessagesOptions,
  ): Promise<Message | Collection<string, Message>> {
    return typeof idOrOptions === 'string'
      ? this.fetchOne(idOrOptions)
      : this.fetchMany(idOrOptions);
  }

  /** Cache API data and return a {@link Message} built from the cached entry when present. */
  private wrap(data: APIMessage): Message {
    this.client._addMessageToCache(this.channelId, data);
    const cached = this.client._getMessageCache(this.channelId)?.get(data.id) ?? data;
    return new Message(this.client, cached);
  }

  /** Fetch a single message from the API. */
  private async fetchOne(messageId: string): Promise<Message> {
    try {
      const data = await this.client.rest.get<APIMessage>(
        Routes.channelMessage(this.channelId, messageId),
      );
      return this.wrap(data);
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

  /** Fetch multiple messages from the API with pagination/filtering. */
  private async fetchMany(options: FetchMessagesOptions): Promise<Collection<string, Message>> {
    if (options.limit != null && (options.limit < 1 || options.limit > 100)) {
      throw new FluxerError('limit must be between 1 and 100', {
        code: ErrorCodes.InvalidFetchLimit,
      });
    }

    const qs = new URLSearchParams();
    for (const key of ['limit', 'before', 'after', 'around'] as const) {
      const value = options[key];
      if (value != null && value !== '') qs.set(key, String(value));
    }
    const base = Routes.channelMessages(this.channelId);
    const data = await this.client.rest.get<APIMessage[]>(qs.size > 0 ? `${base}?${qs}` : base);

    const collection = new Collection<string, Message>();
    for (const msg of data) collection.set(msg.id, this.wrap(msg));
    return collection;
  }
}
