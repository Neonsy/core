/** Canonical docs site origin (no trailing slash). */
export const SITE_URL = 'https://fluxer.js.org';

/** Absolute URL with trailing slash (matches `trailingSlash: true`). */
export function absoluteUrl(pathname: string): string {
  const path = pathname === '/' ? '/' : pathname.replace(/\/?$/, '/');
  return new URL(path, `${SITE_URL}/`).href;
}
