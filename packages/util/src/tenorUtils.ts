import { EmbedMediaFlags } from '@fluxerjs/types';

/** Result for embed media: url and optional flags. */
export interface TenorMediaResult {
  url: string;
  flags?: number;
}

/**
 * Resolve a Tenor view URL to a direct GIF URL for embeds.
 * Prefers JSON-LD from the page; falls back to oEmbed thumbnail → `.gif`.
 */
export async function resolveTenorToImageUrl(
  tenorViewUrl: string,
): Promise<TenorMediaResult | null> {
  if (typeof tenorViewUrl !== 'string' || !tenorViewUrl.includes('tenor.com')) return null;

  try {
    const pageRes = await fetch(tenorViewUrl, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FluxerSDK/1.0)' },
    });
    if (pageRes.ok) {
      const html = await pageRes.text();
      const gifUrl = extractGifUrlFromJsonLd(extractTenorJsonLd(html));
      if (gifUrl) {
        return { url: gifUrl, flags: EmbedMediaFlags.IS_ANIMATED };
      }
    }
  } catch {
    // Fall through to oEmbed
  }

  try {
    const oembedUrl = `https://tenor.com/oembed?url=${encodeURIComponent(tenorViewUrl)}`;
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
    const gifUrl = deriveGifFromThumbnail(thumb);
    return gifUrl ? { url: gifUrl, flags: EmbedMediaFlags.IS_ANIMATED } : null;
  } catch {
    return null;
  }
}

function extractGifUrlFromJsonLd(jsonLd: Record<string, unknown> | null): string | null {
  if (!jsonLd) return null;
  const image = asRecord(jsonLd.image);
  const video = asRecord(jsonLd.video);
  const thumbnailUrl = asString(image?.thumbnailUrl) ?? asString(image?.url);
  const contentUrl = asString(image?.contentUrl) ?? asString(video?.contentUrl);
  if (contentUrl && /\.gif($|\?)/i.test(contentUrl)) return contentUrl;
  if (thumbnailUrl) return deriveGifFromThumbnail(thumbnailUrl);
  return null;
}

function deriveGifFromThumbnail(thumbUrl: string | undefined): string | null {
  if (!thumbUrl || !thumbUrl.includes('media.tenor.com')) return null;
  const gifUrl = thumbUrl.replace(/\.(png|jpg|jpeg|webp)(\?|$)/i, '.gif$2');
  return gifUrl !== thumbUrl ? gifUrl : null;
}

function extractTenorJsonLd(html: string): Record<string, unknown> | null {
  const re =
    /<script[^>]*class="dynamic"[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i;
  const alt =
    /<script[^>]*type="application\/ld\+json"[^>]*class="dynamic"[^>]*>([\s\S]*?)<\/script>/i;
  const match = re.exec(html) ?? alt.exec(html);
  if (!match?.[1]) return null;
  try {
    const parsed: unknown = JSON.parse(match[1].trim());
    return asRecord(parsed);
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
