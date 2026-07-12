/** Per-route rate limit state. Keep-alive fetch never bypasses this. */

export interface RateLimitState {
  limit: number;
  remaining: number;
  resetAt: number;
}

export class RateLimitManager {
  private readonly buckets = new Map<string, RateLimitState>();
  private globalResetAt = 0;
  private static readonly MAX_BUCKETS = 2_000;

  getBucket(route: string): RateLimitState | undefined {
    const state = this.buckets.get(route);
    if (state === undefined) return undefined;
    this.buckets.delete(route);
    this.buckets.set(route, state);
    return state;
  }

  setBucket(route: string, limit: number, remaining: number, resetAt: number): void {
    if (this.buckets.has(route)) this.buckets.delete(route);
    this.buckets.set(route, { limit, remaining, resetAt });
    this.prune();
  }

  setGlobalReset(resetAt: number): void {
    this.globalResetAt = resetAt;
  }

  getGlobalReset(): number {
    return this.globalResetAt;
  }

  /** Ms to wait before sending again (0 if clear). */
  getWaitTime(route: string): number {
    const now = Date.now();
    if (this.globalResetAt > 0 && this.globalResetAt <= now) this.globalResetAt = 0;
    const globalWait = this.globalResetAt > now ? this.globalResetAt - now : 0;

    const bucket = this.getBucket(route);
    if (bucket && bucket.resetAt <= now) {
      this.buckets.delete(route);
      return globalWait;
    }
    const bucketWait =
      bucket && bucket.remaining <= 0 && bucket.resetAt > now ? bucket.resetAt - now : 0;
    return Math.max(globalWait, bucketWait);
  }

  /** Apply X-RateLimit-* headers. 429 Retry-After is handled by RequestManager. */
  updateFromHeaders(route: string, headers: Headers): void {
    const limit = headers.get('X-RateLimit-Limit');
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');
    if (limit === null || remaining === null || reset === null) return;

    const limitN = Number.parseInt(limit, 10);
    const remainingN = Number.parseInt(remaining, 10);
    const resetSec = Number.parseInt(reset, 10);
    if (!Number.isFinite(limitN) || !Number.isFinite(remainingN) || !Number.isFinite(resetSec)) {
      return;
    }

    const resetAt = resetSec > 1e12 ? resetSec : resetSec * 1000;
    this.setBucket(route, limitN, remainingN, resetAt);
  }

  prune(): void {
    const now = Date.now();
    for (const [key, state] of this.buckets) {
      if (state.resetAt <= now) this.buckets.delete(key);
    }
    while (this.buckets.size > RateLimitManager.MAX_BUCKETS) {
      const oldest = this.buckets.keys().next().value;
      if (oldest === undefined) break;
      this.buckets.delete(oldest);
    }
  }

  get size(): number {
    return this.buckets.size;
  }
}
