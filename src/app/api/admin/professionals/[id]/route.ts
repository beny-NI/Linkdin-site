import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { parseBody, toggleData, parseJsonArray, serverError } from "@/lib/admin-server";
import { professionalSchema, togglePatchSchema } from "@/lib/admin-schemas";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;

  try {
    const p = await db.professional.findUnique({
      where: { id },
      include: { expertise: true, industries: true },
    });
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      id: p.id,
      slug: p.slug,
      fullName: p.fullName,
      professionalTitle: p.professionalTitle,
      summary: p.summary,
      biography: p.biography,
      portraitUrl: p.portraitUrl,
      city: p.city,
      organization: p.organization ?? "",
      countryCode: p.countryCode,
      achievements: parseJsonArray<string>(p.achievements),
      experience: parseJsonArray(p.experience),
      education: parseJsonArray(p.education),
      projects: parseJsonArray(p.projects),
      publications: parseJsonArray(p.publications),
      awards: parseJsonArray(p.awards),
      links: parseJsonArray(p.links),
      expertiseIds: p.expertise.map((e) => e.expertiseId),
      industryIds: p.industries.map((i) => i.industryId),
      published: p.published,
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;

  const { data, error } = await parseBody(req, professionalSchema);
  if (error) return error;

  try {
    const existing = await db.professional.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const country = await db.country.findUnique({ where: { code: data.countryCode } });
    if (!country) return NextResponse.json({ error: "Unknown country" }, { status: 422 });

    const slug = data.slug || existing.slug;
    if (slug !== existing.slug) {
      const clash = await db.professional.findUnique({ where: { slug }, select: { id: true } });
      if (clash) return NextResponse.json({ error: "This slug is already used" }, { status: 409 });
    }

    const updated = await db.professional.update({
      where: { id },
      data: {
        slug,
        fullName: data.fullName,
        professionalTitle: data.professionalTitle,
        summary: data.summary,
        biography: data.biography,
        portraitUrl: data.portraitUrl,
        city: data.city,
        organization: data.organization,
        countryCode: data.countryCode,
        achievements: JSON.stringify(data.achievements.filter(Boolean)),
        experience: JSON.stringify(data.experience),
        education: JSON.stringify(data.education),
        projects: JSON.stringify(data.projects),
        publications: JSON.stringify(data.publications),
        awards: JSON.stringify(data.awards),
        links: JSON.stringify(data.links.filter((l) => l.url)),
        published: data.published,
        ...(data.published ? { archived: false } : {}),
        expertise: { deleteMany: {}, create: data.expertiseIds.map((expertiseId) => ({ expertiseId })) },
        industries: { deleteMany: {}, create: data.industryIds.map((industryId) => ({ industryId })) },
      },
      select: { id: true, slug: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return serverError(err);
  }
}

/** PATCH { published?: boolean } — quick publish / unpublish from the list. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;

  const { data, error } = await parseBody(req, togglePatchSchema);
  if (error) return error;

  try {
    const exists = await db.professional.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await db.professional.update({
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
    const exists = await db.professional.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.professional.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
