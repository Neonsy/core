/**
 * Compile-time guard: every ClientEvents camelCase DTO must be importable from the
 * package public surface (`src/index.ts`). Partial exports (e.g. delete but not update)
 * previously left consumers unable to annotate handlers.
 */
import { describe, it } from 'vitest';
import type { Events } from '../Helpers/Events.js';
import type {
  AuditLogChange,
  AuditLogEntryPayload,
  ChannelMemberCountsUpdatePayload,
  ChannelPinsUpdatePayload,
  ChannelRecipientPayload,
  ClientEventListener,
  ClientEventName,
  ClientEvents,
  GuildCountsUpdatePayload,
  GuildEmojisUpdatePayload,
  GuildMembersChunkPayload,
  GuildRoleDeletePayload,
  GuildRoleUpdatePayload,
  GuildStickersUpdatePayload,
  InviteDeletePayload,
  MessageDeleteBulkPayload,
  MessageReactionAddManyEntry,
  MessageReactionAddManyPayload,
  MessageReactionPayload,
  MessageReactionRemoveAllPayload,
  MessageReactionRemoveEmojiPayload,
  PresenceActivity,
  PresenceUpdateBulkPayload,
  PresenceUpdatePayload,
  ReactionEmojiPayload,
  TypingStartPayload,
  WebhooksUpdatePayload,
} from '../index.js';

type Assert<T extends true> = T;
type IsExactly<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

describe('public ClientEvents payload exports (compile-time)', () => {
  it('exposes every camelCase DTO used by ClientEvents', () => {
    type _messageDeleteBulk = Assert<
      IsExactly<ClientEvents[typeof Events.MessageDeleteBulk][0], MessageDeleteBulkPayload>
    >;
    type _reaction = Assert<
      IsExactly<ClientEvents[typeof Events.MessageReactionAdd][0], MessageReactionPayload>
    >;
    type _reactionMany = Assert<
      IsExactly<
        ClientEvents[typeof Events.MessageReactionAddMany][0],
        MessageReactionAddManyPayload
      >
    >;
    type _reactionRemoveAll = Assert<
      IsExactly<
        ClientEvents[typeof Events.MessageReactionRemoveAll][0],
        MessageReactionRemoveAllPayload
      >
    >;
    type _reactionRemoveEmoji = Assert<
      IsExactly<
        ClientEvents[typeof Events.MessageReactionRemoveEmoji][0],
        MessageReactionRemoveEmojiPayload
      >
    >;
    type _chunk = Assert<
      IsExactly<ClientEvents[typeof Events.GuildMembersChunk][0], GuildMembersChunkPayload>
    >;
    type _counts = Assert<
      IsExactly<ClientEvents[typeof Events.GuildCountsUpdate][0], GuildCountsUpdatePayload>
    >;
    type _channelCounts = Assert<
      IsExactly<
        ClientEvents[typeof Events.ChannelMemberCountsUpdate][0],
        ChannelMemberCountsUpdatePayload
      >
    >;
    type _audit = Assert<
      IsExactly<ClientEvents[typeof Events.GuildAuditLogEntryCreate][0], AuditLogEntryPayload>
    >;
    type _emojis = Assert<
      IsExactly<ClientEvents[typeof Events.GuildEmojisUpdate][0], GuildEmojisUpdatePayload>
    >;
    type _stickers = Assert<
      IsExactly<ClientEvents[typeof Events.GuildStickersUpdate][0], GuildStickersUpdatePayload>
    >;
    type _roleUpdate = Assert<
      IsExactly<ClientEvents[typeof Events.GuildRoleUpdate][0], GuildRoleUpdatePayload>
    >;
    type _roleDelete = Assert<
      IsExactly<ClientEvents[typeof Events.GuildRoleDelete][0], GuildRoleDeletePayload>
    >;
    type _pins = Assert<
      IsExactly<ClientEvents[typeof Events.ChannelPinsUpdate][0], ChannelPinsUpdatePayload>
    >;
    type _recipient = Assert<
      IsExactly<ClientEvents[typeof Events.ChannelRecipientAdd][0], ChannelRecipientPayload>
    >;
    type _inviteDelete = Assert<
      IsExactly<ClientEvents[typeof Events.InviteDelete][0], InviteDeletePayload>
    >;
    type _typing = Assert<
      IsExactly<ClientEvents[typeof Events.TypingStart][0], TypingStartPayload>
    >;
    type _presence = Assert<
      IsExactly<ClientEvents[typeof Events.PresenceUpdate][0], PresenceUpdatePayload>
    >;
    type _presenceBulk = Assert<
      IsExactly<ClientEvents[typeof Events.PresenceUpdateBulk][0], PresenceUpdateBulkPayload>
    >;
    type _webhooks = Assert<
      IsExactly<ClientEvents[typeof Events.WebhooksUpdate][0], WebhooksUpdatePayload>
    >;

    // Nested / helper DTOs used when annotating payload fields
    const _entry: MessageReactionAddManyEntry = {
      userId: '1',
      emoji: { name: '👍' } satisfies ReactionEmojiPayload,
      member: null,
    };
    const _activity: PresenceActivity = { name: 'Fluxer', type: 0 };
    const _change: AuditLogChange = { key: 'name', oldValue: 'a', newValue: 'b' };
    void _entry;
    void _activity;
    void _change;

    type _name = Assert<IsExactly<ClientEventName, keyof ClientEvents>>;
    type _listener = ClientEventListener<typeof Events.GuildRoleUpdate>;
    const _fn: _listener = (_payload) => {};
    void _fn;
  });
});
