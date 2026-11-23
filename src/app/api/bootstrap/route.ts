import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { professionalInclude, storyInclude, toProfessionalCard, toProfessionalDetail, toStoryCard } from "@/lib/serialize";
import type { BootstrapDTO, CollectionCardDTO, ExpertiseDTO } from "@/lib/types";

// Dynamic so admin changes show up quickly; the CDN/browser cache below absorbs the traffic.
export const dynamic = "force-dynamic";

const COLLECTION_PREVIEW_MEMBERS = 8;
// The home-page hero shows the people chosen in Admin → Homepage (max 5, in that order).
const HERO_CARD_COUNT = 5;

export async function GET() {
  // ONE parallel round-trip (previously: 7 in parallel + 1 sequential + 1 more at the end).
  const [
    countriesRaw,
    expertiseRaw,
    industriesRaw,
    collectionsRaw,
    storiesRaw,
    professionalCount,
    storyCount,
    heroPinned,
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
      // admin-pinned collections first (Admin → Homepage), then the rest
      orderBy: [{ homeFeatured: "desc" }, { homeOrder: "asc" }, { createdAt: "asc" }],
    }),
    db.story.findMany({
      where: { published: true, archived: false },
      include: storyInclude,
      // admin-pinned stories first (Admin → Homepage), then the newest
      orderBy: [{ homeFeatured: "desc" }, { homeOrder: "asc" }, { publicationDate: "desc" }],
      take: 6,
    }),
    db.professional.count({ where: { published: true } }),
    db.story.count({ where: { published: true, archived: false } }),
    db.professional.findMany({
      where: { published: true, archived: false, homeFeatured: true },
      include: professionalInclude,
      orderBy: { homeOrder: "asc" },
      take: HERO_CARD_COUNT,
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

  // Nobody chosen yet? Fall back to the first published profiles so the hero is never empty.
  // (If 1-4 people are chosen, exactly those are shown.)
  const heroRaw =
    heroPinned.length > 0
      ? heroPinned
      : await db.professional.findMany({
          where: { published: true, archived: false },
          include: professionalInclude,
          orderBy: { createdAt: "asc" },
          take: HERO_CARD_COUNT,
        });
  const hero = heroRaw.map((p) => ({ ...toProfessionalDetail(p), isPotd: p.homePotd }));

  const payload: BootstrapDTO = {
    hero,
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

