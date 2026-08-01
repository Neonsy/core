import type {
  GatewayMessageReactionAddDispatchData,
  GatewayMessageReactionRemoveDispatchData,
} from '@fluxerjs/types';
import { type APIMessage, Routes } from '@fluxerjs/types';
import type { Client } from '../../ClientCore/Client.js';
import type { ReactionEmojiPayload } from '../../ClientCore/EventPayloads.js';
import { rethrowMapped } from '../../Helpers/HttpErrors.js';
import { ErrorCodes } from '../../LibErrors/ErrorCodes.js';
import { Base } from '../Base.js';
import type { Guild } from '../Guild/index.js';
import { Message } from './index.js';

/** Represents a reaction added to or removed from a message. */
export class MessageReaction extends Base {
  readonly client: Client;
  readonly messageId: string;
  readonly channelId: string;
  readonly guildId: string | null;
  readonly emoji: ReactionEmojiPayload;
  /** Raw gateway payload for low-level access. */
  readonly _data: GatewayMessageReactionAddDispatchData | GatewayMessageReactionRemoveDispatchData;

  constructor(
    client: Client,
    data: GatewayMessageReactionAddDispatchData | GatewayMessageReactionRemoveDispatchData,
  ) {
    super();
    this.client = client;
    this._data = data;
    this.messageId = data.message_id;
    this.channelId = data.channel_id;
    this.guildId = data.guild_id ?? null;
    this.emoji = {
      name: data.emoji.name,
      ...(data.emoji.id !== undefined ? { id: data.emoji.id } : {}),
      ...(data.emoji.animated !== undefined ? { animated: data.emoji.animated } : {}),
    };
  }

  /** Emoji as a string for reaction routes: unicode or `name:id` (`a:name:id` when animated). */
  get emojiIdentifier(): string {
    return this.emoji.id
      ? this.emoji.animated
        ? `a:${this.emoji.name}:${this.emoji.id}`
        : `${this.emoji.name}:${this.emoji.id}`
      : this.emoji.name;
  }

  /** Guild where this reaction was added. Resolved from cache; null for DMs or if not cached. */
  get guild(): Guild | null {
    return this.guildId ? (this.client.guilds.get(this.guildId) ?? null) : null;
  }

  /**
   * Fetch the message this reaction belongs to.
   * Use when you need to edit, delete, or otherwise interact with the message.
   * @throws FluxerError with MESSAGE_NOT_FOUND if the message does not exist
   */
  async fetchMessage(): Promise<Message> {
    try {
      const data = await this.client.rest.get<APIMessage>(
        Routes.channelMessage(this.channelId, this.messageId),
      );
      return new Message(this.client, data);
    } catch (err) {
      rethrowMapped(err, {
        notFound: {
          code: ErrorCodes.MessageNotFound,
          message: `Message ${this.messageId} not found in channel ${this.channelId}`,
        },
        fallback: `Failed to fetch message ${this.messageId}`,
      });
    }
  }
}
