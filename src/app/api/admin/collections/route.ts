import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { parseBody, serverError } from "@/lib/admin-server";
import { collectionSchema } from "@/lib/admin-schemas";
import { uniqueSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 100);
  const status = sp.get("status") ?? "all";

  const where: Prisma.CollectionWhereInput = {};
  if (status === "published") where.published = true;
  if (status === "draft") where.published = false;
  if (q) where.OR = [{ title: { contains: q } }, { description: { contains: q } }];

  try {
    const rows = await db.collection.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { members: true } } },
    });
    return NextResponse.json({
      items: rows.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        kind: c.kind,
        edition: c.edition,
        coverUrl: c.coverUrl,
        memberCount: c._count.members,
        published: c.published,
        homeFeatured: c.homeFeatured,
        createdAt: c.createdAt.toISOString(),
      })),
      total: rows.length,
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { data, error } = await parseBody(req, collectionSchema);
  if (error) return error;

  try {
    const slug = data.slug
      ? data.slug
      : await uniqueSlug(data.title, async (s) => !!(await db.collection.findUnique({ where: { slug: s }, select: { id: true } })), "collection");
    if (data.slug && (await db.collection.findUnique({ where: { slug }, select: { id: true } }))) {
      return NextResponse.json({ error: "This slug is already used" }, { status: 409 });
    }

    const memberIds = Array.from(new Set(data.memberIds));
    const created = await db.collection.create({
      data: {
        slug,
        title: data.title,
        description: data.description,
        coverUrl: data.coverUrl,
        kind: data.kind,
        edition: data.edition,
        published: data.published,
        members: { create: memberIds.map((professionalId, order) => ({ professionalId, order })) },
      },
      select: { id: true, slug: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
