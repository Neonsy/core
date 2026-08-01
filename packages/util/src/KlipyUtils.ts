import { EmbedMediaFlags } from '@fluxerjs/types';
import { asRecord } from './Predicates.js';

/** Result for embed media: url and optional flags. */
export interface KlipyMediaResult {
  url: string;
  flags?: number;
}

const KLIPY_HOST = /(?:^|\.)klipy\.com$/i;
const KLIPY_PATH = /^\/(?:gifs|clips|stickers|ai-gifs|static-memes)(?:\/|$)/i;

/**
 * Resolve a Klipy view URL to a direct GIF URL for embeds.
 * Prefers JSON-LD / Open Graph from the page; falls back to oEmbed thumbnail → `.gif`.
 */
export async function resolveKlipyToImageUrl(
  klipyViewUrl: string,
): Promise<KlipyMediaResult | null> {
  if (typeof klipyViewUrl !== 'string' || !isKlipyViewUrl(klipyViewUrl)) return null;

  try {
    const pageRes = await fetch(klipyViewUrl, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FluxerSDK/1.0)' },
    });
    if (pageRes.ok) {
      const html = await pageRes.text();
      const gifUrl =
        extractGifUrlFromJsonLd(extractJsonLd(html)) ?? extractGifUrlFromOpenGraph(html);
      if (gifUrl) {
        return { url: gifUrl, flags: EmbedMediaFlags.IS_ANIMATED };
      }
    }
  } catch {
    // Fall through to oEmbed
  }

  try {
    const oembedUrl = `https://klipy.com/oembed?url=${encodeURIComponent(klipyViewUrl)}`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const thumb =
      typeof data === 'object' &&
      data !== null &&
      'thumbnail_url' in data &&
      typeof (data as { thumbnail_url: unknown }).thumbnail_url === 'string'
        ? (data as { thumbnail_url: string }).thumbnail_url
        : undefined;
    const gifUrl = deriveGifFromMediaUrl(thumb) ?? (thumb && isDirectGif(thumb) ? thumb : null);
    return gifUrl ? { url: gifUrl, flags: EmbedMediaFlags.IS_ANIMATED } : null;
  } catch {
    return null;
  }
}

function isKlipyViewUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!KLIPY_HOST.test(parsed.hostname)) return false;
    return KLIPY_PATH.test(parsed.pathname);
  } catch {
    return false;
  }
}

function isDirectGif(url: string): boolean {
  return /\.gif($|\?)/i.test(url);
}

function isKlipyMediaUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    // Media delivery hosts from https://docs.klipy.com/network-requirements
    return (
      host === 'klipy.com' || host === 'static.klipy.com' || /^static\d+\.klipy\.com$/.test(host)
    );
  } catch {
    return false;
  }
}

function extractGifUrlFromJsonLd(jsonLd: Record<string, unknown> | null): string | null {
  if (!jsonLd) return null;
  const image = asRecord(jsonLd.image);
  const video = asRecord(jsonLd.video);
  const thumbnailUrl =
    asString(jsonLd.thumbnailUrl) ?? asString(image?.thumbnailUrl) ?? asString(image?.url);
  const contentUrl =
    asString(jsonLd.contentUrl) ?? asString(image?.contentUrl) ?? asString(video?.contentUrl);
  if (contentUrl && isDirectGif(contentUrl)) return contentUrl;
  if (contentUrl && isKlipyMediaUrl(contentUrl)) {
    return deriveGifFromMediaUrl(contentUrl) ?? contentUrl;
  }
  if (thumbnailUrl) return deriveGifFromMediaUrl(thumbnailUrl);
  return null;
}

function extractGifUrlFromOpenGraph(html: string): string | null {
  const ogImage =
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1] ??
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(html)?.[1];
  if (!ogImage) return null;
  if (isDirectGif(ogImage)) return ogImage;
  return deriveGifFromMediaUrl(ogImage);
}

function deriveGifFromMediaUrl(mediaUrl: string | undefined): string | null {
  if (!mediaUrl || !isKlipyMediaUrl(mediaUrl)) return null;
  if (isDirectGif(mediaUrl)) return mediaUrl;
  const gifUrl = mediaUrl.replace(/\.(png|jpg|jpeg|webp)(\?|$)/i, '.gif$2');
  return gifUrl !== mediaUrl ? gifUrl : null;
}

function extractJsonLd(html: string): Record<string, unknown> | null {
  const scripts = [
    ...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];
  for (const match of scripts) {
    if (!match[1]) continue;
    try {
      const parsed: unknown = JSON.parse(match[1].trim());
      const record = asRecord(parsed);
      if (record) return record;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const r = asRecord(item);
          if (r) return r;
        }
      }
    } catch {
      // try next script
    }
  }
  return null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
