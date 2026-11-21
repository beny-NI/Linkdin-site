import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { parseBody, serverError } from "@/lib/admin-server";
import { professionalSchema } from "@/lib/admin-schemas";
import { uniqueSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

/** GET /api/admin/professionals?q=&status=all|published|draft&page=1&pageSize=20 */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 100);
  const status = sp.get("status") ?? "all";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "20", 10) || 20));

  const where: Prisma.ProfessionalWhereInput = {};
  if (status === "archived") where.archived = true;
  else {
    where.archived = false;
    if (status === "published") where.published = true;
    if (status === "draft") where.published = false;
  }
  if (q) {
    where.OR = [
      { fullName: { contains: q } },
      { professionalTitle: { contains: q } },
      { city: { contains: q } },
      { organization: { contains: q } },
    ];
  }

  try {
    const [rows, total] = await Promise.all([
      db.professional.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { country: true },
      }),
      db.professional.count({ where }),
    ]);
    return NextResponse.json({
      items: rows.map((p) => ({
        id: p.id,
        slug: p.slug,
        fullName: p.fullName,
        professionalTitle: p.professionalTitle,
        portraitUrl: p.portraitUrl,
        city: p.city,
        country: { code: p.country.code, name: p.country.name, flag: p.country.flag },
        published: p.published,
        homeFeatured: p.homeFeatured,
        archived: p.archived,
        createdAt: p.createdAt.toISOString(),
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

  const { data, error } = await parseBody(req, professionalSchema);
  if (error) return error;

  try {
    const country = await db.country.findUnique({ where: { code: data.countryCode } });
    if (!country) {
      return NextResponse.json({ error: "Unknown country — add it under Taxonomy → Countries first" }, { status: 422 });
    }

    const slug = data.slug
      ? data.slug
      : await uniqueSlug(data.fullName, async (s) => !!(await db.professional.findUnique({ where: { slug: s }, select: { id: true } })), "person");
    if (data.slug && (await db.professional.findUnique({ where: { slug }, select: { id: true } }))) {
      return NextResponse.json({ error: "This slug is already used" }, { status: 409 });
    }

    const created = await db.professional.create({
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
        expertise: { create: data.expertiseIds.map((expertiseId) => ({ expertiseId })) },
        industries: { create: data.industryIds.map((industryId) => ({ industryId })) },
      },
      select: { id: true, slug: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
