import { FluxerAPIError, RateLimitError } from '@fluxerjs/rest';
import { FluxerError } from '../LibErrors/FluxerError.js';

/** Extract the HTTP status code from a REST error (or any object with `statusCode`). */
export function httpStatus(err: unknown): number | undefined {
  if (err instanceof FluxerAPIError) return err.statusCode;
  if (typeof err === 'object' && err !== null && 'statusCode' in err) {
    const code = (err as { statusCode?: unknown }).statusCode;
    return typeof code === 'number' ? code : undefined;
  }
  return undefined;
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err.length > 0) return err;
  return fallback;
}

/** Map REST failures to coded {@link FluxerError} while preserving `cause`. */
export function rethrowMapped(
  err: unknown,
  options: {
    notFound?: { code: string; message: string };
    fallback: string;
    code?: string;
  },
): never {
  if (err instanceof RateLimitError) throw err;
  if (options.notFound && httpStatus(err) === 404) {
    throw new FluxerError(options.notFound.message, {
      code: options.notFound.code,
      cause: err,
    });
  }
  if (err instanceof FluxerError) throw err;
  throw new FluxerError(errorMessage(err, options.fallback), {
    code: options.code,
    cause: err,
  });
}

/** Build a `?key=value` query string, skipping `null`/`undefined`/empty values. Returns `''` when empty. */
export function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') search.set(key, String(value));
  }
  const out = search.toString();
  return out ? `?${out}` : '';
}
