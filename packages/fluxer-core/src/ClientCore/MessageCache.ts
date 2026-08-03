import type { APIMessage } from '@fluxerjs/types';

/** Aggregate message-cache sizes: number of cached channels and total messages. */
export interface MessageCacheStats {
  channels: number;
  messages: number;
}

type MessageLimit = number | false;

/**
 * Per-channel message cache with FIFO eviction.
 *
 * - `false` limit → caching disabled
 * - `Infinity` / unbounded → no per-channel cap
 * - positive → max messages per channel
 *
 * Outer map of channel caches is itself FIFO-bounded by `getChannelLimit`.
 * {@link get} never creates empty maps (use {@link add}).
 */
export class MessageCache {
  private caches: Map<string, Map<string, APIMessage>> | null = null;

  constructor(
    private readonly getLimit: () => MessageLimit,
    private readonly getChannelLimit: () => number = () => Number.POSITIVE_INFINITY,
    private readonly onEvict?: (bucket: 'messages' | 'messageChannels', count?: number) => void,
  ) {}

  /**
   * Return the existing per-channel map, or `null` if disabled / not yet created.
   * Does **not** create empty maps.
   */
  get(channelId: string): Map<string, APIMessage> | null {
    if (this.getLimit() === false) return null;
    return this.caches?.get(channelId) ?? null;
  }

  add(channelId: string, data: APIMessage): void {
    const limit = this.getLimit();
    if (limit === false) return;

    if (!this.caches) this.caches = new Map();

    let cache = this.caches.get(channelId);
    if (!cache) {
      const channelLimit = this.getChannelLimit();
      if (Number.isFinite(channelLimit) && channelLimit > 0 && this.caches.size >= channelLimit) {
        const oldest = this.caches.keys().next().value;
        if (oldest !== undefined) {
          const evictedMessages = this.caches.get(oldest)?.size ?? 0;
          this.caches.delete(oldest);
          this.onEvict?.('messageChannels');
          this.onEvict?.('messages', evictedMessages);
        }
      }
      cache = new Map();
      this.caches.set(channelId, cache);
    }

    if (Number.isFinite(limit) && limit > 0 && cache.size >= limit && !cache.has(data.id)) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
        this.onEvict?.('messages');
      }
    }
    cache.set(data.id, { ...data });
  }

  remove(channelId: string, messageId: string): void {
    this.caches?.get(channelId)?.delete(messageId);
  }

  clearChannel(channelId: string): void {
    this.caches?.delete(channelId);
  }

  sweep(filter?: (message: APIMessage, channelId: string) => boolean, channelId?: string): number {
    if (!this.caches) return 0;
    let removed = 0;
    const channels = channelId
      ? ([[channelId, this.caches.get(channelId)]] as const)
      : [...this.caches.entries()];
    for (const [chId, cache] of channels) {
      if (!cache) continue;
      for (const [msgId, data] of cache) {
        if (!filter || filter(data, chId)) {
          cache.delete(msgId);
          removed++;
        }
      }
      if (cache.size === 0) this.caches.delete(chId);
    }
    return removed;
  }

  stats(): MessageCacheStats {
    if (!this.caches) return { channels: 0, messages: 0 };
    let messages = 0;
    for (const cache of this.caches.values()) messages += cache.size;
    return { channels: this.caches.size, messages };
  }

  reset(): void {
    this.caches = null;
  }
}
