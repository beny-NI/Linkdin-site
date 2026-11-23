import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { parseBody, serverError } from "@/lib/admin-server";
import { PLACEHOLDER_PORTRAIT, bulkSchema } from "@/lib/admin-schemas";

export const dynamic = "force-dynamic";

/**
 * POST { entity, action, ids? | all? }
 * Bulk delete / publish / unpublish / archive / restore for professionals, stories and collections.
 * Professionals without a real portrait photo are skipped when publishing.
 */
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { data, error } = await parseBody(req, bulkSchema);
  if (error) return error;

  const { entity, action } = data;
  if ((action === "archive" || action === "restore") && entity === "collections") {
    return NextResponse.json({ error: "Collections cannot be archived" }, { status: 422 });
  }
  if (!data.ids?.length && !data.all) {
    return NextResponse.json({ error: "Nothing selected" }, { status: 422 });
  }

  try {
    // ---- which rows? -------------------------------------------------
    let ids = data.ids ?? [];
    if (data.all) {
      const { q, status } = data.all;
      const archivable = entity !== "collections";
      const where: Record<string, unknown> = {};
      if (archivable) {
        if (status === "archived") where.archived = true;
        else {
          where.archived = false;
          if (status === "published") where.published = true;
          if (status === "draft") where.published = false;
        }
      } else {
        if (status === "published") where.published = true;
        if (status === "draft") where.published = false;
      }
      if (q) {
        const contains = { contains: q };
        where.OR =
          entity === "professionals"
            ? [{ fullName: contains }, { professionalTitle: contains }, { city: contains }, { organization: contains }]
            : entity === "stories"
              ? [{ title: contains }, { subtitle: contains }, { author: contains }]
              : [{ title: contains }, { description: contains }];
      }
      const rows =
        entity === "professionals"
          ? await db.professional.findMany({ where: where as Prisma.ProfessionalWhereInput, select: { id: true }, take: 5000 })
          : entity === "stories"
            ? await db.story.findMany({ where: where as Prisma.StoryWhereInput, select: { id: true }, take: 5000 })
            : await db.collection.findMany({ where: where as Prisma.CollectionWhereInput, select: { id: true }, take: 5000 });
      ids = rows.map((r) => r.id);
    }
    if (ids.length === 0) return NextResponse.json({ done: 0, skipped: 0 });

    const inIds = { id: { in: ids } };
    let done = 0;
    let skipped = 0;

    if (action === "delete") {
      const res =
        entity === "professionals"
          ? await db.professional.deleteMany({ where: inIds })
          : entity === "stories"
            ? await db.story.deleteMany({ where: inIds })
            : await db.collection.deleteMany({ where: inIds });
      done = res.count;
    } else if (action === "publish") {
      if (entity === "professionals") {
        const ok = await db.professional.updateMany({
          where: { ...inIds, NOT: { portraitUrl: PLACEHOLDER_PORTRAIT } },
          data: { published: true, archived: false },
        });
        done = ok.count;
        skipped = ids.length - done;
      } else if (entity === "stories") {
        done = (await db.story.updateMany({ where: inIds, data: { published: true, archived: false } })).count;
      } else {
        done = (await db.collection.updateMany({ where: inIds, data: { published: true } })).count;
      }
    } else if (action === "unpublish") {
      const data0 = { published: false };
      done =
        entity === "professionals"
          ? (await db.professional.updateMany({ where: inIds, data: data0 })).count
          : entity === "stories"
            ? (await db.story.updateMany({ where: inIds, data: data0 })).count
            : (await db.collection.updateMany({ where: inIds, data: data0 })).count;
    } else if (action === "archive") {
      const d = { archived: true, published: false, homeFeatured: false, homeOrder: 0 };
      done =
        entity === "professionals"
          ? (await db.professional.updateMany({ where: inIds, data: { ...d, homePotd: false, countryFeatured: false } })).count
          : (await db.story.updateMany({ where: inIds, data: d })).count;
    } else if (action === "restore") {
      done =
        entity === "professionals"
          ? (await db.professional.updateMany({ where: inIds, data: { archived: false } })).count
          : (await db.story.updateMany({ where: inIds, data: { archived: false } })).count;
    }

    return NextResponse.json({ done, skipped });
  } catch (err) {
    return serverError(err);
  }
}
