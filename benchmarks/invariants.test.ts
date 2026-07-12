/**
 * Deterministic allocation/cache-size invariants (not wall-clock benches).
 */
import { describe, expect, it } from 'vitest';
import { Collection } from '../packages/collection/src/Collection.ts';
import { DEFAULT_CACHE_LIMITS } from '../packages/fluxer-core/src/util/Options.ts';

describe('performance invariants', () => {
  it('DEFAULT_CACHE_LIMITS are bounded (non-zero)', () => {
    expect(DEFAULT_CACHE_LIMITS.guilds).toBeGreaterThan(0);
    expect(DEFAULT_CACHE_LIMITS.channels).toBeGreaterThan(0);
    expect(DEFAULT_CACHE_LIMITS.users).toBeGreaterThan(0);
    expect(DEFAULT_CACHE_LIMITS.messages).toBeGreaterThan(0);
    expect(DEFAULT_CACHE_LIMITS.members).toBeGreaterThan(0);
  });

  it('Collection.first/last/random single-item do not require amount arrays', () => {
    const c = new Collection<string, number>();
    c.set('a', 1);
    c.set('b', 2);
    expect(c.first()).toBe(1);
    expect(c.last()).toBe(2);
    expect(typeof c.random()).toBe('number');
    expect(c.first(2)).toEqual([1, 2]);
  });
});
