import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageManager } from './MessageManager.js';
import { Routes } from '@fluxerjs/types';

function createMockClient() {
  const cache = new Map<string, Map<string, unknown>>();
  return {
    rest: { get: vi.fn() },
    getOrCreateUser: (user: { id: string }) => user,
    _getMessageCache: (channelId: string) => cache.get(channelId),
    _addMessageToCache: (channelId: string, data: { id: string }) => {
      if (!cache.has(channelId)) cache.set(channelId, new Map());
      cache.get(channelId)!.set(data.id, data);
    },
  };
}

const sampleMessage = {
  id: '100',
  channel_id: 'ch1',
  author: { id: 'u1', username: 'bot' },
  content: 'hello',
  timestamp: '2024-01-01T00:00:00.000Z',
  edited_timestamp: null,
  pinned: false,
  type: 0,
  flags: 0,
};

describe('MessageManager', () => {
  let client: ReturnType<typeof createMockClient>;
  let manager: MessageManager;

  beforeEach(() => {
    client = createMockClient();
    manager = new MessageManager(client as never, 'ch1');
  });

  describe('fetch(messageId)', () => {
    it('fetches a single message by ID', async () => {
      client.rest.get.mockResolvedValue(sampleMessage);
      const message = await manager.fetch('100');
      expect(client.rest.get).toHaveBeenCalledWith(Routes.channelMessage('ch1', '100'));
      expect(message.id).toBe('100');
    });
  });

  describe('fetch(options)', () => {
    it('fetches multiple messages with query params', async () => {
      const messages = [
        { ...sampleMessage, id: '101' },
        { ...sampleMessage, id: '100' },
      ];
      client.rest.get.mockResolvedValue(messages);

      const collection = await manager.fetch({ limit: 50, before: '102' });

      expect(client.rest.get).toHaveBeenCalledWith(
        `${Routes.channelMessages('ch1')}?limit=50&before=102`,
      );
      expect(collection.size).toBe(2);
      expect(collection.get('100')?.id).toBe('100');
      expect(collection.get('101')?.id).toBe('101');
    });

    it('fetches without query string when no options given', async () => {
      client.rest.get.mockResolvedValue([]);
      await manager.fetch({});
      expect(client.rest.get).toHaveBeenCalledWith(Routes.channelMessages('ch1'));
    });

    it('throws RangeError when limit is out of range', async () => {
      await expect(manager.fetch({ limit: 0 })).rejects.toThrow(RangeError);
      await expect(manager.fetch({ limit: 101 })).rejects.toThrow(RangeError);
    });
  });
});
