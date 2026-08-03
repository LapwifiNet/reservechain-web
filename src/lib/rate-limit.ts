/**
 * Sliding-window rate limiter for the waitlist proxy route.
 *
 * Module-scoped by design: the web container is a single Next.js server
 * (docker-compose `web`), so one process holds one window set. A
 * multi-instance deployment would need a shared store (Redis) instead — the
 * API already throttles per visitor independently, so this module is the
 * first line of defence, not the only one.
 *
 * The map is pruned lazily: keys whose every hit has fallen out of the window
 * are dropped once the map grows past a threshold, so a flood of spoofed
 * addresses cannot grow memory without bound.
 */

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  now?: () => number;
}

const PRUNE_THRESHOLD = 10_000;

export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();
  private readonly windowMs: number;
  private readonly max: number;
  private readonly now: () => number;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.max = options.max;
    this.now = options.now ?? Date.now;
  }

  /**
   * Record a hit for `key`. Returns 0 when the hit is allowed, or the number
   * of seconds the caller should wait before retrying when it is blocked.
   * The blocked call does not consume anything — a client that keeps polling
   * stays blocked until the oldest hit in the window ages out.
   */
  check(key: string): number {
    const t = this.now();
    const cutoff = t - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((hit) => hit > cutoff);

    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      return Math.max(1, Math.ceil((recent[0] + this.windowMs - t) / 1000));
    }

    recent.push(t);
    this.hits.set(key, recent);
    this.prune(cutoff);
    return 0;
  }

  private prune(cutoff: number): void {
    if (this.hits.size < PRUNE_THRESHOLD) return;
    for (const [key, times] of this.hits) {
      if (!times.some((hit) => hit > cutoff)) this.hits.delete(key);
    }
  }
}
