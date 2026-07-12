import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Client } from '../client/Client.js';
import { Channel, TextChannel } from './Channel.js';
import { Message } from './Message.js';
import { Guild } from './Guild.js';
import { Events } from '../util/Events.js';
import { ChannelType } from '@fluxerjs/types';
import type { APIMessage } from '@fluxerjs/types';

function mockClient(overrides: Partial<ConstructorParameters<typeof Client>[0]> = {}): Client {
  return new Client({ gatewayDeferHandlers: false, ...overrides });
}

describe('bulkDelete validation', () => {
  it('no-ops for empty ID list', async () => {
    const client = mockClient();
    const ch = new TextChannel(client, {
      id: 'c1',
      type: ChannelType.GuildText,
      guild_id: 'g1',
      name: 'general',
      parent_id: null,
    });
    await expect(ch.bulkDelete([])).resolves.toEqual([]);
  });

  it('uses single DELETE for one ID', async () => {
    const client = mockClient();
    const del = vi.spyOn(client.rest, 'delete').mockResolvedValue(undefined);
    const ch = new TextChannel(client, {
      id: 'c1',
      type: ChannelType.GuildText,
      guild_id: 'g1',
      name: 'general',
      parent_id: null,
    });
    await expect(ch.bulkDelete(['a'])).resolves.toEqual(['a']);
    expect(del).toHaveBeenCalled();
  });

  it('throws for more than 100 IDs', async () => {
    const client = mockClient();
    const ch = new TextChannel(client, {
      id: 'c1',
      type: ChannelType.GuildText,
      guild_id: 'g1',
      name: 'general',
      parent_id: null,
    });
    const ids = Array.from({ length: 101 }, (_, i) => String(i));
    await expect(ch.bulkDelete(ids)).rejects.toThrow(/at most 100/);
  });

  it('posts when count is in range', async () => {
    const client = mockClient();
    const post = vi.spyOn(client.rest, 'post').mockResolvedValue(undefined);
    const ch = new TextChannel(client, {
      id: 'c1',
      type: ChannelType.GuildText,
      guild_id: 'g1',
      name: 'general',
      parent_id: null,
    });
    await ch.bulkDelete(['a', 'b']);
    expect(post).toHaveBeenCalled();
  });
});

describe('message.reply defaults and two-arg merge', () => {
  function makeMessage(client: Client): Message {
    const data: APIMessage = {
      id: 'm1',
      channel_id: 'c1',
      guild_id: 'g1',
      author: {
        id: 'u1',
        username: 'user',
        discriminator: '0',
        avatar: null,
        bot: false,
      },
      type: 0,
      flags: 0,
      content: 'hi',
      timestamp: new Date().toISOString(),
      edited_timestamp: null,
      pinned: false,
    };
    return new Message(client, data);
  }

  it('applies second-arg ping:false over defaults', async () => {
    const client = mockClient({ defaultReplyPing: true });
    const msg = makeMessage(client);
    const post = vi.spyOn(client.rest, 'post').mockResolvedValue({
      ...msg,
      id: 'm2',
      content: 'pong',
    } as unknown as APIMessage);
    await msg.reply('pong', { ping: false });
    const payload = post.mock.calls[0]![1] as {
      body: { flags?: number; allowed_mentions?: unknown };
    };
    expect(payload.body.flags).toBeUndefined();
    expect(payload.body.allowed_mentions).toEqual({ replied_user: false });
  });

  it('uses defaultReplyPing false when no ping provided', async () => {
    const client = mockClient({ defaultReplyPing: false });
    const msg = makeMessage(client);
    const post = vi.spyOn(client.rest, 'post').mockResolvedValue({
      id: 'm2',
      channel_id: 'c1',
      author: { id: 'bot', username: 'b', discriminator: '0', bot: true },
      type: 19,
      flags: 0,
      content: 'pong',
      timestamp: new Date().toISOString(),
      edited_timestamp: null,
      pinned: false,
    } as APIMessage);
    await msg.reply('pong');
    const payload = post.mock.calls[0]![1] as {
      body: { flags?: number; allowed_mentions?: unknown };
    };
    expect(payload.body.flags).toBeUndefined();
    expect(payload.body.allowed_mentions).toEqual({ replied_user: false });
  });

  it('applies defaultAllowedMentions when call omits allowedMentions', async () => {
    const client = mockClient({
      defaultAllowedMentions: { parse: [], repliedUser: false },
    });
    const msg = makeMessage(client);
    const post = vi.spyOn(client.rest, 'post').mockResolvedValue({
      id: 'm2',
      channel_id: 'c1',
      author: { id: 'bot', username: 'b', discriminator: '0', bot: true },
      type: 19,
      flags: 0,
      content: 'pong',
      timestamp: new Date().toISOString(),
      edited_timestamp: null,
      pinned: false,
    } as APIMessage);
    await msg.reply('pong');
    const payload = post.mock.calls[0]![1] as { body: { allowed_mentions?: unknown } };
    expect(payload.body.allowed_mentions).toEqual({ parse: [], replied_user: false });
  });
});

describe('GUILD_UPDATE preserves nested caches', () => {
  it('patches in place and keeps members/channels', async () => {
    const client = mockClient();
    const guild = new Guild(client, {
      id: 'g1',
      name: 'Old',
      icon: null,
      banner: null,
      owner_id: 'owner1',
      features: [],
      afk_timeout: 0,
      nsfw_level: 0,
      verification_level: 0,
      mfa_level: 0,
      explicit_content_filter: 0,
      default_message_notifications: 0,
    });
    client.guilds.set(guild.id, guild);
    const ch = new TextChannel(client, {
      id: 'c1',
      type: ChannelType.GuildText,
      guild_id: 'g1',
      name: 'general',
      parent_id: null,
    });
    guild.channels.set(ch.id, ch);
    client.channels.set(ch.id, ch);

    const emit = vi.spyOn(client, 'emit');
    await (client as unknown as { handleDispatch: (p: unknown) => Promise<void> }).handleDispatch({
      op: 0,
      t: 'GUILD_UPDATE',
      d: {
        id: 'g1',
        name: 'New Name',
        icon: null,
        owner_id: 'owner1',
        features: [],
        afk_timeout: 0,
        nsfw_level: 0,
        verification_level: 0,
        mfa_level: 0,
        explicit_content_filter: 0,
        default_message_notifications: 0,
      },
    });

    expect(client.guilds.get('g1')).toBe(guild);
    expect(guild.name).toBe('New Name');
    expect(guild.channels.get('c1')).toBe(ch);
    expect(emit.mock.calls.some((c) => c[0] === Events.GuildUpdate)).toBe(true);
  });
});

describe('Channel type guard smoke', () => {
  it('Channel.fromOrCreate returns DM for DM type', () => {
    const client = mockClient();
    const ch = Channel.fromOrCreate(client, {
      id: 'dm1',
      type: ChannelType.DM,
      recipients: [],
    });
    expect(ch?.isDM()).toBe(true);
  });

  it('Channel.fromOrCreate maps DMPersonalNotes (999)', () => {
    const client = mockClient();
    const ch = Channel.fromOrCreate(client, {
      id: 'notes1',
      type: ChannelType.DMPersonalNotes,
      recipients: [],
    });
    expect(ch?.isDM()).toBe(true);
    expect(ch?.isPersonalNotes()).toBe(true);
    expect(ch?.isTextBased()).toBe(true);
  });
});
