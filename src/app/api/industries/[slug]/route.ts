import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { professionalInclude, storyInclude, toProfessionalCard, toStoryCard } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const industry = await db.industry.findUnique({
    where: { slug },
    include: {
      professionals: {
        where: { professional: { is: { published: true } } },
        include: { professional: { include: professionalInclude } },
      },
    },
  });

  if (!industry) {
    return NextResponse.json({ error: "Industry not found" }, { status: 404 });
  }

  const professionals = industry.professionals.map((p) => toProfessionalCard(p.professional));

  // derived expertise clusters
  const expertiseCounts = new Map<string, { slug: string; name: string; count: number }>();
  for (const p of professionals) {
    for (const e of p.expertise) {
      const cur = expertiseCounts.get(e.slug) ?? { ...e, count: 0 };
      cur.count += 1;
      expertiseCounts.set(e.slug, cur);
    }
  }

  // stories related via professionals
  const stories = await db.story.findMany({
    where: {
      published: true,
      relatedProfessionals: {
        some: { professional: { industries: { some: { industryId: industry.id } } } },
      },
    },
    include: storyInclude,
    orderBy: { publicationDate: "desc" },
    take: 4,
  });

  return NextResponse.json({
    slug: industry.slug,
    name: industry.name,
    description: industry.description,
    professionals,
    expertiseClusters: [...expertiseCounts.values()].sort((a, b) => b.count - a.count),
    relatedStories: stories.map(toStoryCard),
  });
}
