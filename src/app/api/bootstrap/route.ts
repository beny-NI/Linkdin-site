import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { professionalInclude, storyInclude, toProfessionalCard, toProfessionalDetail, toStoryCard } from "@/lib/serialize";
import type { BootstrapDTO, CollectionCardDTO, ExpertiseDTO } from "@/lib/types";

// "Today's featured professional" depends on the date, so this stays dynamic;
// the CDN/browser cache below absorbs the traffic instead.
export const dynamic = "force-dynamic";

const COLLECTION_PREVIEW_MEMBERS = 8;
// Cards in the home-page hero carousel (today's featured + the rest).
const HERO_CARD_COUNT = 5;

export async function GET() {
  const endOfToday = endOfTodayUtc();

  // ONE parallel round-trip (previously: 7 in parallel + 1 sequential + 1 more at the end).
  const [
    countriesRaw,
    expertiseRaw,
    industriesRaw,
    collectionsRaw,
    storiesRaw,
    professionalCount,
    storyCount,
    currentFeatured,
    upcoming,
  ] = await Promise.all([
    db.country.findMany({
      include: { _count: { select: { professionals: { where: { published: true } } } } },
      orderBy: { name: "asc" },
    }),
    db.expertise.findMany({
      include: { _count: { select: { professionals: { where: { professional: { is: { published: true } } } } } } },
      orderBy: { order: "asc" },
    }),
    db.industry.findMany({
      include: { _count: { select: { professionals: { where: { professional: { is: { published: true } } } } } } },
      orderBy: { order: "asc" },
    }),
    db.collection.findMany({
      where: { published: true },
      include: {
        _count: { select: { members: true } },
        // only the preview members are loaded (was: every member of every collection)
        members: {
          orderBy: { order: "asc" },
          take: COLLECTION_PREVIEW_MEMBERS,
          include: { professional: { include: professionalInclude } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.story.findMany({
      where: { published: true },
      include: storyInclude,
      orderBy: { publicationDate: "desc" },
      take: 6,
    }),
    db.professional.count({ where: { published: true } }),
    db.story.count({ where: { published: true } }),
    db.featuredSchedule.findFirst({
      where: { active: true, featuredDate: { lte: endOfToday } },
      include: { professional: { include: professionalInclude } },
      orderBy: { featuredDate: "desc" },
    }),
    db.featuredSchedule.findMany({
      where: { active: true, featuredDate: { gt: endOfToday } },
      include: { professional: { include: professionalInclude } },
      orderBy: { featuredDate: "asc" },
      take: HERO_CARD_COUNT - 1,
    }),
  ]);

  const countries = countriesRaw.map((c) => ({
    code: c.code,
    name: c.name,
    flag: c.flag,
    latitude: c.latitude,
    longitude: c.longitude,
    professionalCount: c._count.professionals,
  }));

  // expertise tree
  const expById = new Map(expertiseRaw.map((e) => [e.id, e]));
  const tree: ExpertiseDTO[] = [];
  const dtoById = new Map<string, ExpertiseDTO>();
  for (const e of expertiseRaw) {
    dtoById.set(e.id, {
      id: e.id,
      slug: e.slug,
      name: e.name,
      description: e.description,
      cluster: e.cluster,
      order: e.order,
      parentSlug: e.parentId ? expById.get(e.parentId)?.slug ?? null : null,
      children: [],
      professionalCount: e._count.professionals,
    });
  }
  for (const e of expertiseRaw) {
    const dto = dtoById.get(e.id)!;
    if (e.parentId && dtoById.has(e.parentId)) {
      dtoById.get(e.parentId)!.children.push(dto);
    } else {
      tree.push(dto);
    }
  }

  const industries = industriesRaw.map((i) => ({
    slug: i.slug,
    name: i.name,
    description: i.description,
    professionalCount: i._count.professionals,
  }));

  const collections: CollectionCardDTO[] = collectionsRaw.map((c) => ({
    slug: c.slug,
    title: c.title,
    description: c.description,
    coverUrl: c.coverUrl,
    kind: c.kind,
    edition: c.edition,
    memberCount: c._count.members,
    members: c.members.map((m) => toProfessionalCard(m.professional)),
  }));

  // If fewer than HERO_CARD_COUNT people are scheduled, top the carousel up with
  // other published professionals so it always has enough cards.
  const missing = currentFeatured ? HERO_CARD_COUNT - 1 - upcoming.length : 0;
  const heroExtras =
    currentFeatured && missing > 0
      ? await db.professional.findMany({
          where: {
            published: true,
            id: {
              notIn: [currentFeatured.professionalId, ...upcoming.map((u) => u.professionalId)],
            },
          },
          include: professionalInclude,
          orderBy: { createdAt: "asc" },
          take: missing,
        })
      : [];

  const featured = currentFeatured
    ? {
        label: currentFeatured.label,
        date: currentFeatured.featuredDate.toISOString(),
        // bug fix: the label shown on the card is the label of TODAY's schedule,
        // not whichever schedule row of that person happened to be first.
        professional: {
          ...toProfessionalDetail({
            ...currentFeatured.professional,
            featuredSchedules: [
              {
                label: currentFeatured.label,
                featuredDate: currentFeatured.featuredDate,
                active: currentFeatured.active,
              },
            ],
          }),
        },
        upcoming: [
          ...upcoming.map((u) => ({
            date: u.featuredDate.toISOString() as string | null,
            professional: toProfessionalCard(u.professional),
          })),
          ...heroExtras.map((p) => ({
            date: null as string | null,
            professional: toProfessionalCard(p),
          })),
        ],
      }
    : null;

  const payload: BootstrapDTO = {
    featured,
    countries,
    expertiseTree: tree,
    industries,
    collections,
    stories: storiesRaw.map(toStoryCard),
    stats: {
      professionals: professionalCount,
      countries: countries.length,
      stories: storyCount,
      collections: collections.length,
      expertise: expertiseRaw.length,
    },
  };

  return NextResponse.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}

function endOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d;
}