import type { APIMessage } from '@fluxerjs/types';
import { describe, expect, it, vi } from 'vitest';
import type { Client } from '../../ClientCore/Client.js';
import { createMessageStubClient, fixtureMessage, fixtureUser } from '../../TestKit/Fixtures.js';
import { Message } from './Message.js';

function makeMessage(client: Client, overrides: Partial<APIMessage> = {}): Message {
  return new Message(
    client,
    fixtureMessage({
      id: 'm1',
      channel_id: 'c1',
      guild_id: 'g1',
      author: fixtureUser({ id: 'u1', username: 'alice', bot: false }),
      content: 'hi',
      ...overrides,
    }),
  );
}

describe('Message._createMessageBody', () => {
  it('includes message_reference when replying', async () => {
    const ref = { channel_id: 'ch1', message_id: 'msg1', guild_id: 'g1' };
    const payload = await Message._createMessageBody('Pong!', ref);
    expect(payload.body.message_reference).toEqual(ref);
    expect(payload.body.content).toBe('Pong!');
    expect(payload.body).not.toHaveProperty('referenced_message');
  });

  it('includes message_reference with options object', async () => {
    const ref = { channel_id: 'ch1', message_id: 'msg1', guild_id: 'g1' };
    const payload = await Message._createMessageBody({ content: 'Hello', embeds: [] }, ref);
    expect(payload.body.message_reference).toEqual(ref);
    expect(payload.body.content).toBe('Hello');
  });

  it('works without guild_id for DMs', async () => {
    const ref = { channel_id: 'dm1', message_id: 'msg1' };
    const payload = await Message._createMessageBody('DM reply', ref);
    expect(payload.body.message_reference).toEqual(ref);
    expect(payload.body.message_reference).not.toHaveProperty('guild_id');
  });

  it('omits message_reference for standalone send', async () => {
    const payload = await Message._createMessageBody('Standalone');
    expect(payload.body).not.toHaveProperty('message_reference');
    expect(payload.body.content).toBe('Standalone');
  });

  it('throws on empty string', async () => {
    await expect(Message._createMessageBody('')).rejects.toThrow(/Cannot send an empty message/);
  });

  it('includes files in payload when provided', async () => {
    const data = Buffer.from('hello');
    const payload = await Message._createMessageBody({
      content: 'File attached',
      files: [{ name: 'test.txt', data }],
    });
    expect(payload.files).toHaveLength(1);
    expect(payload.files![0]!.name).toBe('test.txt');
    expect(payload.body.content).toBe('File attached');
  });

  it('reply with files includes message_reference', async () => {
    const ref = { channel_id: 'ch1', message_id: 'msg1' };
    const payload = await Message._createMessageBody(
      { content: 'Reply with file', files: [{ name: 'a.txt', data: Buffer.from('x') }] },
      ref,
    );
    expect(payload.body.message_reference).toEqual(ref);
    expect(payload.files).toHaveLength(1);
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
    const client = createMessageStubClient({ defaultReplyPing: true });
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
    const client = createMessageStubClient({ defaultReplyPing: false });
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
    const client = createMessageStubClient({
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
    const client = createMessageStubClient({ defaultReplyPing: true });
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

describe('Message collection fields (Fluxer null / [] / omit)', () => {
  it.each([undefined, null, []] as const)('normalizes embeds=%j to an empty array', (embeds) => {
    const msg = makeMessage(createMessageStubClient(), {
      embeds: embeds as APIMessage['embeds'],
    });
    expect(msg.embeds).toEqual([]);
  });

  it.each([
    undefined,
    null,
    [],
  ] as const)('normalizes attachments=%j to an empty collection', (attachments) => {
    const msg = makeMessage(createMessageStubClient(), {
      attachments: attachments as APIMessage['attachments'],
    });
    expect(msg.attachments.size).toBe(0);
  });

  it.each([
    undefined,
    null,
    [],
  ] as const)('normalizes stickers=%j to an empty array', (stickers) => {
    const msg = makeMessage(createMessageStubClient(), {
      stickers: stickers as APIMessage['stickers'],
    });
    expect(msg.stickers).toEqual([]);
  });

  it.each([
    undefined,
    null,
    [],
  ] as const)('normalizes reactions=%j to an empty array', (reactions) => {
    const msg = makeMessage(createMessageStubClient(), {
      reactions: reactions as APIMessage['reactions'],
    });
    expect(msg.reactions).toEqual([]);
  });

  it.each([
    undefined,
    null,
    [],
  ] as const)('normalizes mentions=%j to an empty array', (mentions) => {
    const msg = makeMessage(createMessageStubClient(), {
      mentions: mentions as unknown as APIMessage['mentions'],
    });
    expect(msg.mentions).toEqual([]);
  });

  it('keeps provided embeds and attachments', () => {
    const embed = { title: 't', type: 'rich' as const };
    const attachment = {
      id: 'a1',
      filename: 'x.png',
      size: 1,
      url: 'https://cdn.example/x.png',
      proxy_url: 'https://cdn.example/x.png',
    };
    const msg = makeMessage(createMessageStubClient(), {
      embeds: [embed],
      attachments: [attachment],
    });
    expect(msg.embeds).toEqual([embed]);
    expect(msg.attachments.get('a1')).toEqual(attachment);
  });
});
