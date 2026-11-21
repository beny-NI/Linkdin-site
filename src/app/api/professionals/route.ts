import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { professionalInclude, toProfessionalCard } from "@/lib/serialize";
import { rankBy, scoreFields } from "@/lib/search-score";
import type { Paginated, ProfessionalCardDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

const SORTS = ["relevance", "name", "newest"] as const;
type Sort = (typeof SORTS)[number];
const RELEVANCE_CANDIDATE_CAP = 500;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q")?.trim() ?? "").slice(0, 100);
  const country = sp.get("country")?.trim() ?? "";
  const expertise = sp.get("expertise")?.trim() ?? "";
  const industry = sp.get("industry")?.trim() ?? "";
  const collection = sp.get("collection")?.trim() ?? "";
  const requestedSort = sp.get("sort") ?? "relevance";
  const sort: Sort = (SORTS as readonly string[]).includes(requestedSort) ? (requestedSort as Sort) : "relevance";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(24, Math.max(3, parseInt(sp.get("pageSize") ?? "9", 10) || 9));

  const where: Prisma.ProfessionalWhereInput = { published: true };
  if (q) {
    where.OR = [
      { fullName: { contains: q } },
      { professionalTitle: { contains: q } },
      { summary: { contains: q } },
      { city: { contains: q } },
      { organization: { contains: q } },
      { country: { name: { contains: q } } },
      { expertise: { some: { expertise: { name: { contains: q } } } } },
      { industries: { some: { industry: { name: { contains: q } } } } },
    ];
  }
  if (country) where.countryCode = country;
  if (expertise) where.expertise = { some: { expertise: { slug: expertise } } };
  if (industry) where.industries = { some: { industry: { slug: industry } } };
  if (collection) where.collections = { some: { collection: { slug: collection } } };

  const total = await db.professional.count({ where });
  let rows;

  if (sort === "relevance" && q) {
    // Real relevance ranking: score a bounded candidate set, then page over the ranked ids.
    const candidates = await db.professional.findMany({
      where,
      take: RELEVANCE_CANDIDATE_CAP,
      select: {
        id: true,
        fullName: true,
        professionalTitle: true,
        summary: true,
        city: true,
        organization: true,
        country: { select: { name: true } },
        expertise: { select: { expertise: { select: { name: true } } } },
        industries: { select: { industry: { select: { name: true } } } },
      },
    });

    const ranked = rankBy(
      candidates,
      (c) =>
        scoreFields(q, [
          { value: c.fullName, weight: 10 },
          { value: c.professionalTitle, weight: 6 },
          ...c.expertise.map((e) => ({ value: e.expertise.name, weight: 5 })),
          ...c.industries.map((i) => ({ value: i.industry.name, weight: 3 })),
          { value: c.organization, weight: 3 },
          { value: c.city, weight: 2 },
          { value: c.country.name, weight: 2 },
          { value: c.summary, weight: 1 },
        ]),
      (c) => c.fullName
    );

    const pageIds = ranked.slice((page - 1) * pageSize, page * pageSize).map((c) => c.id);
    const found = await db.professional.findMany({ where: { id: { in: pageIds } }, include: professionalInclude });
    const byId = new Map(found.map((f) => [f.id, f]));
    rows = pageIds.map((id) => byId.get(id)).filter((r): r is NonNullable<typeof r> => !!r);
  } else {
    const orderBy: Prisma.ProfessionalOrderByWithRelationInput =
      sort === "newest" ? { createdAt: "desc" } : { fullName: "asc" };
    rows = await db.professional.findMany({
      where,
      include: professionalInclude,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  const payload: Paginated<ProfessionalCardDTO> = {
    items: rows.map((r) => toProfessionalCard(r)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
  });
}
