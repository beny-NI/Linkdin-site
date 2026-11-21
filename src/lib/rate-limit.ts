/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * NOTE: state lives in the Node process. That is fine for a single server
 * (this project's `output: "standalone"` setup). If you scale to several
 * instances / serverless, swap the Map for Redis (e.g. Upstash) — the
 * `rateLimit()` signature can stay the same.
 */
const buckets = new Map<string, number[]>();
let lastSweep = Date.now();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();

  // sweep stale keys occasionally so the Map cannot grow forever
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, hits] of buckets) {
      if (!hits.length || now - hits[hits.length - 1] > windowMs) buckets.delete(k);
    }
  }

  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false as const, retryAfterSec: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true as const, remaining: limit - hits.length };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
