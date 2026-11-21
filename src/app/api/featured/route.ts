import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { professionalInclude, toProfessionalCard } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const endOfToday = new Date();
  endOfToday.setUTCHours(23, 59, 59, 999);

  const [current, upcoming] = await Promise.all([
    db.featuredSchedule.findFirst({
      where: { active: true, featuredDate: { lte: endOfToday } },
      include: {
        professional: { include: professionalInclude },
      },
      orderBy: { featuredDate: "desc" },
    }),
    db.featuredSchedule.findMany({
      where: { active: true, featuredDate: { gt: endOfToday } },
      include: { professional: { include: professionalInclude } },
      orderBy: { featuredDate: "asc" },
      take: 5,
    }),
  ]);

  if (!current) return NextResponse.json(null);

  return NextResponse.json({
    label: current.label,
    date: current.featuredDate.toISOString(),
    professional: toProfessionalCard(current.professional, current.label),
    upcoming: upcoming.map((u) => ({
      date: u.featuredDate.toISOString(),
      professional: toProfessionalCard(u.professional),
    })),
  });
}
