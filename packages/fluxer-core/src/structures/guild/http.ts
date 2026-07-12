import { FluxerAPIError } from '@fluxerjs/rest';
import { CDN_URL } from '../../util/Constants.js';
import { FluxerError } from '../../errors/FluxerError.js';

export function httpStatus(err: unknown): number | undefined {
  if (err instanceof FluxerAPIError) return err.statusCode;
  if (typeof err === 'object' && err !== null && 'statusCode' in err) {
    const code = (err as { statusCode?: unknown }).statusCode;
    return typeof code === 'number' ? code : undefined;
  }
  return undefined;
}

export function rethrowNotFound(
  err: unknown,
  notFound: { code: string; message: string },
  fallback: string,
): never {
  if (httpStatus(err) === 404) {
    throw new FluxerError(notFound.message, { code: notFound.code, cause: err as Error });
  }
  throw err instanceof FluxerError ? err : new FluxerError(fallback, { cause: err as Error });
}

export function cdnURL(
  kind: 'icons' | 'banners' | 'splashes',
  id: string,
  hash: string | null,
  size?: number,
  mediaBase?: string,
): string | null {
  if (!hash) return null;
  const base = (mediaBase ?? CDN_URL).replace(/\/+$/, '');
  return `${base}/${kind}/${id}/${hash}.png${size ? `?size=${size}` : ''}`;
}

export function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') search.set(key, String(value));
  }
  const out = search.toString();
  return out ? `?${out}` : '';
}
