import { describe, expect, it } from 'vitest';
import { EmbedBuilder } from './EmbedBuilder.js';

const WIRE_KEYS = new Set([
  'title',
  'description',
  'url',
  'color',
  'timestamp',
  'author',
  'footer',
  'image',
  'thumbnail',
  'fields',
]);

function assertWire(json: object): void {
  for (const key of Object.keys(json)) {
    expect(WIRE_KEYS.has(key)).toBe(true);
  }
  expect(json).not.toHaveProperty('video');
  expect(json).not.toHaveProperty('audio');
  expect(json).not.toHaveProperty('type');
  expect(json).not.toHaveProperty('provider');
  expect(json).not.toHaveProperty('children');
}

describe('EmbedBuilder', () => {
  describe('toJSON wire shape', () => {
    it('emits request keys only (no video/audio/type)', () => {
      const json = new EmbedBuilder()
        .setTitle('Title')
        .setDescription('Description')
        .setImage('https://example.com/img.png')
        .setThumbnail('https://example.com/thumb.png')
        .toJSON();

      assertWire(json);
      expect('video' in json).toBe(false);
      expect('audio' in json).toBe(false);
    });

    it('strips polluted non-request keys from data', () => {
      const embed = new EmbedBuilder().setTitle('T');
      Object.assign(embed.data, {
        video: { url: 'https://example.com/v.mp4' },
        audio: { url: 'https://example.com/a.mp3' },
        type: 'rich',
      });
      assertWire(embed.toJSON());
    });
  });

  describe('setImage and setThumbnail', () => {
    it('accept string URL', () => {
      const json = new EmbedBuilder()
        .setImage('https://example.com/img.png')
        .setThumbnail('https://example.com/thumb.png')
        .toJSON();

      expect(json.image).toEqual({ url: 'https://example.com/img.png' });
      expect(json.thumbnail).toEqual({ url: 'https://example.com/thumb.png' });
    });

    it('accept EmbedMediaOptions with description', () => {
      const json = new EmbedBuilder()
        .setImage({ url: 'https://example.com/img.png', description: 'alt' })
        .setThumbnail({ url: 'https://example.com/thumb.png' })
        .toJSON();

      expect(json.image).toEqual({ url: 'https://example.com/img.png', description: 'alt' });
      expect(json.thumbnail).toEqual({ url: 'https://example.com/thumb.png' });
    });
  });

  describe('validation', () => {
    it('setTitle throws for over 256 chars', () => {
      expect(() => new EmbedBuilder().setTitle('x'.repeat(257))).toThrow(
        'Embed title has 257 characters. Maximum is 256.',
      );
    });

    it('setDescription throws for over 4096 chars', () => {
      expect(() => new EmbedBuilder().setDescription('x'.repeat(4097))).toThrow(
        'Embed description has 4097 characters. Maximum is 4096.',
      );
    });

    it('measures fixed limits after Fluxer string normalization', () => {
      const acceptedAuthor = ` ${'a'.repeat(256)}`;
      const acceptedTitle = `${'a'.repeat(256)}\u000C\u202E`;

      expect(new EmbedBuilder().setAuthor({ name: acceptedAuthor }).toJSON().author?.name).toBe(
        acceptedAuthor,
      );
      expect(new EmbedBuilder().setTitle(acceptedTitle).toJSON().title).toBe(acceptedTitle);
      expect(() => new EmbedBuilder().setTitle(` ${'a'.repeat(257)}`)).toThrow(
        'Embed title has 258 supplied characters (257 after Fluxer normalization). Maximum is 256.',
      );
    });

    it('setURL throws for invalid URL', () => {
      expect(() => new EmbedBuilder().setURL('not-a-valid-url')).toThrow('Invalid embed URL');
    });

    it('rejects URL forms that Fluxer does not accept', () => {
      for (const url of [
        '',
        'ftp://example.com/file.png',
        'HTTPS://example.com/file.png',
        'https://user:password@example.com/file.png',
        'https://example.com./file.png',
        'https://example..com/file.png',
        'https://exa_mple.com/file.png',
        'https://-example.com/file.png',
        `https://${'a'.repeat(64)}.example.com/file.png`,
        'https://ｅxample.com/file.png',
        'http://123/file.png',
        'https://example.com/a b',
        'https://example.com/<tag>',
        'https://example.com/a\tb',
        'https://example.com:0/file.png',
        'https://example.com:00000/file.png',
      ]) {
        expect(() => new EmbedBuilder().setURL(url)).toThrow('Invalid embed URL');
        expect(() => new EmbedBuilder().setImage(url)).toThrow('Invalid embed media URL');
      }
      expect(() => new EmbedBuilder().setImage('attachment://file name.png')).toThrow(
        'Invalid embed media URL: attachment filenames may contain only letters, numbers, marks, underscores, periods, and hyphens',
      );
      expect(() => new EmbedBuilder().setAuthor({ name: 'author', url: '' })).toThrow(
        'Invalid embed URL',
      );
      expect(() => new EmbedBuilder().setFooter({ text: 'footer', iconURL: '' })).toThrow(
        'Invalid embed URL',
      );
    });

    it('accepts self-hosted HTTP URLs with valid local hosts', () => {
      for (const url of [
        'http://localhost:48763/image.png',
        'http://myservice:8080/image.png',
        'http://my-service:8080/image.png',
        'http://127.0.0.1:48763/image.png',
        'http://[::1]:48763/image.png',
        'https://例え.テスト/image.png',
      ]) {
        expect(new EmbedBuilder().setURL(url).toJSON().url).toBe(url);
        expect(new EmbedBuilder().setImage(url).toJSON().image?.url).toBe(url);
      }
    });

    it('explains why an embed URL is invalid', () => {
      expect(() => new EmbedBuilder().setURL('HTTPS://example.com/file.png')).toThrow(
        'Invalid embed URL: Embed URL must start with lowercase http:// or https://',
      );
      expect(() =>
        new EmbedBuilder().setImage('https://user:password@example.com/file.png'),
      ).toThrow('Invalid embed media URL: Embed media URL must not include credentials');
      expect(() => new EmbedBuilder().setURL('https://example.com./file.png')).toThrow(
        'Invalid embed URL: Embed URL host must not end with a dot',
      );
      expect(() => new EmbedBuilder().setURL('https://exa_mple.com/file.png')).toThrow(
        'Invalid embed URL: Embed URL host labels must not contain underscores',
      );
      expect(() => new EmbedBuilder().setURL('https://example.com/a b')).toThrow(
        'Invalid embed URL: Embed URL must not contain whitespace',
      );
      expect(() => new EmbedBuilder().setImage('https://example.com/<tag>')).toThrow(
        'Invalid embed media URL: Embed media URL must not contain angle brackets',
      );
      expect(() => new EmbedBuilder().setURL('https://example.com:0/file.png')).toThrow(
        'Invalid embed URL: Embed URL port must be between 1 and 65535',
      );
    });

    it('enforces Fluxer URL length boundaries', () => {
      const prefix = 'https://example.com/';
      const exact = `${prefix}${'a'.repeat(2048 - prefix.length)}`;
      const over = `${exact}a`;

      expect(new EmbedBuilder().setURL(exact).toJSON().url).toBe(exact);
      expect(() => new EmbedBuilder().setURL(over)).toThrow(
        'Invalid embed URL: Embed URL has 2049 characters. Maximum is 2048.',
      );
      expect(() => new EmbedBuilder().setImage(over)).toThrow(
        'Invalid embed media URL: Embed media URL has 2049 characters. Maximum is 2048.',
      );
    });

    it('does not clear existing media when an empty replacement URL is rejected', () => {
      const embed = new EmbedBuilder().setImage('https://example.com/original.png');
      expect(() => embed.setImage('')).toThrow('Invalid embed media URL');
      expect(embed.data.image).toEqual({ url: 'https://example.com/original.png' });
    });

    it('setImage throws for invalid media URL', () => {
      expect(() => new EmbedBuilder().setImage({ url: 'invalid' })).toThrow(
        'Invalid embed media URL',
      );
    });

    it('rejects oversized media descriptions without partially mutating the builder', () => {
      expect(
        new EmbedBuilder()
          .setThumbnail({
            url: 'https://example.com/thumb.png',
            description: 'x'.repeat(4096),
          })
          .toJSON().thumbnail?.description,
      ).toHaveLength(4096);

      const embed = new EmbedBuilder().setImage({
        url: 'https://example.com/original.png',
        description: 'original',
      });
      expect(() =>
        embed.setImage({
          url: 'https://example.com/replacement.png',
          description: 'x'.repeat(4097),
        }),
      ).toThrow('Embed image description has 4097 characters. Maximum is 4096.');
      expect(embed.data.image).toEqual({
        url: 'https://example.com/original.png',
        description: 'original',
      });
      expect(() =>
        new EmbedBuilder().setThumbnail({
          url: 'https://example.com/thumb.png',
          description: 'x'.repeat(4097),
        }),
      ).toThrow('Embed thumbnail description has 4097 characters. Maximum is 4096.');
    });

    it('leaves account-dependent aggregate limits to the API', () => {
      const embed = new EmbedBuilder()
        .setTitle('x'.repeat(256))
        .setDescription('y'.repeat(2000))
        .addFields(
          { name: 'n'.repeat(256), value: 'v'.repeat(600) },
          { name: 'n'.repeat(256), value: 'v'.repeat(600) },
          { name: 'n'.repeat(256), value: 'v'.repeat(600) },
          { name: 'n'.repeat(256), value: 'v'.repeat(600) },
          { name: 'n'.repeat(256), value: 'v'.repeat(500) },
        );
      expect(embed.toJSON()).toMatchObject({
        title: 'x'.repeat(256),
        description: 'y'.repeat(2000),
      });
    });

    it('rejects oversized author and footer text instead of truncating it', () => {
      expect(() => new EmbedBuilder().setAuthor({ name: 'x'.repeat(257) })).toThrow(
        'Embed author name has 257 characters. Maximum is 256.',
      );
      expect(() => new EmbedBuilder().setFooter({ text: 'x'.repeat(2049) })).toThrow(
        'Embed footer text has 2049 characters. Maximum is 2048.',
      );
    });

    it('rejects required strings that are empty after Fluxer normalization', () => {
      expect(() => new EmbedBuilder().setAuthor({ name: '  ' })).toThrow(
        'Embed author name has 2 supplied characters (0 after Fluxer normalization). Minimum is 1.',
      );
      expect(() => new EmbedBuilder().setFooter({ text: '' })).toThrow(
        'Embed footer text has 0 characters. Minimum is 1.',
      );
      expect(() =>
        new EmbedBuilder().setImage({
          url: 'https://example.com/image.png',
          description: '',
        }),
      ).toThrow('Embed image description has 0 characters. Minimum is 1.');
      expect(() => new EmbedBuilder().setFields({ name: '', value: 'value' })).toThrow(
        'Embed field 1 name has 0 characters. Minimum is 1.',
      );
      expect(() => new EmbedBuilder().setDescription('  ')).toThrow(
        'Embed description has 2 supplied characters (0 after Fluxer normalization). Minimum is 1.',
      );
    });

    it('reports malformed JavaScript input at the public builder boundary', () => {
      expect(() => new EmbedBuilder().setImage({} as { url: string })).toThrow(
        'Embed media URL must be a string.',
      );
      expect(() =>
        new EmbedBuilder().setFields(null as unknown as { name: string; value: string }),
      ).toThrow('Embed field 1 must be an object.');
      expect(() => new EmbedBuilder().setAuthor('' as unknown as { name: string })).toThrow(
        'Embed author options must be an object.',
      );
      expect(() => new EmbedBuilder().setFooter('' as unknown as { text: string })).toThrow(
        'Embed footer options must be an object.',
      );

      const embed = new EmbedBuilder();
      Object.assign(embed.data, { fields: { length: 1 } });
      expect(() => embed.addFields({ name: 'name', value: 'value' })).toThrow(
        'Embed field list must be an array.',
      );
    });

    it('rejects oversized field text with its position', () => {
      expect(() =>
        new EmbedBuilder().setFields(
          { name: 'valid', value: 'value' },
          { name: 'x'.repeat(257), value: 'value' },
        ),
      ).toThrow('Embed field 2 name has 257 characters. Maximum is 256.');
      expect(() =>
        new EmbedBuilder().addFields({ name: 'valid', value: 'x'.repeat(1025) }),
      ).toThrow('Embed field 1 value has 1025 characters. Maximum is 1024.');
    });

    it('rejects excess fields without partially mutating the builder', () => {
      const embed = new EmbedBuilder().addFields({ name: 'existing', value: 'value' });
      const excess = Array.from({ length: 25 }, (_, index) => ({
        name: `field-${index}`,
        value: 'value',
      }));

      expect(() => embed.addFields(...excess)).toThrow(
        'Embed field list has 26 entries. Maximum is 25.',
      );
      expect(embed.data.fields).toHaveLength(1);
    });

    it('setFields and spliceFields reject more than 25 fields', () => {
      const fields = Array.from({ length: 26 }, (_, index) => ({
        name: `field-${index}`,
        value: 'value',
      }));
      const embed = new EmbedBuilder();
      expect(() => embed.setFields(...fields)).toThrow(
        'Embed field list has 26 entries. Maximum is 25.',
      );
      expect(embed.data.fields).toBeUndefined();

      embed.setFields(...fields.slice(0, 25));
      expect(() => embed.spliceFields(10, 0, { name: 'extra', value: 'value' })).toThrow(
        'Embed field list has 26 entries. Maximum is 25.',
      );
      expect(embed.data.fields).toHaveLength(25);
    });

    it('validates data copied from API embeds before serialization', () => {
      const embed = EmbedBuilder.from({
        description: 'valid',
        fields: [{ name: 'x'.repeat(257), value: 'value', inline: false }],
      });

      expect(() => embed.toJSON()).toThrow(
        'Embed field 1 name has 257 characters. Maximum is 256.',
      );
    });

    it('validates media descriptions copied from API embeds before serialization', () => {
      const embed = EmbedBuilder.from({
        description: null,
        image: {
          url: 'https://example.com/image.png',
          description: 'x'.repeat(4097),
        },
      });

      expect(() => embed.toJSON()).toThrow(
        'Embed image description has 4097 characters. Maximum is 4096.',
      );
    });
  });

  describe('camelCase in / snake_case out', () => {
    it('setAuthor maps iconURL → icon_url', () => {
      const json = new EmbedBuilder()
        .setAuthor({
          name: 'Author',
          url: 'https://example.com',
          iconURL: 'https://example.com/icon.png',
        })
        .toJSON();

      expect(json.author).toEqual({
        name: 'Author',
        url: 'https://example.com',
        icon_url: 'https://example.com/icon.png',
      });
      expect(json.author).not.toHaveProperty('iconURL');
    });

    it('setFooter maps iconURL → icon_url', () => {
      const json = new EmbedBuilder()
        .setFooter({ text: 'Footer text', iconURL: 'https://example.com/footer.png' })
        .toJSON();

      expect(json.footer).toEqual({
        text: 'Footer text',
        icon_url: 'https://example.com/footer.png',
      });
      expect(json.footer).not.toHaveProperty('iconURL');
    });

    it('setAuthor null clears author', () => {
      const embed = new EmbedBuilder().setAuthor({ name: 'A' }).setAuthor(null);
      expect(embed.toJSON().author).toBeUndefined();
    });
  });

  describe('setColor and setTimestamp', () => {
    it('setColor accepts number, hex, RGB array', () => {
      const embed = new EmbedBuilder().setColor(0xff0000);
      expect(embed.toJSON().color).toBe(0xff0000);
      embed.setColor('#00ff00');
      expect(embed.toJSON().color).toBe(0x00ff00);
      embed.setColor([0, 0, 255]);
      expect(embed.toJSON().color).toBe(0x0000ff);
    });

    it('setColor null clears', () => {
      expect(new EmbedBuilder().setColor(0xff0000).setColor(null).toJSON().color).toBeUndefined();
    });

    it('setTimestamp accepts Date and number', () => {
      const d = new Date('2021-01-01T00:00:00Z');
      const embed = new EmbedBuilder().setTitle('T').setTimestamp(d);
      expect(embed.toJSON().timestamp).toBe('2021-01-01T00:00:00.000Z');
      embed.setTimestamp(1609459200000);
      expect(embed.toJSON().timestamp).toBe('2021-01-01T00:00:00.000Z');
    });

    it('setTimestamp with no argument uses current time', () => {
      const before = Date.now();
      const ts = new EmbedBuilder().setTitle('T').setTimestamp().toJSON().timestamp;
      const after = Date.now();
      expect(ts).toBeDefined();
      const ms = Date.parse(ts!);
      expect(ms).toBeGreaterThanOrEqual(before);
      expect(ms).toBeLessThanOrEqual(after);
    });

    it('setTimestamp null clears', () => {
      expect(
        new EmbedBuilder().setTitle('T').setTimestamp(new Date()).setTimestamp(null).toJSON()
          .timestamp,
      ).toBeUndefined();
    });
  });

  describe('fields', () => {
    it('setFields replaces all fields', () => {
      const json = new EmbedBuilder()
        .setTitle('T')
        .addFields({ name: 'Old', value: '1' })
        .setFields({ name: 'New', value: '2' })
        .toJSON();
      expect(json.fields).toEqual([{ name: 'New', value: '2', inline: undefined }]);
    });

    it('setFields() with no args clears fields', () => {
      const json = new EmbedBuilder()
        .setTitle('T')
        .addFields({ name: 'A', value: '1' })
        .setFields()
        .toJSON();
      expect(json.fields).toBeUndefined();
    });

    it('addFields adds multiple', () => {
      const json = new EmbedBuilder()
        .setTitle('T')
        .addFields({ name: 'A', value: '1' }, { name: 'B', value: '2', inline: true })
        .toJSON();
      expect(json.fields).toHaveLength(2);
      expect(json.fields![0]).toEqual({ name: 'A', value: '1', inline: undefined });
      expect(json.fields![1]).toEqual({ name: 'B', value: '2', inline: true });
    });

    it('spliceFields replaces at index', () => {
      const json = new EmbedBuilder()
        .setTitle('T')
        .addFields({ name: 'A', value: '1' }, { name: 'B', value: '2' })
        .spliceFields(1, 1, { name: 'X', value: 'replacement' })
        .toJSON();
      expect(json.fields).toHaveLength(2);
      expect(json.fields![1].name).toBe('X');
    });
  });

  describe('EmbedBuilder.from', () => {
    it('copies request fields only', () => {
      const source = {
        title: 'Hello',
        description: 'World',
        image: { url: 'https://example.com/img.png' },
      };
      const json = EmbedBuilder.from(source).toJSON();
      expect(json.title).toBe('Hello');
      expect(json.description).toBe('World');
      expect(json.image).toEqual(source.image);
      assertWire(json);
    });

    it('does not copy video or audio from response embeds', () => {
      const json = EmbedBuilder.from({
        type: 'rich',
        title: 'Media',
        video: {
          url: 'https://example.com/video.mp4',
          duration: 90,
          width: 1280,
          height: 720,
          flags: 0,
        },
        audio: {
          url: 'https://example.com/audio.mp3',
          duration: 180,
          content_type: 'audio/mpeg',
          flags: 0,
        },
      }).toJSON();

      expect(json.title).toBe('Media');
      assertWire(json);
    });
  });
});
