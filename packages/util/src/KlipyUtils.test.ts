import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveKlipyToImageUrl } from './KlipyUtils.js';

/** Klipy serves GIFs from static*.klipy.com (see docs.klipy.com/network-requirements). */
const STATIC_GIF = 'https://static.klipy.com/gifs/abc123/stressed.gif';
const STATIC_THUMB = 'https://static1.klipy.com/gifs/abc123/stressed.png';
const STATIC_FALLBACK_THUMB = 'https://static2.klipy.com/gifs/fallback/image.png';
const STATIC_OG_GIF = 'https://static.klipy.com/clips/fun.gif';

describe('resolveKlipyToImageUrl', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('klipy.com/gifs/')) {
          const html = `<html><script type="application/ld+json">
            {"@type":"VideoObject","contentUrl":"${STATIC_GIF}","thumbnailUrl":"${STATIC_THUMB}"}
          </script></html>`;
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(html),
          } as Response);
        }
        if (url.includes('oembed')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                thumbnail_url: STATIC_THUMB,
              }),
          } as Response);
        }
        return Promise.reject(new Error('Unexpected URL'));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null for empty or non-klipy URL', async () => {
    expect(await resolveKlipyToImageUrl('')).toBeNull();
    expect(await resolveKlipyToImageUrl('https://example.com')).toBeNull();
    expect(await resolveKlipyToImageUrl('https://tenor.com/view/123')).toBeNull();
    expect(await resolveKlipyToImageUrl('https://klipy.com/about')).toBeNull();
  });

  it('resolves GIF URL from klipy page JSON-LD', async () => {
    const result = await resolveKlipyToImageUrl('https://klipy.com/gifs/stressed-gif-123');
    expect(result).not.toBeNull();
    expect(result!.url).toBe(STATIC_GIF);
  });

  it('falls back to oEmbed when page fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('klipy.com/gifs/')) {
          return Promise.resolve({ ok: false });
        }
        if (url.includes('oembed')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                thumbnail_url: STATIC_FALLBACK_THUMB,
              }),
          } as Response);
        }
        return Promise.reject(new Error('Unexpected'));
      }),
    );
    const result = await resolveKlipyToImageUrl('https://klipy.com/gifs/test-123');
    expect(result).not.toBeNull();
    expect(result!.url).toBe('https://static2.klipy.com/gifs/fallback/image.gif');
  });

  it('resolves from Open Graph when JSON-LD is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('klipy.com/clips/')) {
          const html = `<html><meta property="og:image" content="${STATIC_OG_GIF}" /></html>`;
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(html),
          } as Response);
        }
        return Promise.reject(new Error('Unexpected'));
      }),
    );
    const result = await resolveKlipyToImageUrl('https://klipy.com/clips/fun-clip');
    expect(result).not.toBeNull();
    expect(result!.url).toBe(STATIC_OG_GIF);
  });
});
