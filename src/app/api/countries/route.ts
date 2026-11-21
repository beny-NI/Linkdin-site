import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { CountryDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.country.findMany({
    include: { _count: { select: { professionals: { where: { published: true } } } } },
    orderBy: { name: "asc" },
  });
  const countries: CountryDTO[] = rows.map((c) => ({
    code: c.code,
    name: c.name,
    flag: c.flag,
    latitude: c.latitude,
    longitude: c.longitude,
    professionalCount: c._count.professionals,
  }));
  return NextResponse.json(countries);
}
