import type { APIWebhook } from '@fluxerjs/types';
import { Routes } from '@fluxerjs/types';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_INSTANCE_ENDPOINTS } from '../Helpers/Instance.js';
import { type Client, Webhook } from '../index.js';
import { ErrorCodes } from '../LibErrors/ErrorCodes.js';
import { fixtureUser } from '../TestKit/Fixtures.js';

function createMockClient() {
  const get = vi.fn();
  const del = vi.fn();
  const post = vi.fn();
  const patch = vi.fn();

  const client = {
    rest: { get, delete: del, post, patch, put: vi.fn() },
    instance: { endpoints: DEFAULT_INSTANCE_ENDPOINTS, discovery: null },
    getOrCreateUser: (data: { id: string; username?: string; discriminator?: string }) => ({
      id: data.id,
      username: data.username ?? 'user',
      discriminator: data.discriminator ?? '0',
    }),
  } as unknown as Client;

  return { client, get, del, post, patch };
}

function createWebhook(client: Client, token: string | null = 'token123') {
  return new Webhook(client, {
    id: 'webhook1',
    guild_id: 'guild1',
    channel_id: 'channel1',
    name: 'Test Webhook',
    avatar: null,
    user: fixtureUser({ id: 'user1', username: 'WebhookUser' }),
    ...(token ? { token } : {}),
  } as APIWebhook & { token?: string | null });
}

const mockMessagePayload = {
  id: 'message1',
  channel_id: 'channel1',
  author: fixtureUser({ id: 'user1', username: 'WebhookUser' }),
  type: 0,
  flags: 0,
  content: 'hello',
  timestamp: new Date().toISOString(),
  edited_timestamp: null,
  pinned: false,
};

describe('Webhook', () => {
  describe('delete()', () => {
    it('uses token auth when token is present', async () => {
      const { client, del } = createMockClient();
      await createWebhook(client).delete();
      expect(del).toHaveBeenCalledWith(Routes.webhookExecute('webhook1', 'token123'), {
        auth: false,
      });
    });

    it('uses bot auth when token is absent', async () => {
      const { client, del } = createMockClient();
      await createWebhook(client, null).delete();
      expect(del).toHaveBeenCalledWith(Routes.webhook('webhook1'), { auth: true });
    });
  });

  describe('edit()', () => {
    it('patches via token route without channel_id', async () => {
      const { client, patch } = createMockClient();
      patch.mockResolvedValue({
        id: 'webhook1',
        guild_id: 'guild1',
        channel_id: 'channel1',
        name: 'Renamed',
        avatar: null,
        user: { id: 'user1', username: 'WebhookUser', discriminator: '0' },
      });
      const webhook = createWebhook(client);

      await webhook.edit({ name: 'Renamed', channel_id: 'other' } as {
        name: string;
        channel_id: string;
      });

      expect(patch).toHaveBeenCalledWith(Routes.webhookExecute('webhook1', 'token123'), {
        body: { name: 'Renamed' },
        auth: false,
      });
      expect(webhook.name).toBe('Renamed');
    });

    it('patches via bot route and allows channel_id', async () => {
      const { client, patch } = createMockClient();
      patch.mockResolvedValue({
        id: 'webhook1',
        guild_id: 'guild1',
        channel_id: 'channel2',
        name: 'Moved',
        avatar: null,
        user: { id: 'user1', username: 'WebhookUser', discriminator: '0' },
      });
      const webhook = createWebhook(client, null);

      await webhook.edit({ name: 'Moved', channelId: 'channel2' });

      expect(patch).toHaveBeenCalledWith(Routes.webhook('webhook1'), {
        body: { name: 'Moved', channel_id: 'channel2' },
        auth: true,
      });
      expect(webhook.channelId).toBe('channel2');
    });
  });

  describe('send()', () => {
    it('posts without wait query by default and returns undefined', async () => {
      const { client, post } = createMockClient();
      post.mockResolvedValue(undefined);
      const webhook = createWebhook(client);

      const result = await webhook.send('hi');

      expect(post).toHaveBeenCalledWith(Routes.webhookExecute('webhook1', 'token123'), {
        body: { content: 'hi' },
        auth: false,
      });
      expect(result).toBeUndefined();
    });

    it('appends wait=true and returns Message', async () => {
      const { client, post } = createMockClient();
      post.mockResolvedValue(mockMessagePayload);
      const webhook = createWebhook(client);

      const message = await webhook.send({ content: 'hi', username: 'Bot' }, true);

      expect(post).toHaveBeenCalledWith(
        `${Routes.webhookExecute('webhook1', 'token123')}?wait=true`,
        {
          body: { content: 'hi', username: 'Bot' },
          auth: false,
        },
      );
      expect(message?.id).toBe('message1');
    });

    it('throws when token is unavailable', async () => {
      const { client } = createMockClient();
      await expect(createWebhook(client, null).send('hi')).rejects.toMatchObject({
        code: ErrorCodes.WebhookTokenRequired,
      });
    });
  });

  describe('editMessage()', () => {
    it('patches webhook message with token auth', async () => {
      const { client, patch } = createMockClient();
      patch.mockResolvedValue({ ...mockMessagePayload, content: 'edited' });
      const webhook = createWebhook(client);

      const message = await webhook.editMessage('message1', {
        content: 'edited',
        allowedMentions: { parse: [] },
      });

      expect(patch).toHaveBeenCalledWith(
        Routes.webhookMessage('webhook1', 'token123', 'message1'),
        {
          body: { content: 'edited', allowed_mentions: { parse: [] } },
          auth: false,
        },
      );
      expect(message.content).toBe('edited');
    });

    it('throws when token is unavailable', async () => {
      const { client } = createMockClient();
      await expect(
        createWebhook(client, null).editMessage('message1', { content: 'x' }),
      ).rejects.toMatchObject({ code: ErrorCodes.WebhookTokenRequired });
    });
  });

  describe('fetchMessage()', () => {
    it('fetches a webhook message using token auth route', async () => {
      const { client, get } = createMockClient();
      get.mockResolvedValue(mockMessagePayload);
      const webhook = createWebhook(client);

      const message = await webhook.fetchMessage('message1');

      expect(get).toHaveBeenCalledWith(Routes.webhookMessage('webhook1', 'token123', 'message1'), {
        auth: false,
      });
      expect(message.id).toBe('message1');
    });

    it('throws when token is unavailable', async () => {
      const { client } = createMockClient();
      await expect(createWebhook(client, null).fetchMessage('message1')).rejects.toMatchObject({
        code: ErrorCodes.WebhookTokenRequired,
      });
    });
  });

  describe('deleteMessage()', () => {
    it('deletes a webhook message using token auth route', async () => {
      const { client, del } = createMockClient();
      const webhook = createWebhook(client);

      await webhook.deleteMessage('message1');

      expect(del).toHaveBeenCalledWith(Routes.webhookMessage('webhook1', 'token123', 'message1'), {
        auth: false,
      });
    });

    it('throws when token is unavailable', async () => {
      const { client } = createMockClient();
      await expect(createWebhook(client, null).deleteMessage('message1')).rejects.toMatchObject({
        code: ErrorCodes.WebhookTokenRequired,
      });
    });
  });
});
