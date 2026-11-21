import { NextRequest, NextResponse } from "next/server";
import worldCountries from "world-countries";
import { db } from "@/lib/db";
import { professionalInclude, toProfessionalCard } from "@/lib/serialize";

export const dynamic = "force-dynamic";

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
        orderBy: { fullName: "asc" },
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
      professionals: country.professionals.map((p) => toProfessionalCard(p)),
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
    professionals: [],
  });
}
