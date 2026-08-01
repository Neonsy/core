import type { APIUserPartial } from '@fluxerjs/types';
import { Routes } from '@fluxerjs/types';
import { parseEmoji } from '@fluxerjs/util';
import type {
  MessageReactionPayload,
  ReactionEmojiPayload,
} from '../../ClientCore/EventPayloads.js';
import { Events } from '../../Helpers/Events.js';
import type { User } from '../User.js';
import type { Message } from './Message.js';
import { MessageReaction } from './MessageReaction.js';

type EmojiInput = string | { name: string; id?: string; animated?: boolean };

type ReactionUsersPage = {
  users: User[];
  hasMore: boolean;
  nextAfter: string | null;
};

/** Internal helper to encode emoji for API routes. */
async function emojiPath(message: Message, emoji: EmojiInput): Promise<string> {
  return message.client.resolveEmoji(emoji, message.guildId);
}

/**
 * Normalize emoji input / resolved wire (`name:id`, `a:name:id`, unicode, mention)
 * into a structured reaction emoji payload.
 */
function toReactionEmoji(emoji: EmojiInput | string): ReactionEmojiPayload {
  if (typeof emoji !== 'string') {
    return {
      name: emoji.name,
      ...(emoji.id !== undefined ? { id: emoji.id } : {}),
      ...(emoji.animated !== undefined ? { animated: emoji.animated } : {}),
    };
  }

  const animatedWire = /^a:(\w+):(\d+)$/.exec(emoji);
  if (animatedWire) {
    return { name: animatedWire[1]!, id: animatedWire[2]!, animated: true };
  }

  const parsed = parseEmoji(emoji);
  if (parsed?.id) {
    return {
      name: parsed.name,
      id: parsed.id,
      ...(parsed.animated ? { animated: true } : {}),
    };
  }

  let name = emoji;
  try {
    name = decodeURIComponent(emoji);
  } catch {
    /* keep raw */
  }
  return { name: parsed?.name ?? name };
}

/**
 * Emit a local {@link Events.MessageReactionAdd} after REST succeeds.
 * Gateways often omit the bot's own reactions; collectors still need the event.
 * {@link ReactionCollector} dedupes if the gateway later echoes the same reaction.
 */
function emitOwnReactionAdd(message: Message, wireOrInput: string | EmojiInput): void {
  const user = message.client.user;
  if (!user) return;
  const emojiPayload = toReactionEmoji(wireOrInput);
  const reaction = new MessageReaction(message.client, {
    user_id: user.id,
    channel_id: message.channelId,
    message_id: message.id,
    guild_id: message.guildId ?? undefined,
    emoji: {
      name: emojiPayload.name,
      ...(emojiPayload.id !== undefined ? { id: emojiPayload.id } : {}),
      ...(emojiPayload.animated !== undefined ? { animated: emojiPayload.animated } : {}),
    },
  });
  const payload: MessageReactionPayload = {
    reaction,
    user,
    messageId: message.id,
    channelId: message.channelId,
    emoji: emojiPayload,
    userId: user.id,
  };
  message.client.emit(Events.MessageReactionAdd, payload);
}

/** Add a reaction to a message (as the bot). */
export async function reactToMessage(message: Message, emoji: EmojiInput): Promise<void> {
  const wire = await emojiPath(message, emoji);
  await message.client.rest.put(
    Routes.channelMessageReactionMe(message.channelId, message.id, wire),
  );
  // Prefer resolved wire so collectors see name/id/animated correctly.
  emitOwnReactionAdd(message, wire);
}

/** Remove a reaction (bot's own or a user's if `userId` is set). */
export async function removeMessageReaction(
  message: Message,
  emoji: EmojiInput,
  userId?: string,
): Promise<void> {
  const e = await emojiPath(message, emoji);
  const route = userId
    ? Routes.channelMessageReactionUser(message.channelId, message.id, e, userId)
    : Routes.channelMessageReactionMe(message.channelId, message.id, e);
  await message.client.rest.delete(route);
}

/** Remove all reactions from a message. */
export async function removeAllMessageReactions(message: Message): Promise<void> {
  await message.client.rest.delete(Routes.channelMessageReactions(message.channelId, message.id));
}

/** Remove all reactions of one emoji from a message. */
export async function removeMessageReactionEmoji(
  message: Message,
  emoji: EmojiInput,
): Promise<void> {
  const e = await emojiPath(message, emoji);
  await message.client.rest.delete(Routes.channelMessageReaction(message.channelId, message.id, e));
}

/** Fetch users who reacted with the given emoji. */
export async function fetchMessageReactionUsers(
  message: Message,
  emoji: EmojiInput,
  options?: { limit?: number; after?: string },
): Promise<User[]> {
  return (await fetchMessageReactionUsersPage(message, emoji, options)).users;
}

/** Fetch reaction users with pagination metadata (OpenAPI ReactionUsersPageResponse). */
export async function fetchMessageReactionUsersPage(
  message: Message,
  emoji: EmojiInput,
  options?: { limit?: number; after?: string },
): Promise<ReactionUsersPage> {
  const e = await emojiPath(message, emoji);
  const params = new URLSearchParams();
  if (options?.limit != null) params.set('limit', String(options.limit));
  if (options?.after) params.set('after', options.after);
  const qs = params.toString();
  const route =
    Routes.channelMessageReactionUsers(message.channelId, message.id, e) + (qs ? `?${qs}` : '');

  const data = await message.client.rest.get<
    | {
        items?: APIUserPartial[];
        users?: APIUserPartial[];
        has_more?: boolean;
        next_after?: string | null;
      }
    | APIUserPartial[]
  >(route);

  if (Array.isArray(data)) {
    return {
      users: data.map((u) => message.client.getOrCreateUser(u)),
      hasMore: false,
      nextAfter: null,
    };
  }

  const list = data.items ?? data.users ?? [];
  return {
    users: list.map((u) => message.client.getOrCreateUser(u)),
    hasMore: data.has_more ?? false,
    nextAfter: data.next_after ?? null,
  };
}
