import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { serverError } from "@/lib/admin-server";

export const dynamic = "force-dynamic";

/** Lists used by the admin forms (selects, pickers). */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const [countries, expertise, industries, professionals, stories, collections] = await Promise.all([
      db.country.findMany({ orderBy: { name: "asc" } }),
      db.expertise.findMany({ orderBy: [{ cluster: "asc" }, { order: "asc" }] }),
      db.industry.findMany({ orderBy: { order: "asc" } }),
      db.professional.findMany({
        where: { archived: false },
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true, professionalTitle: true, portraitUrl: true, published: true, country: { select: { flag: true } } },
      }),
      db.story.findMany({
        where: { archived: false },
        orderBy: { publicationDate: "desc" },
        select: { id: true, title: true, category: true, published: true },
      }),
      db.collection.findMany({
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, kind: true, published: true },
      }),
    ]);

    return NextResponse.json({
      countries: countries.map((c) => ({ code: c.code, name: c.name, flag: c.flag })),
      expertise: expertise.map((e) => ({ id: e.id, name: e.name, cluster: e.cluster })),
      industries: industries.map((i) => ({ id: i.id, name: i.name })),
      professionals: professionals.map((p) => ({
        id: p.id,
        fullName: p.fullName,
        professionalTitle: p.professionalTitle,
        portraitUrl: p.portraitUrl,
        published: p.published,
        flag: p.country.flag,
      })),
      stories,
      collections,
    });
  } catch (err) {
    return serverError(err);
  }
}
