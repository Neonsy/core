import { describe, it, expect, vi } from 'vitest';
import type { APIMessage } from '@fluxerjs/types';
import { Message } from './Message.js';
import type { Client } from '../../client/Client.js';

function mockClient(overrides: Record<string, unknown> = {}): Client {
  return {
    options: {
      defaultReplyPing: true,
      ...overrides,
    },
    rest: {
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      put: vi.fn(),
      get: vi.fn(),
    },
    channels: { get: () => null, send: vi.fn() },
    guilds: { get: () => null },
    getOrCreateUser: (u: { id: string; username?: string }) => ({
      id: u.id,
      username: u.username ?? 'u',
    }),
    _addMessageToCache: vi.fn(),
  } as unknown as Client;
}

function makeMessage(client: Client, overrides: Partial<APIMessage> = {}): Message {
  const data: APIMessage = {
    id: 'm1',
    channel_id: 'c1',
    guild_id: 'g1',
    author: { id: 'u1', username: 'alice', discriminator: '0', bot: false },
    type: 0,
    flags: 0,
    content: 'hi',
    timestamp: new Date().toISOString(),
    edited_timestamp: null,
    pinned: false,
    ...overrides,
  };
  return new Message(client, data);
}

describe('Message._createMessageBody', () => {
  it('includes message_reference when replying', async () => {
    const ref = { channel_id: 'ch1', message_id: 'msg1', guild_id: 'g1' };
    const payload = await Message._createMessageBody('Pong!', ref);
    expect(payload.body.message_reference).toEqual(ref);
    expect(payload.body.content).toBe('Pong!');
    expect(payload.body).not.toHaveProperty('referenced_message');
  });

  it('omits message_reference for standalone send', async () => {
    const payload = await Message._createMessageBody('Standalone');
    expect(payload.body).not.toHaveProperty('message_reference');
    expect(payload.body.content).toBe('Standalone');
  });

  it('throws on empty string', async () => {
    await expect(Message._createMessageBody('')).rejects.toThrow(/Cannot send an empty message/);
  });

  it('ping: false sets allowed_mentions.replied_user false', async () => {
    const ref = { channel_id: 'ch1', message_id: 'msg1' };
    const payload = await Message._createMessageBody('No ping', ref, false);
    expect(payload.body.message_reference).toEqual(ref);
    expect(payload.body.flags).toBeUndefined();
    expect(payload.body.allowed_mentions).toEqual({ replied_user: false });
  });

  it('ping: true does not suppress', async () => {
    const ref = { channel_id: 'ch1', message_id: 'msg1' };
    const payload = await Message._createMessageBody('Ping!', ref, true);
    expect(payload.body.allowed_mentions?.replied_user).not.toBe(false);
  });
});

describe('Message.reply', () => {
  it('two-arg ping:false suppresses replied_user', async () => {
    const client = mockClient({ defaultReplyPing: true });
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

    await msg.reply('pong', { ping: false });

    const payload = post.mock.calls[0]![1] as {
      body: { flags?: number; allowed_mentions?: unknown; message_reference?: unknown };
    };
    expect(payload.body.flags).toBeUndefined();
    expect(payload.body.allowed_mentions).toEqual({ replied_user: false });
    expect(payload.body.message_reference).toEqual({
      channel_id: 'c1',
      message_id: 'm1',
      guild_id: 'g1',
    });
  });

  it('uses defaultReplyPing false when ping omitted', async () => {
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

    const payload = post.mock.calls[0]![1] as { body: { allowed_mentions?: unknown } };
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

  it('second-arg ping wins over first-arg ping', async () => {
    const client = mockClient({ defaultReplyPing: true });
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

    await msg.reply({ content: 'pong', ping: true }, { ping: false });

    const payload = post.mock.calls[0]![1] as { body: { allowed_mentions?: unknown } };
    expect(payload.body.allowed_mentions).toEqual({ replied_user: false });
  });
});
