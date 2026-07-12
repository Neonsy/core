import type { APIChannelPinsPage, APIMessage } from '@fluxerjs/types';
import { Routes } from '@fluxerjs/types';
import type { Client } from '../../client/Client.js';
import { MessageManager } from '../../client/MessageManager.js';
import { MessageCollector, type MessageCollectorOptions } from '../../util/MessageCollector.js';
import { prepareMessagePostPayload, type MessagePrepareInput } from '../../util/messageUtils.js';
import { Message } from '../Message.js';
import type { Channel } from './base.js';

export type FetchPinnedMessagesOptions = { limit?: number; before?: string };

export type PinnedMessagesPage = {
  messages: Message[];
  pinnedAt: string[];
  hasMore: boolean;
};

export async function fetchPinnedMessagesPageFor(
  client: Client,
  channelId: string,
  options?: FetchPinnedMessagesOptions,
): Promise<PinnedMessagesPage> {
  const params = new URLSearchParams();
  if (options?.limit != null) params.set('limit', String(options.limit));
  if (options?.before) params.set('before', options.before);
  const qs = params.toString();
  const data = await client.rest.get<APIChannelPinsPage>(
    Routes.channelPins(channelId) + (qs ? `?${qs}` : ''),
  );
  const items = data.items ?? [];
  return {
    messages: items.map((item) => new Message(client, item.message)),
    pinnedAt: items.map((item) => item.pinned_at),
    hasMore: data.has_more ?? false,
  };
}

// Mixin ctors must use `any[]` (TS2545); narrowed at call sites via TBase.
// biome-ignore lint/suspicious/noExplicitAny: TS2545 mixin constructor constraint
type ChannelCtor = abstract new (...args: any[]) => Channel;

/** Mixin: send / messages / pins / collectors for TextChannel and DMChannel. */
export function TextCapable<TBase extends ChannelCtor>(Base: TBase) {
  abstract class TextCapableChannel extends Base {
    #messages: MessageManager | undefined;

    async send(options: MessagePrepareInput): Promise<Message> {
      const payload = await prepareMessagePostPayload(options, {
        defaultAllowedMentions: this.client.options.defaultAllowedMentions,
      });
      const data = await this.client.rest.post(Routes.channelMessages(this.id), payload);
      this.client._addMessageToCache(this.id, data as APIMessage);
      return new Message(this.client, data as APIMessage);
    }

    get messages(): MessageManager {
      if (!this.#messages) {
        this.#messages = new MessageManager(this.client, this.id);
      }
      return this.#messages;
    }

    createMessageCollector(options?: MessageCollectorOptions): MessageCollector {
      return new MessageCollector(this.client, this.id, options);
    }

    async fetchPinnedMessages(options?: FetchPinnedMessagesOptions): Promise<Message[]> {
      return (await this.fetchPinnedMessagesPage(options)).messages;
    }

    async fetchPinnedMessagesPage(
      options?: FetchPinnedMessagesOptions,
    ): Promise<PinnedMessagesPage> {
      return fetchPinnedMessagesPageFor(this.client, this.id, options);
    }
  }
  return TextCapableChannel;
}
