import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Events } from '../../Helpers/Events.js';
import { dispatchForTest, fixtureUser } from '../../TestKit/Fixtures.js';
import { Client } from '../Client.js';
import type {
  ChannelMemberCountsUpdatePayload,
  PresenceUpdateBulkPayload,
  PresenceUpdatePayload,
  TypingStartPayload,
  WebhooksUpdatePayload,
} from '../EventPayloads.js';

describe('passthroughHandlers', () => {
  let client: Client;

  beforeEach(() => {
    client = new Client({ gatewayDeferHandlers: false });
  });

  it('TYPING_START emits camelCase payload', async () => {
    const emit = vi.spyOn(client, 'emit');
    await dispatchForTest(client, 'TYPING_START', {
      channel_id: 'c1',
      guild_id: 'g1',
      user_id: 'u1',
      timestamp: 1700000000,
    });

    const payload = emit.mock.calls.find((c) => c[0] === Events.TypingStart)?.[1] as
      | TypingStartPayload
      | undefined;
    expect(payload).toEqual({
      channelId: 'c1',
      guildId: 'g1',
      userId: 'u1',
      timestamp: 1700000000,
    });
  });

  it('PRESENCE_UPDATE maps custom_status emoji fields', async () => {
    const emit = vi.spyOn(client, 'emit');
    await dispatchForTest(client, 'PRESENCE_UPDATE', {
      user: { id: 'u1' },
      guild_id: 'g1',
      status: 'online',
      activities: [{ name: 'Fluxer', type: 0 }],
      custom_status: { text: 'hi', emoji_id: 'e1', emoji_name: 'wave' },
    });

    const payload = emit.mock.calls.find((c) => c[0] === Events.PresenceUpdate)?.[1] as
      | PresenceUpdatePayload
      | undefined;
    expect(payload).toEqual({
      userId: 'u1',
      guildId: 'g1',
      status: 'online',
      activities: [{ name: 'Fluxer', type: 0, url: undefined }],
      customStatus: { text: 'hi', emojiId: 'e1', emojiName: 'wave' },
    });
  });

  it('PRESENCE_UPDATE_BULK maps nested presences', async () => {
    const emit = vi.spyOn(client, 'emit');
    await dispatchForTest(client, 'PRESENCE_UPDATE_BULK', {
      guild_id: 'g1',
      presences: [{ user: { id: 'u1' }, status: 'idle', activities: [] }],
    });

    const payload = emit.mock.calls.find((c) => c[0] === Events.PresenceUpdateBulk)?.[1] as
      | PresenceUpdateBulkPayload
      | undefined;
    expect(payload?.guildId).toBe('g1');
    expect(payload?.presences[0]).toMatchObject({ userId: 'u1', status: 'idle' });
  });

  it('WEBHOOKS_UPDATE and CHANNEL_MEMBER_COUNTS_UPDATE emit camelCase', async () => {
    const emit = vi.spyOn(client, 'emit');
    await dispatchForTest(client, 'WEBHOOKS_UPDATE', { channel_id: 'c1', guild_id: 'g1' });
    await dispatchForTest(client, 'CHANNEL_MEMBER_COUNTS_UPDATE', {
      counts: [{ guild_id: 'g1', channel_id: 'c1', member_count: 10, online_count: 3 }],
    });

    const webhooks = emit.mock.calls.find((c) => c[0] === Events.WebhooksUpdate)?.[1] as
      | WebhooksUpdatePayload
      | undefined;
    const counts = emit.mock.calls.find((c) => c[0] === Events.ChannelMemberCountsUpdate)?.[1] as
      | ChannelMemberCountsUpdatePayload
      | undefined;
    expect(webhooks).toEqual({ channelId: 'c1', guildId: 'g1' });
    expect(counts).toEqual({
      counts: [{ guildId: 'g1', channelId: 'c1', memberCount: 10, onlineCount: 3 }],
    });
  });

  it('USER_UPDATE emits User and patches client.user when matching', async () => {
    const self = fixtureUser({ id: 'bot1', username: 'bot' });
    client.user = client.getOrCreateUser(self) as typeof client.user;
    const emit = vi.spyOn(client, 'emit');

    await dispatchForTest(client, 'USER_UPDATE', { ...self, username: 'bot2' });

    expect(emit.mock.calls.find((c) => c[0] === Events.UserUpdate)?.[1]).toMatchObject({
      id: 'bot1',
      username: 'bot2',
    });
    expect(client.user?.username).toBe('bot2');
  });
});
