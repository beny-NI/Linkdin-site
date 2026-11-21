import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storyInclude, toStoryCard } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category")?.trim() ?? "";
  const take = Math.min(24, parseInt(req.nextUrl.searchParams.get("take") ?? "24", 10) || 24);

  const stories = await db.story.findMany({
    where: { published: true, ...(category ? { category } : {}) },
    include: storyInclude,
    orderBy: { publicationDate: "desc" },
    take,
  });
  return NextResponse.json(stories.map(toStoryCard));
}
