import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { serializeApplication } from "@/lib/application-serialize";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "in-review", "approved", "declined"] as const;

/** GET /api/admin/applications?status=pending&page=1&pageSize=20 */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "20", 10) || 20));

  const where = status && (STATUSES as readonly string[]).includes(status) ? { status } : {};
  const [rows, total] = await Promise.all([
    db.featuredApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.featuredApplication.count({ where }),
  ]);

  return NextResponse.json(
    { items: rows.map(serializeApplication), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    { headers: { "Cache-Control": "no-store" } }
  );
}
