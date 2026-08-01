import { Routes } from '@fluxerjs/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FluxerError } from '../LibErrors/FluxerError.js';
import { Client } from './Client.js';
import { validateBulkMessageFetchRequests } from './MessageManager.js';

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

describe('validateBulkMessageFetchRequests', () => {
  it('throws when request count is out of range', () => {
    expect(() => validateBulkMessageFetchRequests([])).toThrow(FluxerError);
    expect(() =>
      validateBulkMessageFetchRequests(
        Array.from({ length: 26 }, (_, i) => ({ channelId: String(i), limit: 1 })),
      ),
    ).toThrow(FluxerError);
  });

  it('throws when per-channel limit is out of range', () => {
    expect(() => validateBulkMessageFetchRequests([{ channelId: 'ch1', limit: 0 }])).toThrow(
      FluxerError,
    );
    expect(() => validateBulkMessageFetchRequests([{ channelId: 'ch1', limit: 26 }])).toThrow(
      FluxerError,
    );
  });

  it('throws when total message count exceeds 250', () => {
    expect(() =>
      validateBulkMessageFetchRequests(
        Array.from({ length: 25 }, (_, i) => ({ channelId: String(i), limit: 11 })),
      ),
    ).toThrow(FluxerError);
  });
});

describe('Client.bulkFetchMessages', () => {
  let client: Client;

  beforeEach(() => {
    client = new Client();
    client.rest.post = vi.fn();
    client._addMessageToCache = vi.fn();
  });

  it('POSTs validated requests and hydrates messages by default', async () => {
    (client.rest.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      channels: [
        {
          channel_id: 'ch1',
          messages: [sampleMessage, { ...sampleMessage, id: '99' }],
        },
        {
          channel_id: 'ch2',
          messages: [{ ...sampleMessage, id: '200', channel_id: 'ch2' }],
        },
      ],
    });

    const result = await client.bulkFetchMessages([
      { channelId: 'ch1', limit: 2, before: '101' },
      { channelId: 'ch2', limit: 1 },
    ]);

    expect(client.rest.post).toHaveBeenCalledWith(Routes.channelsMessagesBulk(), {
      body: {
        requests: [
          { channel_id: 'ch1', limit: 2, before: '101' },
          { channel_id: 'ch2', limit: 1 },
        ],
      },
      auth: true,
    });
    expect(result.channels).toHaveLength(2);
    expect(result.channels[0]?.channelId).toBe('ch1');
    expect(result.channels[0]?.messages.size).toBe(2);
    expect(result.channels[1]?.messages.get('200')?.id).toBe('200');
    expect(client._addMessageToCache).toHaveBeenCalledTimes(3);
  });

  it('returns raw API response when hydrate is false', async () => {
    const apiResponse = {
      channels: [{ channel_id: 'ch1', messages: [sampleMessage] }],
    };
    (client.rest.post as ReturnType<typeof vi.fn>).mockResolvedValue(apiResponse);

    const result = await client.bulkFetchMessages([{ channelId: 'ch1', limit: 1 }], {
      hydrate: false,
    });

    expect(result).toEqual(apiResponse);
    expect(client._addMessageToCache).not.toHaveBeenCalled();
  });
});
