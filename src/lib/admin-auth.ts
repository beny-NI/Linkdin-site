import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Minimal admin protection for /api/admin/*.
 * Send:  Authorization: Bearer <ADMIN_TOKEN>   (ADMIN_TOKEN lives in .env)
 *
 * This is a stop-gap until a real CMS / auth (Payload, NextAuth) is added.
 * Returns a NextResponse when the request must be rejected, otherwise null.
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || expected.length < 16) {
    // fail closed: never expose admin endpoints with a missing / weak token
    return NextResponse.json({ error: "Admin API is disabled (ADMIN_TOKEN not configured)" }, { status: 503 });
  }

  const header = req.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  // hash both sides -> equal length buffers -> constant-time comparison
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  if (!timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
  }
  return null;
}
