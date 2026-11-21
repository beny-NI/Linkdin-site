import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { serializeApplication } from "@/lib/application-serialize";

export const dynamic = "force-dynamic";

const patchSchema = z
  .object({
    status: z.enum(["pending", "in-review", "approved", "declined"]).optional(),
    editorialNotes: z.string().max(5000).nullable().optional(),
  })
  .refine((v) => v.status !== undefined || v.editorialNotes !== undefined, {
    message: "Provide status and/or editorialNotes",
  });

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  const app = await db.featuredApplication.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serializeApplication(app), { headers: { "Cache-Control": "no-store" } });
}

/** PATCH { "status": "approved", "editorialNotes": "Great fit for the AI collection" } */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const { id } = await params;
  const exists = await db.featuredApplication.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.featuredApplication.update({ where: { id }, data: parsed.data });
  return NextResponse.json(serializeApplication(updated));
}
