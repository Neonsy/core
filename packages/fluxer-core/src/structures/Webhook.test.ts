import { describe, it, expect, vi } from 'vitest';
import { Client, Webhook } from '../';
import { Routes } from '@fluxerjs/types';
import { ErrorCodes } from '../errors/ErrorCodes.js';

function createMockClient() {
  const get = vi.fn();
  const del = vi.fn();

  const client = {
    rest: {
      get,
      delete: del,
      post: vi.fn(),
      patch: vi.fn(),
      put: vi.fn(),
    },
    getOrCreateUser: (data: { id: string; username?: string; discriminator?: string }) => ({
      id: data.id,
      username: data.username ?? 'user',
      discriminator: data.discriminator ?? '0',
    }),
  } as unknown as Client;

  return { client, get, del };
}

function createWebhook(client: Client, token: string | null = 'token123') {
  const data = {
    id: 'webhook1',
    guild_id: 'guild1',
    channel_id: 'channel1',
    name: 'Test Webhook',
    avatar: null,
    user: {
      id: 'user1',
      username: 'WebhookUser',
      discriminator: '0',
    },
  };

  return new Webhook(client, {
    ...data,
    ...(token ? { token } : {}),
  });
}

const mockMessagePayload = {
  id: 'message1',
  channel_id: 'channel1',
  author: {
    id: 'user1',
    username: 'WebhookUser',
    discriminator: '0',
  },
  type: 0,
  flags: 0,
  content: 'hello',
  timestamp: new Date().toISOString(),
  edited_timestamp: null,
  pinned: false,
};

describe('Webhook', () => {
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
      const webhook = createWebhook(client, null);

      await expect(webhook.fetchMessage('message1')).rejects.toMatchObject({
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
      const webhook = createWebhook(client, null);

      await expect(webhook.deleteMessage('message1')).rejects.toMatchObject({
        code: ErrorCodes.WebhookTokenRequired,
      });
    });
  });
});
