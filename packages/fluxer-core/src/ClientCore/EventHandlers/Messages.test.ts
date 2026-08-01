import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Invite } from '../../Domain/Invite.js';
import { Message } from '../../Domain/Message/index.js';
import { Events } from '../../Helpers/Events.js';
import { dispatchForTest, fixtureMessage } from '../../TestKit/Fixtures.js';
import { Client } from '../Client.js';
import type {
  InviteDeletePayload,
  MessageDeleteBulkPayload,
  MessageReactionPayload,
} from '../EventPayloads.js';

describe('messageHandlers', () => {
  let client: Client;

  beforeEach(() => {
    client = new Client({ gatewayDeferHandlers: false });
  });

  it('MESSAGE_CREATE caches and emits Message', async () => {
    const emit = vi.spyOn(client, 'emit');
    const data = fixtureMessage({ id: 'm1', channel_id: 'c1', content: 'hi' });

    await dispatchForTest(client, 'MESSAGE_CREATE', data);

    const msg = emit.mock.calls.find((c) => c[0] === Events.MessageCreate)?.[1] as Message;
    expect(msg).toBeInstanceOf(Message);
    expect(msg.content).toBe('hi');
    expect(client._getMessageCache('c1')?.get('m1')).toBeTruthy();
  });

  it('MESSAGE_UPDATE emits old vs new when cached', async () => {
    const original = fixtureMessage({ id: 'm1', channel_id: 'c1', content: 'old' });
    client._addMessageToCache('c1', original);
    const emit = vi.spyOn(client, 'emit');

    await dispatchForTest(client, 'MESSAGE_UPDATE', {
      id: 'm1',
      channel_id: 'c1',
      content: 'new',
    });

    const call = emit.mock.calls.find((c) => c[0] === Events.MessageUpdate);
    expect(call).toBeDefined();
    expect(call![1]).toBeInstanceOf(Message);
    expect((call![1] as Message).content).toBe('old');
    expect((call![2] as Message).content).toBe('new');
  });

  it('MESSAGE_DELETE emits PartialMessage-shaped payload', async () => {
    const emit = vi.spyOn(client, 'emit');
    await dispatchForTest(client, 'MESSAGE_DELETE', {
      id: 'm1',
      channel_id: 'c1',
      guild_id: 'g1',
      content: 'bye',
      author_id: 'u1',
    });

    expect(emit.mock.calls.find((c) => c[0] === Events.MessageDelete)?.[1]).toEqual({
      id: 'm1',
      channelId: 'c1',
      channel: null,
      content: 'bye',
      authorId: 'u1',
    });
  });

  it('MESSAGE_DELETE_BULK emits camelCase ids payload', async () => {
    const emit = vi.spyOn(client, 'emit');
    await dispatchForTest(client, 'MESSAGE_DELETE_BULK', {
      ids: ['m1', 'm2'],
      channel_id: 'c1',
      guild_id: null,
    });

    const payload = emit.mock.calls.find((c) => c[0] === Events.MessageDeleteBulk)?.[1] as
      | MessageDeleteBulkPayload
      | undefined;
    expect(payload).toEqual({ ids: ['m1', 'm2'], channelId: 'c1', guildId: null });
  });

  it('MESSAGE_REACTION_ADD emits MessageReactionPayload', async () => {
    const emit = vi.spyOn(client, 'emit');
    await dispatchForTest(client, 'MESSAGE_REACTION_ADD', {
      user_id: 'u1',
      channel_id: 'c1',
      message_id: 'm1',
      emoji: { name: '👍', id: null },
    });

    const payload = emit.mock.calls.find((c) => c[0] === Events.MessageReactionAdd)?.[1] as
      | MessageReactionPayload
      | undefined;
    expect(payload).toMatchObject({
      messageId: 'm1',
      channelId: 'c1',
      userId: 'u1',
      emoji: { name: '👍' },
    });
    expect(payload?.user.id).toBe('u1');
  });
});

describe('inviteHandlers', () => {
  let client: Client;

  beforeEach(() => {
    client = new Client({ gatewayDeferHandlers: false });
  });

  it('INVITE_CREATE emits Invite structure', async () => {
    const emit = vi.spyOn(client, 'emit');
    await dispatchForTest(client, 'INVITE_CREATE', {
      code: 'abc123',
      guild_id: 'g1',
      channel_id: 'c1',
      guild: { id: 'g1', name: 'G', icon: null },
      channel: { id: 'c1', type: 0, name: 'general' },
    });

    const invite = emit.mock.calls.find((c) => c[0] === Events.InviteCreate)?.[1] as Invite;
    expect(invite).toBeInstanceOf(Invite);
    expect(invite.code).toBe('abc123');
  });

  it('INVITE_DELETE emits InviteDeletePayload', async () => {
    const emit = vi.spyOn(client, 'emit');
    await dispatchForTest(client, 'INVITE_DELETE', {
      code: 'abc123',
      guild_id: 'g1',
      channel_id: 'c1',
    });

    const payload = emit.mock.calls.find((c) => c[0] === Events.InviteDelete)?.[1] as
      | InviteDeletePayload
      | undefined;
    expect(payload).toEqual({ code: 'abc123', guildId: 'g1', channelId: 'c1' });
  });
});
