import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { professionalInclude, storyInclude, toProfessionalCard, toStoryCard } from "@/lib/serialize";
import { rankBy, scoreFields } from "@/lib/search-score";
import type { SearchResultsDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

// Fetch a few more candidates than we return, rank them, keep the best.
const POOL = 25;

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q")?.trim() ?? "").slice(0, 100);
  if (!q || q.length < 2) {
    const empty: SearchResultsDTO = { professionals: [], expertise: [], industries: [], collections: [], stories: [] };
    return NextResponse.json(empty);
  }

  const [professionals, expertise, industries, collections, stories] = await Promise.all([
    db.professional.findMany({
      where: {
        published: true,
        OR: [
          { fullName: { contains: q } },
          { professionalTitle: { contains: q } },
          { summary: { contains: q } },
          { city: { contains: q } },
          { organization: { contains: q } },
          { country: { name: { contains: q } } },
          { expertise: { some: { expertise: { name: { contains: q } } } } },
          { industries: { some: { industry: { name: { contains: q } } } } },
        ],
      },
      include: professionalInclude,
      take: POOL,
    }),
    db.expertise.findMany({ where: { name: { contains: q } }, take: POOL }),
    db.industry.findMany({ where: { name: { contains: q } }, take: POOL }),
    db.collection.findMany({
      where: { published: true, title: { contains: q } },
      include: { _count: { select: { members: true } } },
      take: POOL,
    }),
    db.story.findMany({
      where: {
        published: true,
        OR: [{ title: { contains: q } }, { subtitle: { contains: q } }, { excerpt: { contains: q } }],
      },
      include: storyInclude,
      take: POOL,
    }),
  ]);

  const topPros = rankBy(
    professionals,
    (p) =>
      scoreFields(q, [
        { value: p.fullName, weight: 10 },
        { value: p.professionalTitle, weight: 6 },
        ...p.expertise.map((e) => ({ value: e.expertise.name, weight: 5 })),
        ...p.industries.map((i) => ({ value: i.industry.name, weight: 3 })),
        { value: p.organization, weight: 3 },
        { value: p.city, weight: 2 },
        { value: p.country.name, weight: 2 },
        { value: p.summary, weight: 1 },
      ]),
    (p) => p.fullName
  ).slice(0, 6);

  const topStories = rankBy(
    stories,
    (s) =>
      scoreFields(q, [
        { value: s.title, weight: 10 },
        { value: s.subtitle, weight: 4 },
        { value: s.excerpt, weight: 1 },
      ]),
    (s) => s.title
  ).slice(0, 4);

  const payload: SearchResultsDTO = {
    professionals: topPros.map((p) => toProfessionalCard(p)),
    expertise: rankBy(expertise, (e) => scoreFields(q, [{ value: e.name, weight: 1 }]), (e) => e.name)
      .slice(0, 5)
      .map((e) => ({ slug: e.slug, name: e.name, cluster: e.cluster })),
    industries: rankBy(industries, (i) => scoreFields(q, [{ value: i.name, weight: 1 }]), (i) => i.name)
      .slice(0, 5)
      .map((i) => ({ slug: i.slug, name: i.name })),
    collections: rankBy(collections, (c) => scoreFields(q, [{ value: c.title, weight: 1 }]), (c) => c.title)
      .slice(0, 4)
      .map((c) => ({ slug: c.slug, title: c.title, memberCount: c._count.members })),
    stories: topStories.map(toStoryCard),
  };
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
  });
}
