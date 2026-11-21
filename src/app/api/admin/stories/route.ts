import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { dateOnlyToUtc, parseBody, readingMinutesFor, serverError } from "@/lib/admin-server";
import { storySchema } from "@/lib/admin-schemas";
import { uniqueSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 100);
  const status = sp.get("status") ?? "all";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "20", 10) || 20));

  const where: Prisma.StoryWhereInput = {};
  if (status === "archived") where.archived = true;
  else {
    where.archived = false;
    if (status === "published") where.published = true;
    if (status === "draft") where.published = false;
  }
  if (q) where.OR = [{ title: { contains: q } }, { subtitle: { contains: q } }, { author: { contains: q } }];

  try {
    const [rows, total] = await Promise.all([
      db.story.findMany({
        where,
        orderBy: { publicationDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.story.count({ where }),
    ]);
    return NextResponse.json({
      items: rows.map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        category: s.category,
        author: s.author,
        coverUrl: s.coverUrl,
        publicationDate: s.publicationDate.toISOString(),
        published: s.published,
        homeFeatured: s.homeFeatured,
        archived: s.archived,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { data, error } = await parseBody(req, storySchema);
  if (error) return error;

  const publicationDate = dateOnlyToUtc(data.publicationDate) ?? new Date(data.publicationDate);
  if (Number.isNaN(publicationDate.getTime())) {
    return NextResponse.json({ error: "publicationDate: invalid date" }, { status: 422 });
  }

  try {
    const slug = data.slug
      ? data.slug
      : await uniqueSlug(data.title, async (s) => !!(await db.story.findUnique({ where: { slug: s }, select: { id: true } })), "story");
    if (data.slug && (await db.story.findUnique({ where: { slug }, select: { id: true } }))) {
      return NextResponse.json({ error: "This slug is already used" }, { status: 409 });
    }

    const created = await db.story.create({
      data: {
        slug,
        title: data.title,
        subtitle: data.subtitle,
        coverUrl: data.coverUrl,
        author: data.author,
        category: data.category,
        excerpt: data.excerpt,
        content: data.content,
        readingMinutes: data.readingMinutes ?? readingMinutesFor(data.content),
        publicationDate,
        published: data.published,
        relatedProfessionals: { create: data.professionalIds.map((professionalId) => ({ professionalId })) },
        relatedExpertise: { create: data.expertiseIds.map((expertiseId) => ({ expertiseId })) },
      },
      select: { id: true, slug: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
