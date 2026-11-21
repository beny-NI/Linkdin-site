import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { parseBody, serverError } from "@/lib/admin-server";
import { countrySchema, expertiseSchema, industrySchema } from "@/lib/admin-schemas";
import { uniqueSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ kind: string }> };

/** kind = expertise | industries | countries */
export async function GET(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { kind } = await params;

  try {
    if (kind === "expertise") {
      const rows = await db.expertise.findMany({
        orderBy: [{ cluster: "asc" }, { order: "asc" }],
        include: { _count: { select: { professionals: true } } },
      });
      return NextResponse.json({
        items: rows.map((e) => ({
          id: e.id,
          name: e.name,
          slug: e.slug,
          description: e.description,
          cluster: e.cluster,
          order: e.order,
          parentId: e.parentId,
          count: e._count.professionals,
        })),
      });
    }
    if (kind === "industries") {
      const rows = await db.industry.findMany({
        orderBy: { order: "asc" },
        include: { _count: { select: { professionals: true } } },
      });
      return NextResponse.json({
        items: rows.map((i) => ({
          id: i.id,
          name: i.name,
          slug: i.slug,
          description: i.description,
          order: i.order,
          count: i._count.professionals,
        })),
      });
    }
    if (kind === "countries") {
      const rows = await db.country.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { professionals: true } } },
      });
      return NextResponse.json({
        items: rows.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          flag: c.flag,
          latitude: c.latitude,
          longitude: c.longitude,
          count: c._count.professionals,
        })),
      });
    }
    return NextResponse.json({ error: "Unknown type" }, { status: 404 });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { kind } = await params;

  try {
    if (kind === "expertise") {
      const { data, error } = await parseBody(req, expertiseSchema);
      if (error) return error;
      const slug =
        data.slug ??
        (await uniqueSlug(data.name, async (s) => !!(await db.expertise.findUnique({ where: { slug: s }, select: { id: true } })), "expertise"));
      if (data.slug && (await db.expertise.findUnique({ where: { slug }, select: { id: true } }))) {
        return NextResponse.json({ error: "This slug is already used" }, { status: 409 });
      }
      const created = await db.expertise.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          cluster: data.cluster,
          order: data.order,
          parentId: data.parentId,
        },
        select: { id: true },
      });
      return NextResponse.json(created, { status: 201 });
    }

    if (kind === "industries") {
      const { data, error } = await parseBody(req, industrySchema);
      if (error) return error;
      const slug =
        data.slug ??
        (await uniqueSlug(data.name, async (s) => !!(await db.industry.findUnique({ where: { slug: s }, select: { id: true } })), "industry"));
      if (data.slug && (await db.industry.findUnique({ where: { slug }, select: { id: true } }))) {
        return NextResponse.json({ error: "This slug is already used" }, { status: 409 });
      }
      const created = await db.industry.create({
        data: { name: data.name, slug, description: data.description, order: data.order },
        select: { id: true },
      });
      return NextResponse.json(created, { status: 201 });
    }

    if (kind === "countries") {
      const { data, error } = await parseBody(req, countrySchema);
      if (error) return error;
      if (await db.country.findUnique({ where: { code: data.code }, select: { id: true } })) {
        return NextResponse.json({ error: "This country already exists" }, { status: 409 });
      }
      const created = await db.country.create({ data, select: { id: true } });
      return NextResponse.json(created, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 404 });
  } catch (err) {
    return serverError(err);
  }
}
