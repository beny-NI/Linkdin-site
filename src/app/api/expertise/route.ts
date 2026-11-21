import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ExpertiseDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.expertise.findMany({
    include: { _count: { select: { professionals: { where: { professional: { is: { published: true } } } } } } },
    orderBy: { order: "asc" },
  });
  const byId = new Map(rows.map((e) => [e.id, e]));
  const dtoById = new Map<string, ExpertiseDTO>();
  for (const e of rows) {
    dtoById.set(e.id, {
      id: e.id,
      slug: e.slug,
      name: e.name,
      description: e.description,
      cluster: e.cluster,
      order: e.order,
      parentSlug: e.parentId ? byId.get(e.parentId)?.slug ?? null : null,
      children: [],
      professionalCount: e._count.professionals,
    });
  }
  const tree: ExpertiseDTO[] = [];
  for (const e of rows) {
    const dto = dtoById.get(e.id)!;
    if (e.parentId && dtoById.has(e.parentId)) dtoById.get(e.parentId)!.children.push(dto);
    else tree.push(dto);
  }
  return NextResponse.json(tree);
}
