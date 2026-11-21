import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { dateOnlyToUtc, parseBody, readingMinutesFor, serverError, toggleData } from "@/lib/admin-server";
import { storySchema, togglePatchSchema } from "@/lib/admin-schemas";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;

  try {
    const s = await db.story.findUnique({
      where: { id },
      include: { relatedProfessionals: true, relatedExpertise: true },
    });
    if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      id: s.id,
      slug: s.slug,
      title: s.title,
      subtitle: s.subtitle,
      coverUrl: s.coverUrl ?? "",
      author: s.author,
      category: s.category,
      excerpt: s.excerpt,
      content: s.content,
      readingMinutes: s.readingMinutes,
      publicationDate: s.publicationDate.toISOString().slice(0, 10),
      published: s.published,
      professionalIds: s.relatedProfessionals.map((r) => r.professionalId),
      expertiseIds: s.relatedExpertise.map((r) => r.expertiseId),
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;

  const { data, error } = await parseBody(req, storySchema);
  if (error) return error;

  const publicationDate = dateOnlyToUtc(data.publicationDate) ?? new Date(data.publicationDate);
  if (Number.isNaN(publicationDate.getTime())) {
    return NextResponse.json({ error: "publicationDate: invalid date" }, { status: 422 });
  }

  try {
    const existing = await db.story.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const slug = data.slug || existing.slug;
    if (slug !== existing.slug) {
      const clash = await db.story.findUnique({ where: { slug }, select: { id: true } });
      if (clash) return NextResponse.json({ error: "This slug is already used" }, { status: 409 });
    }

    const updated = await db.story.update({
      where: { id },
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
        ...(data.published ? { archived: false } : {}),
        relatedProfessionals: {
          deleteMany: {},
          create: data.professionalIds.map((professionalId) => ({ professionalId })),
        },
        relatedExpertise: {
          deleteMany: {},
          create: data.expertiseIds.map((expertiseId) => ({ expertiseId })),
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
    const exists = await db.story.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await db.story.update({
      where: { id },
      data: toggleData(data),
      select: { id: true, published: true, archived: true },
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
    const exists = await db.story.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.story.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
