import { describe, expect, it } from 'vitest';
import { AttachmentBuilder } from './AttachmentBuilder.js';
import { EmbedBuilder, type RESTPostAPIEmbed } from './EmbedBuilder.js';
import { MessagePayload } from './MessagePayload.js';

function rawEmbed(value: unknown): RESTPostAPIEmbed {
  return value as RESTPostAPIEmbed;
}

function rawEmbeds(value: unknown): RESTPostAPIEmbed[] {
  return value as RESTPostAPIEmbed[];
}

describe('MessagePayload', () => {
  it('creates empty payload', () => {
    const p = new MessagePayload();
    expect(p.toJSON()).toEqual({});
  });

  it('setContent sets and clears', () => {
    const p = new MessagePayload();
    p.setContent('hello');
    expect(p.data.content).toBe('hello');
    p.setContent(null);
    expect(p.data.content).toBeUndefined();
  });

  it('leaves configured content limits to the API', () => {
    const content = 'x'.repeat(4001);
    const p = new MessagePayload().setContent(content);
    expect(p.toJSON().content).toBe(content);
  });

  it('setEmbeds accepts EmbedBuilder and raw request embeds', () => {
    const embed = new EmbedBuilder().setTitle('T').setDescription('D');
    const p = new MessagePayload().setEmbeds([embed]);
    expect(p.data.embeds).toHaveLength(1);
    expect(p.data.embeds![0]).toEqual(embed.toJSON());
  });

  it('leaves configured embed count limits to the API', () => {
    const embeds = Array.from({ length: 11 }, () =>
      new EmbedBuilder().setTitle('x').setDescription('y'),
    );
    const p = new MessagePayload().setEmbeds(embeds);
    expect(p.toJSON().embeds).toHaveLength(11);
  });

  it('leaves account-dependent aggregate embed limits to the API', () => {
    const p = new MessagePayload().setEmbeds([new EmbedBuilder().setDescription('a'.repeat(3000))]);

    p.addEmbed(new EmbedBuilder().setDescription('b'.repeat(3001)));
    expect(p.data.embeds).toHaveLength(2);
  });

  it('validates raw embed input', () => {
    const p = new MessagePayload();

    expect(() => p.setEmbeds([{ description: 'x'.repeat(4097) }])).toThrow(
      'Message embed 1 description has 4097 characters. Maximum is 4096.',
    );
    expect(() =>
      p.setEmbeds([
        {
          description: null,
          thumbnail: {
            url: 'https://example.com/thumb.png',
            description: 'x'.repeat(4097),
          },
        },
      ]),
    ).toThrow('Message embed 1 thumbnail description has 4097 characters. Maximum is 4096.');
    expect(p.data.embeds).toBeUndefined();
  });

  it('reports the path for malformed raw embed input', () => {
    const p = new MessagePayload();

    expect(() => p.setEmbeds([rawEmbed(null)])).toThrow('Message embed 1 must be an object.');
    expect(() => p.setEmbeds([rawEmbed({ title: 42 })])).toThrow(
      'Message embed 1 title must be a string.',
    );
    expect(() => p.setEmbeds([rawEmbed({ fields: [{ value: 'value' }] })])).toThrow(
      'Message embed 1 field 1 name must be a string.',
    );
    expect(() => p.setEmbeds([rawEmbed({ fields: { length: 1 } })])).toThrow(
      'Message embed 1 field list must be an array.',
    );
    expect(() =>
      p.setEmbeds([rawEmbed({ image: { description: 42, url: 'https://example.com/image.png' } })]),
    ).toThrow('Message embed 1 image description must be a string.');
    expect(() => p.setEmbeds([rawEmbed({ url: 'ftp://example.com/embed' })])).toThrow(
      'Invalid embed URL',
    );
    expect(() => p.setEmbeds([rawEmbed({ url: 'https://example.com./embed' })])).toThrow(
      'Invalid embed URL: Message embed 1 URL host must not end with a dot',
    );
    expect(() => p.setEmbeds([rawEmbed({ image: { url: 'attachment://file name.png' } })])).toThrow(
      'Invalid embed media URL',
    );
    expect(() => p.setEmbeds([rawEmbed({ author: { name: '  ' } })])).toThrow(
      'Message embed 1 author name has 2 supplied characters (0 after Fluxer normalization). Minimum is 1.',
    );
    expect(p.data.embeds).toBeUndefined();
  });

  it('reports malformed embed lists before using array methods', () => {
    const p = new MessagePayload().setEmbeds([{ description: 'existing' }]);

    expect(() => p.setEmbeds(rawEmbeds({ length: 1 }))).toThrow(
      'Message embed list must be an array.',
    );
    expect(p.data.embeds).toEqual([{ description: 'existing' }]);

    p.data.embeds = rawEmbeds({ length: 1 });
    expect(() => p.addEmbed({ description: 'new' })).toThrow(
      'Message embed list must be an array.',
    );
    expect(() => p.toJSON()).toThrow('Message embed list must be an array.');
    expect(() => MessagePayload.create({ embeds: rawEmbeds({}) })).toThrow(
      'Message embed list must be an array.',
    );
  });

  it('leaves incomplete media objects to Fluxer preprocessing', () => {
    const imageDescription = 'x'.repeat(4097);
    const thumbnailDescription = 'y'.repeat(4097);
    const p = new MessagePayload().setEmbeds([
      rawEmbed({
        description: null,
        image: { description: imageDescription },
        thumbnail: { url: null, description: thumbnailDescription },
      }),
    ]);

    expect(p.toJSON().embeds).toEqual([
      {
        description: null,
        image: { description: imageDescription },
        thumbnail: { url: null, description: thumbnailDescription },
      },
    ]);
  });

  it('addEmbed adds one at a time', () => {
    const p = new MessagePayload();
    p.addEmbed(new EmbedBuilder().setTitle('1').setDescription('a'));
    p.addEmbed(new EmbedBuilder().setTitle('2').setDescription('b'));
    expect(p.data.embeds).toHaveLength(2);
    expect(p.data.embeds![0].title).toBe('1');
    expect(p.data.embeds![1].title).toBe('2');
  });

  it('addEmbed leaves configured embed count limits to the API', () => {
    const p = new MessagePayload().setEmbeds(
      Array.from({ length: 10 }, () => new EmbedBuilder().setDescription('value')),
    );

    p.addEmbed(new EmbedBuilder().setDescription('extra'));
    expect(p.data.embeds).toHaveLength(11);
  });

  it('setAttachments accepts AttachmentBuilder', () => {
    const att = new AttachmentBuilder(0, 'file.png');
    const p = new MessagePayload().setAttachments([att]);
    expect(p.data.attachments).toEqual([{ id: 0, filename: 'file.png' }]);
  });

  it('setAttachments accepts plain objects', () => {
    const p = new MessagePayload().setAttachments([
      { id: 0, filename: 'a.txt', description: 'desc' },
    ]);
    expect(p.data.attachments).toEqual([{ id: 0, filename: 'a.txt', description: 'desc' }]);
  });

  it('setReply accepts camelCase and emits snake_case', () => {
    const p = new MessagePayload().setReply({
      channelId: 'c1',
      messageId: 'm1',
      guildId: 'g1',
    });
    expect(p.toJSON().message_reference).toEqual({
      channel_id: 'c1',
      message_id: 'm1',
      guild_id: 'g1',
    });
  });

  it('setReply accepts snake_case wire input', () => {
    const p = new MessagePayload().setReply({
      channel_id: 'c1',
      message_id: 'm1',
      guild_id: 'g1',
    });
    expect(p.data.message_reference).toEqual({
      channel_id: 'c1',
      message_id: 'm1',
      guild_id: 'g1',
    });
  });

  it('setReply omits guild_id when null', () => {
    const p = new MessagePayload().setReply({
      channelId: 'c1',
      messageId: 'm1',
      guildId: null,
    });
    expect(p.data.message_reference?.guild_id).toBeUndefined();
  });

  it('setTTS and setFlags', () => {
    const p = new MessagePayload().setTTS(true).setFlags(64);
    expect(p.data.tts).toBe(true);
    expect(p.data.flags).toBe(64);
  });

  it('revalidates fixed embed limits before serialization', () => {
    const payload = new MessagePayload();
    payload.data.embeds = [{ description: null, footer: { text: 'x'.repeat(2049) } }];
    expect(() => payload.toJSON()).toThrow(
      'Message embed 1 footer text has 2049 characters. Maximum is 2048.',
    );
  });

  describe('MessagePayload.create', () => {
    it('creates from string', () => {
      const p = MessagePayload.create('Hi');
      expect(p.data.content).toBe('Hi');
    });

    it('creates from options object', () => {
      const p = MessagePayload.create({
        content: 'Test',
        embeds: [new EmbedBuilder().setTitle('E').setDescription('D')],
        tts: true,
      });
      expect(p.data.content).toBe('Test');
      expect(p.data.embeds).toHaveLength(1);
      expect(p.data.tts).toBe(true);
    });

    it('creates empty when no args', () => {
      const p = MessagePayload.create();
      expect(p.toJSON()).toEqual({});
    });
  });
});
