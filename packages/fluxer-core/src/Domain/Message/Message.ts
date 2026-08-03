import { EmbedBuilder } from '@fluxerjs/builders';
import { Collection } from '@fluxerjs/collection';
import {
  type APIAllowedMentions,
  type APIEmbed,
  type APIMessage,
  type APIMessageAttachment,
  type APIMessageCall,
  type APIMessageReaction,
  type APIMessageReference,
  type APIMessageSnapshot,
  type APIMessageSticker,
  MessageType,
  type RESTPostAPIEmbed,
  Routes,
} from '@fluxerjs/types';
import type { Client } from '../../ClientCore/Client.js';
import { toMessageAttachmentEditWire } from '../../ClientCore/SdkOptions/index.js';
import {
  type MessagePrepareInput,
  type MessageSendOptions,
  toAPIAllowedMentions,
} from '../../Helpers/MessageUtils/index.js';
import {
  ReactionCollector,
  type ReactionCollectorOptions,
} from '../../Helpers/ReactionCollector.js';
import { Base } from '../Base.js';
import type { Channel, DMChannel, GuildChannel, TextChannel } from '../Channel/index.js';
import type { Guild } from '../Guild/index.js';
import type { User } from '../User.js';
import {
  fetchMessageReactionUsers,
  fetchMessageReactionUsersPage,
  reactToMessage,
  removeAllMessageReactions,
  removeMessageReaction,
  removeMessageReactionEmoji,
} from './Reactions.js';
import {
  createMessageBody,
  replyToMessage,
  sendMessage,
  sendMessageTo,
  sendPrepared,
} from './Send.js';
import type { MessageEditOptions, PreparedMessagePost, ReplyOptions } from './Types.js';

type EmojiInput = string | { name: string; id?: string; animated?: boolean };

/** A message in a channel. */
export class Message extends Base {
  /** The {@link Client} that instantiated this message. */
  readonly client: Client;
  /** Snowflake ID of this message. */
  readonly id: string;
  /** Channel ID where this message was sent. */
  readonly channelId: string;
  /** Guild ID if in a guild channel, null for DMs. */
  readonly guildId: string | null;
  /** The user who sent this message. */
  readonly author: User;
  /** Text content of the message. */
  content: string;
  /** When the message was created. */
  readonly createdAt: Date;
  /** When the message was last edited, or null if never edited. */
  readonly editedAt: Date | null;
  /** Whether the message is pinned. */
  pinned: boolean;
  /** Attached files (images, videos, etc.). */
  readonly attachments: Collection<string, APIMessageAttachment>;
  /** Message type (Default, Reply, etc.). */
  readonly type: MessageType;
  /** Message flags bitfield. */
  readonly flags: number;
  /** Whether `@everyone` or `@here` was mentioned. */
  readonly mentionEveryone: boolean;
  /** Whether this is a text-to-speech message. */
  readonly tts: boolean;
  /** Embedded content (rich previews, etc.). */
  readonly embeds: APIEmbed[];
  /** Stickers sent with the message. */
  readonly stickers: APIMessageSticker[];
  /** Reactions on the message. */
  readonly reactions: APIMessageReaction[];
  /** Reference to a replied-to message, if any. */
  readonly messageReference: APIMessageReference | null;
  /** Message snapshots for forwarded messages. */
  readonly messageSnapshots: APIMessageSnapshot[];
  /** Call data if this message represents a call event. */
  readonly call: APIMessageCall | null;
  /** The full referenced (replied-to) message, or null. */
  readonly referencedMessage: Message | null;
  /** Webhook ID if sent by a webhook. */
  readonly webhookId: string | null;
  /** Users mentioned in the message. */
  readonly mentions: User[];
  /** Role IDs mentioned in the message. */
  readonly mentionRoles: string[];
  /** Client-side nonce for deduplication. */
  readonly nonce: string | null;

  /** Cached text/DM/guild channel, or null if uncached. */
  get channel(): (TextChannel | DMChannel | GuildChannel) | null {
    return (this.client.channels.get(this.channelId) ?? null) as
      | (TextChannel | DMChannel | GuildChannel)
      | null;
  }

  /** Cached guild, or null for DMs / uncached. */
  get guild(): Guild | null {
    return this.guildId ? (this.client.guilds.get(this.guildId) ?? null) : null;
  }

  /** Fetch and resolve the channel this message is in. */
  async resolveChannel(): Promise<Channel> {
    return this.client.channels.resolve(this.channelId);
  }

  /** Fetch and resolve the guild, or null if a DM. */
  async resolveGuild(): Promise<Guild | null> {
    if (!this.guildId) return null;
    return this.client.guilds.resolve(this.guildId);
  }

  /**
   * Construct a message from API data.
   * @param data - API message from REST or MESSAGE_CREATE
   */
  constructor(client: Client, data: APIMessage) {
    super();
    this.client = client;
    this.id = data.id;
    this.channelId = data.channel_id;
    this.guildId = data.guild_id ?? null;
    this.author = client.getOrCreateUser(data.author);
    this.content = data.content;
    this.createdAt = new Date(data.timestamp);
    this.editedAt = data.edited_timestamp ? new Date(data.edited_timestamp) : null;
    this.pinned = data.pinned;
    this.attachments = new Collection();
    for (const a of data.attachments ?? []) this.attachments.set(a.id, a);
    this.type = (data.type ?? MessageType.Default) as MessageType;
    this.flags = data.flags ?? 0;
    this.mentionEveryone = data.mention_everyone ?? false;
    this.tts = data.tts ?? false;
    this.embeds = data.embeds ?? [];
    this.stickers = data.stickers ?? [];
    this.reactions = data.reactions ?? [];
    this.messageReference = data.message_reference ?? null;
    this.messageSnapshots = data.message_snapshots ?? [];
    this.call = data.call ?? null;
    this.referencedMessage = data.referenced_message
      ? new Message(client, data.referenced_message)
      : null;
    this.webhookId = data.webhook_id ?? null;
    this.mentions = (data.mentions ?? []).map((u) => client.getOrCreateUser(u));
    this.mentionRoles = data.mention_roles ?? [];
    this.nonce = data.nonce ?? null;
  }

  /** Send a message in this channel without replying. */
  async send(options: MessagePrepareInput): Promise<Message> {
    return sendMessage(this, options);
  }

  /** Send a message to another channel by ID. */
  async sendTo(channelId: string, options: MessagePrepareInput): Promise<Message> {
    return sendMessageTo(this, channelId, options);
  }

  /**
   * Reply to this message.
   * @example
   * await message.reply('Pong!');
   * await message.reply('No ping!', { ping: false });
   * await message.reply({ content: 'Silent', allowedMentions: AllowedMentions.suppressReplyPing });
   */
  async reply(
    options: string | (MessageSendOptions & ReplyOptions),
    replyOptions?: ReplyOptions,
  ): Promise<Message> {
    return replyToMessage(this, options, replyOptions);
  }

  /** Test helper — prefer {@link reply} / `prepareMessagePostPayload()`. */
  static async _createMessageBody(
    content: string | MessageSendOptions,
    referenced_message?: { channel_id: string; message_id: string; guild_id?: string },
    ping?: boolean,
  ): Promise<PreparedMessagePost> {
    return createMessageBody(content, referenced_message, ping);
  }

  /** Send a prepared payload (internal helper). */
  async _send(payload: PreparedMessagePost): Promise<Message> {
    return sendPrepared(this, payload);
  }

  /** Edit this message (requires author or admin permissions). */
  async edit(options: MessageEditOptions): Promise<Message> {
    const body: {
      content?: string | null;
      embeds?: RESTPostAPIEmbed[];
      allowed_mentions?: APIAllowedMentions;
      flags?: number;
      attachments?: Array<Record<string, unknown>>;
    } = {};
    if (options.content !== undefined) body.content = options.content;
    if (options.embeds?.length) {
      body.embeds = options.embeds.map((e) =>
        e instanceof EmbedBuilder ? e.toJSON() : (e as RESTPostAPIEmbed),
      );
    }
    if (options.allowedMentions) {
      body.allowed_mentions = toAPIAllowedMentions(options.allowedMentions);
    }
    if (options.flags !== undefined) body.flags = options.flags;
    if (options.attachments !== undefined) {
      body.attachments = toMessageAttachmentEditWire(options.attachments);
    }
    const data = await this.client.rest.patch(Routes.channelMessage(this.channelId, this.id), {
      body,
    });
    const updated = new Message(this.client, data as APIMessage);
    this.client._addMessageToCache(this.channelId, data as APIMessage);
    return updated;
  }

  /** Create a {@link ReactionCollector} for this message. */
  createReactionCollector(options?: ReactionCollectorOptions): ReactionCollector {
    return new ReactionCollector(this.client, this.id, this.channelId, options);
  }

  /** Fetch the latest version of this message from the API. */
  async fetch(): Promise<Message> {
    return this.client.channels.fetchMessage(this.channelId, this.id);
  }

  /** Delete this message. */
  async delete(): Promise<void> {
    await this.client.rest.delete(Routes.channelMessage(this.channelId, this.id));
    this.client._removeMessageFromCache(this.channelId, this.id);
  }

  /** Delete a specific attachment from this message. */
  async deleteAttachment(attachmentId: string): Promise<void> {
    await this.client.rest.delete(
      Routes.channelMessageAttachment(this.channelId, this.id, attachmentId),
      { auth: true },
    );
    this.attachments.delete(attachmentId);
  }

  /** Pin this message in the channel. */
  async pin(): Promise<void> {
    await this.client.rest.put(Routes.channelPinMessage(this.channelId, this.id));
    this.pinned = true;
  }

  /** Unpin this message from the channel. */
  async unpin(): Promise<void> {
    await this.client.rest.delete(Routes.channelPinMessage(this.channelId, this.id));
    this.pinned = false;
  }

  /** React to this message with an emoji. */
  async react(emoji: EmojiInput): Promise<void> {
    return reactToMessage(this, emoji);
  }

  /** Remove a reaction (bot's own or a user's if ID is provided). */
  async removeReaction(emoji: EmojiInput, userId?: string): Promise<void> {
    return removeMessageReaction(this, emoji, userId);
  }

  /** Remove all reactions from this message. */
  async removeAllReactions(): Promise<void> {
    return removeAllMessageReactions(this);
  }

  /** Remove all reactions of a specific emoji. */
  async removeReactionEmoji(emoji: EmojiInput): Promise<void> {
    return removeMessageReactionEmoji(this, emoji);
  }

  /** Fetch users who reacted with a specific emoji. */
  async fetchReactionUsers(
    emoji: EmojiInput,
    options?: { limit?: number; after?: string },
  ): Promise<User[]> {
    return fetchMessageReactionUsers(this, emoji, options);
  }

  /** Fetch reaction users with pagination metadata. */
  async fetchReactionUsersPage(
    emoji: EmojiInput,
    options?: { limit?: number; after?: string },
  ): Promise<{ users: User[]; hasMore: boolean; nextAfter: string | null }> {
    return fetchMessageReactionUsersPage(this, emoji, options);
  }
}
