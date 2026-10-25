/**
 * Simple in-memory IP rate limiter for auth endpoints (10 attempts / 15 min / IP).
 * Resets on process restart; documented in README.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

type Entry = { count: number; windowStart: number };

const store = new Map<string, Entry>();

export function checkAuthRateLimit(ip: string): { ok: true } | { ok: false } {
  const now = Date.now();
  const entry = store.get(ip);
  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    store.set(ip, { count: 1, windowStart: now });
    return { ok: true };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return { ok: false };
  }
  entry.count += 1;
  return { ok: true };
}

export function resetAuthRateLimit(ip: string): void {
  store.delete(ip);
}

export const AUTH_RATE_LIMIT = {
  maxAttempts: MAX_ATTEMPTS,
  windowMs: WINDOW_MS,
};
