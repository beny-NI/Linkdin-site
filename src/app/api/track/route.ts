import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/admin-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BOT = /bot|crawl|spider|slurp|bing|facebookexternalhit|preview|headless|lighthouse|curl|wget|python|axios|go-http|monitor/i;

const empty = (status = 204) => new NextResponse(null, { status });

/**
 * Privacy-friendly page-view counter used by the admin dashboard.
 * No cookies, no stored IP: visitorHash = sha256(daily salt + ip + user-agent).
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`track:${ip}`, 120, 60_000).ok) return empty(429);

  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return empty();
  // do not count the admin's own visits
  if (verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) return empty();

  const body = (await req.json().catch(() => null)) as { path?: unknown; referrer?: unknown } | null;
  if (!body || typeof body.path !== "string") return empty(400);

  let pathname = body.path.split("?")[0].split("#")[0];
  if (!pathname.startsWith("/") || pathname.length > 200) return empty(400);
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return empty();
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, "");

  let referrer: string | null = null;
  if (typeof body.referrer === "string" && body.referrer) {
    try {
      const host = new URL(body.referrer).hostname.replace(/^www\./, "");
      const own = (req.headers.get("host") ?? "").split(":")[0].replace(/^www\./, "");
      if (host && host !== own) referrer = host.slice(0, 100);
    } catch {
      /* ignore malformed referrers */
    }
  }

  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.ADMIN_SESSION_SECRET ?? "skilledsphere";
  const visitorHash = createHash("sha256").update(`${salt}|${day}|${ip}|${ua}`).digest("hex").slice(0, 32);
  const device = /Mobi|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";

  try {
    await db.pageView.create({ data: { path: pathname, visitorHash, referrer, device } });
  } catch (err) {
    console.error("[track]", err);
  }
  return empty();
}
