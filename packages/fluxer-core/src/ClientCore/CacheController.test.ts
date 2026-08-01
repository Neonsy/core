import { describe, expect, it } from 'vitest';
import { fixtureGuild, fixtureUser } from '../TestKit/Fixtures.js';
import { Client } from './Client.js';
import { guildHandlers } from './EventHandlers/Guilds.js';

function channelData(id: string, guildId: string) {
  return { id, guild_id: guildId, type: 0 as const, name: id };
}

async function clientWithGuild() {
  const client = new Client({ gatewayDeferHandlers: false, cache: { messages: 10 } });
  await guildHandlers.GUILD_CREATE!(client, {
    ...fixtureGuild({ id: 'g1', name: 'Cache' }),
    channels: [channelData('c1', 'g1'), channelData('c2', 'g1')],
  });
  return client;
}

describe('CacheController', () => {
  it('exposes the resolved limits it was constructed with', () => {
    const client = new Client({ gatewayDeferHandlers: false, cache: { guilds: 5 } });
    expect(client.cache.limits.guilds).toBe(5);
  });

  it('sweepUsers removes matching users and returns the count', () => {
    const client = new Client({ gatewayDeferHandlers: false });
    client.getOrCreateUser(fixtureUser({ id: 'u1' }));
    client.getOrCreateUser(fixtureUser({ id: 'u2' }));

    expect(client.cache.sweepUsers((u) => u.id === 'u1')).toBe(1);
    expect(client.users.has('u1')).toBe(false);
    expect(client.users.has('u2')).toBe(true);
  });

  it('sweepChannels drops from the global index and cascades to messages + guild index', async () => {
    const client = await clientWithGuild();
    client._addMessageToCache('c1', { id: 'm1', channel_id: 'c1' } as never);
    const guild = client.guilds.get('g1')!;

    const removed = client.cache.sweepChannels((c) => c.id === 'c1');

    expect(removed).toBe(1);
    expect(client.channels.has('c1')).toBe(false);
    expect(guild.channels.has('c1')).toBe(false);
    expect(client._getMessageCache('c1')).toBeNull();
    expect(client.channels.has('c2')).toBe(true);
  });

  it('sweepChannels with no filter removes every channel', async () => {
    const client = await clientWithGuild();
    expect(client.cache.sweepChannels()).toBe(2);
    expect(client.channels.size).toBe(0);
  });

  it('sweepGuilds cascades nested channel caches', async () => {
    const client = await clientWithGuild();
    client._addMessageToCache('c1', { id: 'm1', channel_id: 'c1' } as never);

    const removed = client.cache.sweepGuilds((g) => g.id === 'g1');

    expect(removed).toBe(1);
    expect(client.guilds.has('g1')).toBe(false);
    expect(client.channels.has('c1')).toBe(false);
    expect(client._getMessageCache('c1')).toBeNull();
  });

  it('reports cascading=false outside of a teardown', () => {
    const client = new Client({ gatewayDeferHandlers: false });
    expect(client.cache.cascading).toBe(false);
  });

  it('cascadeGuild is a no-op for a guild with no channels collection', () => {
    const client = new Client({ gatewayDeferHandlers: false });
    expect(() => client.cache.cascadeGuild({} as never)).not.toThrow();
    expect(() => client.cache.cascadeGuild(null as never)).not.toThrow();
  });

  it('cascadeChannel from "global" drops the channel from its guild index', async () => {
    const client = await clientWithGuild();
    const guild = client.guilds.get('g1')!;
    const channel = client.channels.get('c1')!;

    client.cache.cascadeChannel(channel, 'global');

    // "global" removal cleans the guild-side index (global side handled by caller).
    expect(guild.channels.has('c1')).toBe(false);
    expect(client._getMessageCache('c1')).toBeNull();
  });

  it('cascadeChannel from "guild" drops the channel from the global index', async () => {
    const client = await clientWithGuild();
    const channel = client.channels.get('c1')!;

    client.cache.cascadeChannel(channel, 'guild');

    expect(client.channels.has('c1')).toBe(false);
  });

  it('cascadeChannel defaults to "both" indexes', async () => {
    const client = await clientWithGuild();
    const guild = client.guilds.get('g1')!;
    const channel = client.channels.get('c1')!;

    client.cache.cascadeChannel(channel);

    expect(client.channels.has('c1')).toBe(false);
    expect(guild.channels.has('c1')).toBe(false);
  });
});
