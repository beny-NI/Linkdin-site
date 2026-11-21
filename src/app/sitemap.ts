import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";

// Always reflect the current DB (new profiles/stories appear without a rebuild).
export const dynamic = "force-dynamic";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/discover", priority: 0.9, changeFrequency: "daily" },
  { path: "/expertise", priority: 0.7, changeFrequency: "weekly" },
  { path: "/industries", priority: 0.7, changeFrequency: "weekly" },
  { path: "/collections", priority: 0.7, changeFrequency: "weekly" },
  { path: "/magazine", priority: 0.8, changeFrequency: "daily" },
  { path: "/about", priority: 0.4, changeFrequency: "yearly" },
  { path: "/get-featured", priority: 0.5, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: absoluteUrl(r.path),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  try {
    const [professionals, stories, collections, expertise, industries] = await Promise.all([
      db.professional.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
      db.story.findMany({ where: { published: true }, select: { slug: true, publicationDate: true } }),
      db.collection.findMany({ where: { published: true }, select: { slug: true, createdAt: true } }),
      db.expertise.findMany({ select: { slug: true } }),
      db.industry.findMany({ select: { slug: true } }),
    ]);

    for (const p of professionals)
      entries.push({ url: absoluteUrl(`/professionals/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly", priority: 0.8 });
    for (const s of stories)
      entries.push({ url: absoluteUrl(`/magazine/${s.slug}`), lastModified: s.publicationDate, changeFrequency: "monthly", priority: 0.7 });
    for (const c of collections)
      entries.push({ url: absoluteUrl(`/collections/${c.slug}`), lastModified: c.createdAt, changeFrequency: "weekly", priority: 0.6 });
    for (const e of expertise)
      entries.push({ url: absoluteUrl(`/expertise/${e.slug}`), changeFrequency: "weekly", priority: 0.5 });
    for (const i of industries)
      entries.push({ url: absoluteUrl(`/industries/${i.slug}`), changeFrequency: "weekly", priority: 0.5 });
  } catch (err) {
    // DB unavailable: still serve the static part instead of a 500
    console.error("[sitemap] database error", err);
  }

  return entries;
}
