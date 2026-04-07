import { describe, it, expect } from 'vitest';
import type { APIApplicationCommandInteraction } from '@fluxerjs/types';
import { Client } from '../../client/Client.js';
import { ErrorCodes } from '../../errors/ErrorCodes.js';
import { ChatInputCommandInteraction } from './ChatInputCommandInteraction.js';
import { createInteraction, isChatInputCommandInteraction } from './createInteraction.js';
import { BaseInteraction } from './BaseInteraction.js';

function minimalClient(): Client {
  return new Client();
}

describe('ChatInputCommandInteraction', () => {
  it('createInteraction returns ChatInputCommandInteraction when command name present', () => {
    const client = minimalClient();
    const raw: APIApplicationCommandInteraction = {
      id: 'i1',
      application_id: 'app1',
      type: 2,
      token: 'tok',
      data: {
        name: 'ping',
        options: [{ name: 'msg', type: 3, value: 'hello' }],
      },
    };
    const i = createInteraction(client, raw);
    expect(isChatInputCommandInteraction(i)).toBe(true);
    if (isChatInputCommandInteraction(i)) {
      expect(i.commandName).toBe('ping');
      expect(i.getString('msg')).toBe('hello');
    }
  });

  it('createInteraction returns BaseInteraction when data.name missing', () => {
    const client = minimalClient();
    const raw: APIApplicationCommandInteraction = {
      id: 'i1',
      application_id: 'app1',
      type: 2,
      token: 'tok',
    };
    const i = createInteraction(client, raw);
    expect(i).toBeInstanceOf(BaseInteraction);
    expect(isChatInputCommandInteraction(i)).toBe(false);
  });

  it('getInteger and getBoolean enforce types', () => {
    const client = minimalClient();
    const raw: APIApplicationCommandInteraction = {
      id: 'i1',
      application_id: 'app1',
      type: 2,
      token: 'tok',
      data: {
        name: 'cmd',
        options: [
          { name: 'n', type: 4, value: 42 },
          { name: 'b', type: 5, value: true },
        ],
      },
    };
    const i = new ChatInputCommandInteraction(client, raw);
    expect(i.getInteger('n')).toBe(42);
    expect(i.getBoolean('b')).toBe(true);
    expect(() => i.getString('n')).toThrow();
  });

  it('throws InteractionOptionNotFound for missing option', () => {
    const client = minimalClient();
    const raw: APIApplicationCommandInteraction = {
      id: 'i1',
      application_id: 'app1',
      type: 2,
      token: 'tok',
      data: { name: 'cmd', options: [] },
    };
    const i = new ChatInputCommandInteraction(client, raw);
    try {
      i.getString('missing');
      expect.fail('expected throw');
    } catch (e) {
      expect(e).toMatchObject({ code: ErrorCodes.InteractionOptionNotFound });
    }
  });

  it('getSubcommand reads nested subcommand', () => {
    const client = minimalClient();
    const raw: APIApplicationCommandInteraction = {
      id: 'i1',
      application_id: 'app1',
      type: 2,
      token: 'tok',
      data: {
        name: 'mod',
        options: [
          {
            name: 'user',
            type: 1,
            options: [{ name: 'target', type: 3, value: 'u1' }],
          },
        ],
      },
    };
    const i = new ChatInputCommandInteraction(client, raw);
    expect(i.getSubcommand()).toBe('user');
    expect(i.getString('target')).toBe('u1');
  });
});
