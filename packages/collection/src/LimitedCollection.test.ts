import { describe, expect, it, vi } from 'vitest';
import { Collection } from './Collection.js';
import { LimitedCollection } from './LimitedCollection.js';

describe('LimitedCollection', () => {
  it('is unbounded when maxSize is omitted, 0, Infinity, or negative', () => {
    for (const maxSize of [undefined, 0, Number.POSITIVE_INFINITY, -1, Number.NaN] as const) {
      const coll = new LimitedCollection<string, number>(maxSize === undefined ? {} : { maxSize });
      expect(coll.bounded).toBe(false);
      for (let i = 0; i < 5; i++) coll.set(`k${i}`, i);
      expect(coll.size).toBe(5);
    }
  });

  it('FIFO-evicts the oldest key when inserting a new key at capacity', () => {
    const evicted: Array<[string, number]> = [];
    const coll = new LimitedCollection<string, number>({
      maxSize: 2,
      onEvict: (k, v) => evicted.push([k, v]),
    });
    coll.set('a', 1);
    coll.set('b', 2);
    coll.set('c', 3);
    expect([...coll.keys()]).toEqual(['b', 'c']);
    expect(evicted).toEqual([['a', 1]]);
  });

  it('does not evict when updating an existing key', () => {
    const onEvict = vi.fn();
    const coll = new LimitedCollection<string, number>({ maxSize: 2, onEvict });
    coll.set('a', 1);
    coll.set('b', 2);
    coll.set('a', 10);
    expect(onEvict).not.toHaveBeenCalled();
    expect(coll.get('a')).toBe(10);
    expect(coll.size).toBe(2);
  });

  it('sweep removes matching entries without calling onEvict', () => {
    const onEvict = vi.fn();
    const coll = new LimitedCollection<string, number>({ maxSize: 10, onEvict });
    coll.set('a', 1);
    coll.set('b', 2);
    coll.set('c', 3);
    expect(coll.sweep((v) => v % 2 === 1)).toBe(2);
    expect([...coll.keys()]).toEqual(['b']);
    expect(onEvict).not.toHaveBeenCalled();
  });

  it('sweep with no filter clears the collection', () => {
    const coll = new LimitedCollection<string, number>({ maxSize: 10 });
    coll.set('a', 1);
    coll.set('b', 2);
    expect(coll.sweep()).toBe(2);
    expect(coll.size).toBe(0);
  });

  it('clone returns a LimitedCollection with the same maxSize and copied entries', () => {
    const coll = new LimitedCollection<string, number>({ maxSize: 3 });
    coll.set('a', 1);
    const cloned = coll.clone();
    expect(cloned).toBeInstanceOf(LimitedCollection);
    expect(cloned.maxSize).toBe(3);
    expect(cloned.get('a')).toBe(1);
    cloned.set('b', 2);
    expect(coll.has('b')).toBe(false);
  });

  it('filter returns an unbounded Collection (safe subclass construction)', () => {
    const coll = new LimitedCollection<string, number>({ maxSize: 2 });
    coll.set('a', 1);
    coll.set('b', 2);
    const filtered = coll.filter((v) => v === 1);
    expect(filtered).toBeInstanceOf(Collection);
    expect(filtered).not.toBeInstanceOf(LimitedCollection);
    expect(filtered.size).toBe(1);
  });

  it('does not re-enter FIFO eviction while onEvict runs', () => {
    const onEvict = vi.fn();
    const coll = new LimitedCollection<string, number>({
      maxSize: 2,
      onEvict: (key, value) => {
        onEvict(key, value);
        // Re-entrant set during eviction must not cascade further FIFO deletes.
        coll.set('reenter', 99);
      },
    });
    coll.set('a', 1);
    coll.set('b', 2);
    coll.set('c', 3);
    expect(onEvict).toHaveBeenCalledTimes(1);
    expect(coll.has('a')).toBe(false);
    expect(coll.has('reenter')).toBe(true);
  });

  it('floors fractional maxSize', () => {
    const coll = new LimitedCollection<string, number>({ maxSize: 2.9 });
    expect(coll.maxSize).toBe(2);
    coll.set('a', 1);
    coll.set('b', 2);
    coll.set('c', 3);
    expect(coll.size).toBe(2);
  });
});
