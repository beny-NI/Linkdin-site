import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { serverError } from "@/lib/admin-server";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function top<T extends string>(counts: Map<T, number>, n: number) {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

/** Real numbers only: counts come from the database, traffic from the PageView table. */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const since = new Date(todayStart.getTime() - 29 * DAY);

    const [
      professionalsTotal,
      professionalsPublished,
      storiesTotal,
      storiesPublished,
      collectionsTotal,
      collectionsPublished,
      countries,
      expertise,
      industries,
      applicationGroups,
      recentProfessionals,
      recentStories,
      views,
      heroSelected,
    ] = await Promise.all([
      db.professional.count({ where: { archived: false } }),
      db.professional.count({ where: { published: true } }),
      db.story.count({ where: { archived: false } }),
      db.story.count({ where: { published: true } }),
      db.collection.count(),
      db.collection.count({ where: { published: true } }),
      db.country.count(),
      db.expertise.count(),
      db.industry.count(),
      db.featuredApplication.groupBy({ by: ["status"], _count: { _all: true } }),
      db.professional.findMany({
        where: { archived: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, fullName: true, professionalTitle: true, portraitUrl: true, published: true, createdAt: true },
      }),
      db.story.findMany({
        where: { archived: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, category: true, published: true, createdAt: true },
      }),
      db.pageView.findMany({
        where: { createdAt: { gte: since } },
        select: { path: true, visitorHash: true, referrer: true, device: true, createdAt: true },
        take: 300_000,
      }),
      db.professional.count({ where: { published: true, homeFeatured: true } }),
    ]);

    // ---- traffic ------------------------------------------------------
    const days: { date: string; views: number; visitors: number }[] = [];
    const perDayVisitors = new Map<string, Set<string>>();
    const perDayViews = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const key = dayKey(new Date(since.getTime() + i * DAY));
      perDayVisitors.set(key, new Set());
      perDayViews.set(key, 0);
    }

    const pageCounts = new Map<string, number>();
    const referrerCounts = new Map<string, number>();
    const deviceCounts = { desktop: 0, mobile: 0 };
    const profileCounts = new Map<string, number>();
    const storyCounts = new Map<string, number>();
    const collectionCounts = new Map<string, number>();

    for (const v of views) {
      const key = dayKey(v.createdAt);
      if (perDayViews.has(key)) {
        perDayViews.set(key, (perDayViews.get(key) ?? 0) + 1);
        perDayVisitors.get(key)?.add(v.visitorHash);
      }
      pageCounts.set(v.path, (pageCounts.get(v.path) ?? 0) + 1);
      if (v.referrer) referrerCounts.set(v.referrer, (referrerCounts.get(v.referrer) ?? 0) + 1);
      if (v.device === "mobile") deviceCounts.mobile++;
      else deviceCounts.desktop++;

      const prof = /^\/professionals\/([^/]+)$/.exec(v.path);
      if (prof) profileCounts.set(prof[1], (profileCounts.get(prof[1]) ?? 0) + 1);
      const story = /^\/magazine\/([^/]+)$/.exec(v.path);
      if (story) storyCounts.set(story[1], (storyCounts.get(story[1]) ?? 0) + 1);
      const col = /^\/collections\/([^/]+)$/.exec(v.path);
      if (col) collectionCounts.set(col[1], (collectionCounts.get(col[1]) ?? 0) + 1);
    }

    for (const [date, count] of perDayViews) {
      days.push({ date, views: count, visitors: perDayVisitors.get(date)?.size ?? 0 });
    }

    const sum = (arr: typeof days, key: "views" | "visitors") => arr.reduce((a, d) => a + d[key], 0);
    const last7 = days.slice(-7);
    const today = days[days.length - 1];

    // names for the "top" lists
    const topProfiles = top(profileCounts, 5);
    const topStories = top(storyCounts, 5);
    const topCollections = top(collectionCounts, 5);
    const [profRows, storyRows, collRows] = await Promise.all([
      topProfiles.length
        ? db.professional.findMany({ where: { slug: { in: topProfiles.map(([s]) => s) } }, select: { slug: true, fullName: true } })
        : [],
      topStories.length
        ? db.story.findMany({ where: { slug: { in: topStories.map(([s]) => s) } }, select: { slug: true, title: true } })
        : [],
      topCollections.length
        ? db.collection.findMany({ where: { slug: { in: topCollections.map(([s]) => s) } }, select: { slug: true, title: true } })
        : [],
    ]);
    const profName = new Map(profRows.map((p) => [p.slug, p.fullName]));
    const storyName = new Map(storyRows.map((s) => [s.slug, s.title]));
    const collName = new Map(collRows.map((c) => [c.slug, c.title]));

    const applications = { pending: 0, "in-review": 0, approved: 0, declined: 0, total: 0 } as Record<string, number>;
    for (const g of applicationGroups) {
      applications[g.status] = g._count._all;
      applications.total += g._count._all;
    }

    return NextResponse.json({
      content: {
        professionals: { total: professionalsTotal, published: professionalsPublished },
        stories: { total: storiesTotal, published: storiesPublished },
        collections: { total: collectionsTotal, published: collectionsPublished },
        countries,
        expertise,
        industries,
      },
      applications,
      homepage: { heroSelected, heroMax: 5 },
      traffic: {
        trackingSince: views.length ? dayKey(views.reduce((a, b) => (a.createdAt < b.createdAt ? a : b)).createdAt) : null,
        today: { views: today.views, visitors: today.visitors },
        last7: { views: sum(last7, "views"), visitors: sum(last7, "visitors") },
        last30: { views: sum(days, "views"), visitors: sum(days, "visitors") },
        days,
        topPages: top(pageCounts, 8).map(([path, count]) => ({ path, count })),
        topProfiles: topProfiles.map(([slug, count]) => ({ slug, name: profName.get(slug) ?? slug, count })),
        topStories: topStories.map(([slug, count]) => ({ slug, name: storyName.get(slug) ?? slug, count })),
        topCollections: topCollections.map(([slug, count]) => ({ slug, name: collName.get(slug) ?? slug, count })),
        referrers: top(referrerCounts, 6).map(([host, count]) => ({ host, count })),
        devices: deviceCounts,
      },
      recent: {
        professionals: recentProfessionals.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
        stories: recentStories.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })),
      },
    });
  } catch (err) {
    return serverError(err);
  }
}
