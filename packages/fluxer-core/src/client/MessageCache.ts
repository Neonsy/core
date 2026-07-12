import type { APIMessage } from '@fluxerjs/types';

/** Per-channel message cache with FIFO eviction. */
export class MessageCache {
  private caches: Map<string, Map<string, APIMessage>> | null = null;

  constructor(private readonly getLimit: () => number) {}

  get(channelId: string): Map<string, APIMessage> | null {
    const limit = this.getLimit();
    if (limit <= 0) return null;
    if (!this.caches) this.caches = new Map();
    let cache = this.caches.get(channelId);
    if (!cache) {
      cache = new Map();
      this.caches.set(channelId, cache);
    }
    return cache;
  }

  add(channelId: string, data: APIMessage): void {
    const cache = this.get(channelId);
    if (!cache) return;
    const limit = this.getLimit();
    if (limit > 0 && cache.size >= limit && !cache.has(data.id)) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) cache.delete(firstKey);
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

  reset(): void {
    this.caches = null;
  }
}
