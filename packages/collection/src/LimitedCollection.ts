import { Collection } from './Collection.js';

/** Options for {@link LimitedCollection}. */
export interface LimitedCollectionOptions<K, V> {
  /**
   * Maximum number of entries. Values `<= 0` or `Infinity` mean unbounded.
   * @default Infinity
   */
  maxSize?: number;
  /** Called after an entry is FIFO-evicted to make room for a new key. */
  onEvict?: (key: K, value: V) => void;
}

function resolveMaxSize(maxSize: number | undefined): number {
  if (maxSize === undefined) return Number.POSITIVE_INFINITY;
  if (!Number.isFinite(maxSize) || maxSize <= 0) return Number.POSITIVE_INFINITY;
  return Math.floor(maxSize);
}

/**
 * {@link Collection} with optional FIFO eviction when a new key is inserted at capacity.
 *
 * Construction is Map-safe: options are never passed to `super()`, so subclasses can call
 * `super({ maxSize, onEvict })` without Map treating the options object as an iterable.
 */
export class LimitedCollection<K, V> extends Collection<K, V> {
  readonly maxSize: number;
  readonly onEvict: ((key: K, value: V) => void) | null;

  /** Guard against re-entrant eviction while `onEvict` runs. */
  private _evicting = false;

  constructor(options: LimitedCollectionOptions<K, V> = {}) {
    super();
    this.maxSize = resolveMaxSize(options.maxSize);
    this.onEvict = options.onEvict ?? null;
  }

  /** Whether this collection enforces a finite capacity. */
  get bounded(): boolean {
    return Number.isFinite(this.maxSize);
  }

  /**
   * Insert or update an entry. When at capacity and `key` is new, the oldest entry is
   * removed (FIFO by Map insertion order) and `onEvict` is invoked if set.
   */
  override set(key: K, value: V): this {
    if (this.bounded && this.size >= this.maxSize && !this.has(key) && !this._evicting) {
      const firstKey = this.keys().next().value as K | undefined;
      if (firstKey !== undefined) {
        const firstValue = this.get(firstKey)!;
        this._evicting = true;
        try {
          super.delete(firstKey);
          this.onEvict?.(firstKey, firstValue);
        } finally {
          this._evicting = false;
        }
      }
    }
    return super.set(key, value);
  }

  /**
   * Remove entries matching `filter` (or all if omitted). Returns count removed.
   * Does not invoke `onEvict` — callers that need cascade teardown should handle it.
   */
  sweep(filter?: (value: V, key: K) => boolean): number {
    let removed = 0;
    for (const [key, value] of this) {
      if (!filter || filter(value, key)) {
        this.delete(key);
        removed++;
      }
    }
    return removed;
  }

  /** Clone into a new LimitedCollection with the same limits (no `onEvict` callback). */
  override clone(): LimitedCollection<K, V> {
    const out = new LimitedCollection<K, V>({ maxSize: this.maxSize });
    for (const [key, value] of this) out.set(key, value);
    return out;
  }
}
