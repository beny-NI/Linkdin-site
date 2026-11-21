import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { professionalInclude, storyInclude, toProfessionalCard, toProfessionalDetail, toStoryCard } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const prof = await db.professional.findUnique({
    where: { slug },
    include: professionalInclude,
  });

  if (!prof || !prof.published) {
    return NextResponse.json({ error: "Professional not found" }, { status: 404 });
  }

  const detail = toProfessionalDetail(prof);

  // related professionals: share expertise, industry or country
  const expertiseIds = prof.expertise.map((e) => e.expertiseId);
  const industryIds = prof.industries.map((i) => i.industryId);

  const related = await db.professional.findMany({
    where: {
      published: true,
      id: { not: prof.id },
      OR: [
        { expertise: { some: { expertiseId: { in: expertiseIds } } } },
        { industries: { some: { industryId: { in: industryIds } } } },
      ],
    },
    include: professionalInclude,
    take: 4,
  });

  // Prefer closest matches first (same country as a tiebreak is handled client-side)
  detail.relatedProfessionals = related.map((r) => toProfessionalCard(r));

  const stories = await db.story.findMany({
    where: { published: true, relatedProfessionals: { some: { professionalId: prof.id } } },
    include: storyInclude,
    orderBy: { publicationDate: "desc" },
  });
  detail.relatedStories = stories.map(toStoryCard);

  return NextResponse.json(detail);
}
