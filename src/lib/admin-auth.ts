import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * Admin authentication for the SkilledSphere control panel.
 *
 * .env variables:
 *   ADMIN_EMAIL=you@example.com
 *   ADMIN_PASSWORD=a-long-password
 *   ADMIN_SESSION_SECRET=<random string, 32+ chars>   (signs the login cookie)
 *   ADMIN_TOKEN=<optional, 16+ chars>                  (old Bearer-token access for scripts)
 *
 * The login cookie is httpOnly + signed (HMAC-SHA256) + expires after 7 days.
 * This is a stop-gap until a real multi-user auth (NextAuth etc.) is added.
 */

export const SESSION_COOKIE = "ss_admin";
const SESSION_TTL_SEC = 60 * 60 * 24 * 7;

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SEC,
};

function sha(value: string) {
  return createHash("sha256").update(value).digest();
}

function safeEqual(a: string, b: string) {
  return timingSafeEqual(sha(a), sha(b));
}

function sessionSecret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

/** True when ADMIN_EMAIL, ADMIN_PASSWORD and a strong ADMIN_SESSION_SECRET are set. */
export function adminConfigured(): boolean {
  return !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && sessionSecret());
}

export function checkCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword) return false;
  // evaluate both comparisons so timing does not reveal which one failed
  const okEmail = safeEqual(email.trim().toLowerCase(), expectedEmail.trim().toLowerCase());
  const okPassword = safeEqual(password, expectedPassword);
  return okEmail && okPassword;
}

export function createSessionToken(): string {
  const secret = sessionSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is missing or shorter than 32 characters");
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC })
  ).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const secret = sessionSecret();
  if (!secret) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof exp === "number" && exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

/** For server components / layouts. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    const hosts = [req.headers.get("x-forwarded-host"), req.headers.get("host")].filter(Boolean);
    return hosts.includes(originHost);
  } catch {
    return false;
  }
}

/**
 * Guard for every /api/admin/* route.
 * Returns a NextResponse when the request must be rejected, otherwise null.
 * Accepts the login cookie, or (for scripts) `Authorization: Bearer <ADMIN_TOKEN>`.
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  if (verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) {
    const mutating = req.method !== "GET" && req.method !== "HEAD";
    if (mutating && !sameOrigin(req)) {
      return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
    }
    return null;
  }

  const token = process.env.ADMIN_TOKEN;
  if (token && token.length >= 16) {
    const header = req.headers.get("authorization") ?? "";
    const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (provided && safeEqual(provided, token)) return null;
  }

  if (!adminConfigured() && !(token && token.length >= 16)) {
    // fail closed: never expose admin endpoints with missing / weak configuration
    return NextResponse.json({ error: "Admin is disabled (set ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET in .env)" }, { status: 503 });
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
