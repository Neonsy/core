import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CACHE_LIMITS, normalizeCacheLimit, resolveCacheLimits } from './Options.js';

describe('normalizeCacheLimit', () => {
  it('floors positive finite values', () => {
    expect(normalizeCacheLimit(10, 5)).toBe(10);
    expect(normalizeCacheLimit(10.9, 5)).toBe(10);
  });

  it('treats 0 as unbounded', () => {
    expect(normalizeCacheLimit(0, 5)).toBe(Number.POSITIVE_INFINITY);
  });

  it('treats negative, NaN, and Infinity as unbounded', () => {
    expect(normalizeCacheLimit(-1, 5)).toBe(Number.POSITIVE_INFINITY);
    expect(normalizeCacheLimit(Number.NaN, 5)).toBe(Number.POSITIVE_INFINITY);
    expect(normalizeCacheLimit(Number.POSITIVE_INFINITY, 5)).toBe(Number.POSITIVE_INFINITY);
  });

  it('uses the fallback when the value is undefined', () => {
    expect(normalizeCacheLimit(undefined, 42)).toBe(42);
    expect(normalizeCacheLimit(undefined, 0)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('resolveCacheLimits', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies DEFAULT_CACHE_LIMITS when no input is provided', () => {
    const { limits, cache } = resolveCacheLimits();
    expect(limits.guilds).toBe(DEFAULT_CACHE_LIMITS.guilds);
    expect(limits.messages).toBe(DEFAULT_CACHE_LIMITS.messages);
    expect(cache.messages).toBe(DEFAULT_CACHE_LIMITS.messages);
    // roles/emojis/stickers default to 0 → unbounded once resolved.
    expect(limits.roles).toBe(Number.POSITIVE_INFINITY);
    expect(limits.emojis).toBe(Number.POSITIVE_INFINITY);
    expect(limits.stickers).toBe(Number.POSITIVE_INFINITY);
  });

  it('merges partial overrides over the defaults', () => {
    const { limits, cache } = resolveCacheLimits({ guilds: 3, members: 7 });
    expect(limits.guilds).toBe(3);
    expect(limits.members).toBe(7);
    expect(limits.channels).toBe(DEFAULT_CACHE_LIMITS.channels);
    expect(cache.guilds).toBe(3);
  });

  it('keeps messages: false as a disabled cache without warning', () => {
    const warn = vi.spyOn(process, 'emitWarning').mockImplementation(() => undefined);
    const { limits, cache } = resolveCacheLimits({ messages: false });
    expect(limits.messages).toBe(false);
    expect(cache.messages).toBe(false);
    expect(warn).not.toHaveBeenCalled();
  });

  it('treats messages: 0 as unbounded and warns about the legacy meaning', () => {
    const warn = vi.spyOn(process, 'emitWarning').mockImplementation(() => undefined);
    const { limits } = resolveCacheLimits({ messages: 0 });
    expect(limits.messages).toBe(Number.POSITIVE_INFINITY);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('messages: false'),
      expect.objectContaining({ code: 'FLUXER_CACHE_MESSAGES_ZERO' }),
    );
  });

  it('floors a positive messages limit', () => {
    const { limits } = resolveCacheLimits({ messages: 25.9 });
    expect(limits.messages).toBe(25);
  });
});
