import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { professionalInclude, toProfessionalCard } from "@/lib/serialize";
import type { CollectionCardDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.collection.findMany({
    where: { published: true },
    include: {
      members: {
        orderBy: { order: "asc" },
        include: { professional: { include: professionalInclude } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  const collections: CollectionCardDTO[] = rows.map((c) => ({
    slug: c.slug,
    title: c.title,
    description: c.description,
    coverUrl: c.coverUrl,
    kind: c.kind,
    edition: c.edition,
    memberCount: c.members.length,
    members: c.members.map((m) => toProfessionalCard(m.professional)),
  }));
  return NextResponse.json(collections);
}
