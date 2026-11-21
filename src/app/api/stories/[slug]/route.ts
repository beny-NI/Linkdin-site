import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storyInclude, toStoryCard } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const story = await db.story.findUnique({
    where: { slug },
    include: {
      relatedProfessionals: {
        include: { professional: { include: { country: true, expertise: { include: { expertise: true } }, industries: { include: { industry: true } } } } },
      },
      relatedExpertise: { include: { expertise: true } },
    },
  });

  if (!story || !story.published) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  const relatedStories = await db.story.findMany({
    where: {
      published: true,
      id: { not: story.id },
      OR: [
        { relatedExpertise: { some: { expertiseId: { in: story.relatedExpertise.map((e) => e.expertiseId) } } } },
        { relatedProfessionals: { some: { professionalId: { in: story.relatedProfessionals.map((p) => p.professionalId) } } } },
      ],
    },
    include: storyInclude,
    orderBy: { publicationDate: "desc" },
    take: 3,
  });

  // assemble detail with the shared story include shape
  const storyForCard = await db.story.findUnique({ where: { slug }, include: storyInclude });
  const card = toStoryCard(storyForCard!);

  return NextResponse.json({
    ...card,
    content: story.content,
    relatedExpertise: story.relatedExpertise.map((e) => ({
      slug: e.expertise.slug,
      name: e.expertise.name,
    })),
    relatedStories: relatedStories.map(toStoryCard),
  });
}
