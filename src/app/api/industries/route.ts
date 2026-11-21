import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { IndustryDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.industry.findMany({
    include: { _count: { select: { professionals: { where: { professional: { is: { published: true } } } } } } },
    orderBy: { order: "asc" },
  });
  const industries: IndustryDTO[] = rows.map((i) => ({
    slug: i.slug,
    name: i.name,
    description: i.description,
    professionalCount: i._count.professionals,
  }));
  return NextResponse.json(industries);
}
