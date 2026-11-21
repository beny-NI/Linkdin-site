import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { parseBody, serverError } from "@/lib/admin-server";
import { homepageSchema } from "@/lib/admin-schemas";

export const dynamic = "force-dynamic";

/** What is currently pinned to the homepage (ordered). */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const [professionals, collections, stories] = await Promise.all([
      db.professional.findMany({ where: { homeFeatured: true }, orderBy: { homeOrder: "asc" }, select: { id: true } }),
      db.collection.findMany({ where: { homeFeatured: true }, orderBy: { homeOrder: "asc" }, select: { id: true } }),
      db.story.findMany({ where: { homeFeatured: true }, orderBy: { homeOrder: "asc" }, select: { id: true } }),
    ]);
    return NextResponse.json({
      professionals: professionals.map((p) => p.id),
      collections: collections.map((c) => c.id),
      stories: stories.map((s) => s.id),
    });
  } catch (err) {
    return serverError(err);
  }
}

/** PUT { professionals: id[], collections: id[], stories: id[] } — the arrays ARE the homepage order. */
export async function PUT(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { data, error } = await parseBody(req, homepageSchema);
  if (error) return error;

  const uniq = (ids: string[]) => Array.from(new Set(ids));
  const professionals = uniq(data.professionals);
  const collections = uniq(data.collections);
  const stories = uniq(data.stories);

  try {
    await db.$transaction([
      db.professional.updateMany({ data: { homeFeatured: false, homeOrder: 0 } }),
      db.collection.updateMany({ data: { homeFeatured: false, homeOrder: 0 } }),
      db.story.updateMany({ data: { homeFeatured: false, homeOrder: 0 } }),
      ...professionals.map((id, i) =>
        db.professional.updateMany({ where: { id }, data: { homeFeatured: true, homeOrder: i } })
      ),
      ...collections.map((id, i) =>
        db.collection.updateMany({ where: { id }, data: { homeFeatured: true, homeOrder: i } })
      ),
      ...stories.map((id, i) => db.story.updateMany({ where: { id }, data: { homeFeatured: true, homeOrder: i } })),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
