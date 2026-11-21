import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { professionalInclude, storyInclude, toProfessionalCard, toStoryCard } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const expertise = await db.expertise.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: { orderBy: { order: "asc" } },
      professionals: {
        where: { professional: { is: { published: true } } },
        include: { professional: { include: professionalInclude } },
      },
      stories: {
        where: { story: { is: { published: true } } },
        include: { story: { include: storyInclude } },
      },
    },
  });

  if (!expertise) {
    return NextResponse.json({ error: "Expertise not found" }, { status: 404 });
  }

  const professionals = expertise.professionals.map((p) => toProfessionalCard(p.professional));

  // related industries derived from these professionals
  const industryCounts = new Map<string, { slug: string; name: string; count: number }>();
  for (const p of professionals) {
    for (const ind of p.industries) {
      const cur = industryCounts.get(ind.slug) ?? { ...ind, count: 0 };
      cur.count += 1;
      industryCounts.set(ind.slug, cur);
    }
  }

  return NextResponse.json({
    slug: expertise.slug,
    name: expertise.name,
    description: expertise.description,
    cluster: expertise.cluster,
    parent: expertise.parent ? { slug: expertise.parent.slug, name: expertise.parent.name } : null,
    children: expertise.children.map((c) => ({ slug: c.slug, name: c.name })),
    professionals,
    relatedIndustries: [...industryCounts.values()].sort((a, b) => b.count - a.count),
    relatedStories: expertise.stories.map((s) => toStoryCard(s.story)),
  });
}
