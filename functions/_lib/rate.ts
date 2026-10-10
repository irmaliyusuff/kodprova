/**
 * A rate limit without identity: it limits how many submissions the service
 * writes per minute, whoever sends them. No IP, cookie or device data; the
 * counter lives in memory only.
 *
 * Best effort: each running copy (isolate) counts on its own and starts
 * again from zero when it is replaced. The firm upper bound is the daily cap
 * in the database (`DAILY_CAP`); this limit only slows down a sudden burst.
 */

export const RATE_WINDOW_MS = 60_000;
/** Far above real use: one person submits about one question per minute. */
export const RATE_LIMIT = 300;

export interface RateLimiter {
  /** May one more submission be written now? If so, it is counted. */
  allow(nowMs: number): boolean;
}

export function rateLimiter(
  limit: number = RATE_LIMIT,
  windowMs: number = RATE_WINDOW_MS,
): RateLimiter {
  let windowStart = 0;
  let count = 0;
  return {
    allow(nowMs) {
      if (nowMs - windowStart >= windowMs) {
        windowStart = nowMs;
        count = 0;
      }
      if (count >= limit) return false;
      count += 1;
      return true;
    },
  };
}
