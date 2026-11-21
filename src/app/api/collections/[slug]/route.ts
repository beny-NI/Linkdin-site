import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { professionalInclude, toProfessionalCard } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const collection = await db.collection.findUnique({
    where: { slug },
    include: {
      members: {
        orderBy: { order: "asc" },
        include: { professional: { include: professionalInclude } },
      },
    },
  });

  if (!collection || !collection.published) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  return NextResponse.json({
    slug: collection.slug,
    title: collection.title,
    description: collection.description,
    coverUrl: collection.coverUrl,
    kind: collection.kind,
    edition: collection.edition,
    members: collection.members.map((m) => toProfessionalCard(m.professional)),
  });
}
