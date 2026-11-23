import { NextRequest, NextResponse } from "next/server";
import worldCountries from "world-countries";
import { db } from "@/lib/db";
import { professionalInclude, toProfessionalCard } from "@/lib/serialize";

export const dynamic = "force-dynamic";

const COUNTRY_PANEL_MAX = 5;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const codeUpper = code.toUpperCase();
  const country = await db.country.findUnique({
    where: { code: codeUpper },
    include: {
      professionals: {
        where: { published: true },
        include: professionalInclude,
        // people chosen in Admin → Globe countries come first (in that order), then A–Z
        orderBy: [{ countryFeatured: "desc" }, { countryOrder: "asc" }, { fullName: "asc" }],
      },
    },
  });

  if (country) {
    return NextResponse.json({
      code: country.code,
      name: country.name,
      flag: country.flag,
      latitude: country.latitude,
      longitude: country.longitude,
      // the panel on the globe lists at most COUNTRY_PANEL_MAX people; `total` is the real number
      total: country.professionals.length,
      professionals: country.professionals.slice(0, COUNTRY_PANEL_MAX).map((p) => toProfessionalCard(p)),
    });
  }

  // Fallback: any world country not yet in our registry — selectable with an
  // elegant empty state rather than an error.
  const wc = (
    worldCountries as Array<{
      cca2: string;
      name: { common: string };
      flag: string;
      latlng: [number, number];
    }>
  ).find((c) => c.cca2 === codeUpper);

  if (!wc) {
    return NextResponse.json({ error: "Country not found" }, { status: 404 });
  }

  return NextResponse.json({
    code: wc.cca2,
    name: wc.name.common,
    flag: wc.flag,
    latitude: wc.latlng[0],
    longitude: wc.latlng[1],
    total: 0,
    professionals: [],
  });
}
