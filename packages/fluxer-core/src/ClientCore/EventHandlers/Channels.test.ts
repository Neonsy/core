import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Channel } from '../../Domain/Channel/index.js';
import { Guild } from '../../Domain/Guild/Guild.js';
import { Events } from '../../Helpers/Events.js';
import {
  dispatchForTest,
  fixtureGuild,
  fixtureTextChannel,
  fixtureUser,
} from '../../TestKit/Fixtures.js';
import { Client } from '../Client.js';
import type { ChannelPinsUpdatePayload, ChannelRecipientPayload } from '../EventPayloads.js';

describe('channelHandlers', () => {
  let client: Client;

  beforeEach(() => {
    client = new Client({ gatewayDeferHandlers: false });
  });

  it('CHANNEL_CREATE caches and emits Channel', async () => {
    const guild = new Guild(client, fixtureGuild({ id: 'g1' }));
    client.guilds.set(guild.id, guild);
    const emit = vi.spyOn(client, 'emit');

    await dispatchForTest(
      client,
      'CHANNEL_CREATE',
      fixtureTextChannel({ id: 'c1', guild_id: 'g1' }),
    );

    const ch = client.channels.get('c1');
    expect(ch).toBeInstanceOf(Channel);
    expect(emit.mock.calls.find((c) => c[0] === Events.ChannelCreate)?.[1]).toBe(ch);
  });

  it('CHANNEL_PINS_UPDATE emits camelCase payload and patches lastPinTimestamp', async () => {
    const ch = Channel.from(client, fixtureTextChannel({ id: 'c1', guild_id: 'g1' }))!;
    client.channels.set(ch.id, ch);
    const emit = vi.spyOn(client, 'emit');

    await dispatchForTest(client, 'CHANNEL_PINS_UPDATE', {
      channel_id: 'c1',
      guild_id: 'g1',
      last_pin_timestamp: '2024-06-01T00:00:00.000Z',
    });

    expect(ch.lastPinTimestamp).toBe('2024-06-01T00:00:00.000Z');
    const payload = emit.mock.calls.find((c) => c[0] === Events.ChannelPinsUpdate)?.[1] as
      | ChannelPinsUpdatePayload
      | undefined;
    expect(payload).toEqual({
      channelId: 'c1',
      guildId: 'g1',
      lastPinTimestamp: '2024-06-01T00:00:00.000Z',
    });
  });

  it('CHANNEL_RECIPIENT_ADD / REMOVE emit ChannelRecipientPayload', async () => {
    const emit = vi.spyOn(client, 'emit');
    const user = fixtureUser({ id: 'u1', username: 'bob' });

    await dispatchForTest(client, 'CHANNEL_RECIPIENT_ADD', { channel_id: 'dm1', user });
    await dispatchForTest(client, 'CHANNEL_RECIPIENT_REMOVE', { channel_id: 'dm1', user });

    const add = emit.mock.calls.find((c) => c[0] === Events.ChannelRecipientAdd)?.[1] as
      | ChannelRecipientPayload
      | undefined;
    const remove = emit.mock.calls.find((c) => c[0] === Events.ChannelRecipientRemove)?.[1] as
      | ChannelRecipientPayload
      | undefined;
    expect(add).toMatchObject({ channelId: 'dm1', user: { id: 'u1', username: 'bob' } });
    expect(remove).toMatchObject({ channelId: 'dm1', user: { id: 'u1' } });
  });

  it('CHANNEL_DELETE removes from cache and emits', async () => {
    const ch = Channel.from(client, fixtureTextChannel({ id: 'c1', guild_id: 'g1' }))!;
    client.channels.set(ch.id, ch);
    const emit = vi.spyOn(client, 'emit');

    await dispatchForTest(client, 'CHANNEL_DELETE', { id: 'c1', guild_id: 'g1' });

    expect(client.channels.get('c1')).toBeUndefined();
    expect(emit.mock.calls.find((c) => c[0] === Events.ChannelDelete)?.[1]).toBe(ch);
  });
});
