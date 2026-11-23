import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { parseBody, serverError } from "@/lib/admin-server";
import { globeSchema } from "@/lib/admin-schemas";

export const dynamic = "force-dynamic";

/**
 * GET                -> every country with how many people it has and how many are chosen
 * GET ?country=DE    -> the published people of that country + the chosen ids (ordered)
 */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const code = req.nextUrl.searchParams.get("country")?.toUpperCase();

  try {
    if (!code) {
      const countries = await db.country.findMany({
        orderBy: { name: "asc" },
        include: {
          professionals: { where: { published: true }, select: { countryFeatured: true } },
        },
      });
      return NextResponse.json({
        countries: countries.map((c) => ({
          code: c.code,
          name: c.name,
          flag: c.flag,
          total: c.professionals.length,
          chosen: c.professionals.filter((p) => p.countryFeatured).length,
        })),
      });
    }

    const people = await db.professional.findMany({
      where: { countryCode: code, published: true },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, professionalTitle: true, portraitUrl: true, countryFeatured: true, countryOrder: true, country: { select: { flag: true } } },
    });
    const chosen = people.filter((p) => p.countryFeatured).sort((a, b) => a.countryOrder - b.countryOrder);
    return NextResponse.json({
      people: people.map((p) => ({
        id: p.id,
        fullName: p.fullName,
        professionalTitle: p.professionalTitle,
        portraitUrl: p.portraitUrl,
        published: true,
        flag: p.country.flag,
      })),
      chosen: chosen.map((p) => p.id),
    });
  } catch (err) {
    return serverError(err);
  }
}

/** PUT { country: "DE", ids: [...] } — ids ARE the order shown in the country panel (max 5). */
export async function PUT(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { data, error } = await parseBody(req, globeSchema);
  if (error) return error;

  const country = data.country.toUpperCase();
  const ids = Array.from(new Set(data.ids));

  try {
    await db.$transaction([
      db.professional.updateMany({ where: { countryCode: country }, data: { countryFeatured: false, countryOrder: 0 } }),
      ...ids.map((id, i) =>
        db.professional.updateMany({ where: { id, countryCode: country }, data: { countryFeatured: true, countryOrder: i } })
      ),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
