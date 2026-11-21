import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { parseBody, serverError } from "@/lib/admin-server";
import { collectionSchema, togglePatchSchema } from "@/lib/admin-schemas";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;

  try {
    const c = await db.collection.findUnique({
      where: { id },
      include: { members: { orderBy: { order: "asc" } } },
    });
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      coverUrl: c.coverUrl ?? "",
      kind: c.kind,
      edition: c.edition ?? "",
      published: c.published,
      memberIds: c.members.map((m) => m.professionalId),
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;

  const { data, error } = await parseBody(req, collectionSchema);
  if (error) return error;

  try {
    const existing = await db.collection.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const slug = data.slug || existing.slug;
    if (slug !== existing.slug) {
      const clash = await db.collection.findUnique({ where: { slug }, select: { id: true } });
      if (clash) return NextResponse.json({ error: "This slug is already used" }, { status: 409 });
    }

    const memberIds = Array.from(new Set(data.memberIds));
    const updated = await db.collection.update({
      where: { id },
      data: {
        slug,
        title: data.title,
        description: data.description,
        coverUrl: data.coverUrl,
        kind: data.kind,
        edition: data.edition,
        published: data.published,
        members: {
          deleteMany: {},
          create: memberIds.map((professionalId, order) => ({ professionalId, order })),
        },
      },
      select: { id: true, slug: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;

  const { data, error } = await parseBody(req, togglePatchSchema);
  if (error) return error;

  try {
    const exists = await db.collection.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await db.collection.update({
      where: { id },
      data: { ...(data.published !== undefined ? { published: data.published } : {}) },
      select: { id: true, published: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;

  try {
    const exists = await db.collection.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.collection.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
