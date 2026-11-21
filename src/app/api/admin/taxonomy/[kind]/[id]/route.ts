import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { parseBody, serverError } from "@/lib/admin-server";
import { countrySchema, expertiseSchema, industrySchema } from "@/lib/admin-schemas";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ kind: string; id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { kind, id } = await params;

  try {
    if (kind === "expertise") {
      const { data, error } = await parseBody(req, expertiseSchema);
      if (error) return error;
      const existing = await db.expertise.findUnique({ where: { id }, select: { id: true, slug: true } });
      if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (data.parentId === id) return NextResponse.json({ error: "An item cannot be its own parent" }, { status: 422 });
      const slug = data.slug || existing.slug;
      if (slug !== existing.slug && (await db.expertise.findUnique({ where: { slug }, select: { id: true } }))) {
        return NextResponse.json({ error: "This slug is already used" }, { status: 409 });
      }
      await db.expertise.update({
        where: { id },
        data: {
          name: data.name,
          slug,
          description: data.description,
          cluster: data.cluster,
          order: data.order,
          parentId: data.parentId,
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (kind === "industries") {
      const { data, error } = await parseBody(req, industrySchema);
      if (error) return error;
      const existing = await db.industry.findUnique({ where: { id }, select: { id: true, slug: true } });
      if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const slug = data.slug || existing.slug;
      if (slug !== existing.slug && (await db.industry.findUnique({ where: { slug }, select: { id: true } }))) {
        return NextResponse.json({ error: "This slug is already used" }, { status: 409 });
      }
      await db.industry.update({
        where: { id },
        data: { name: data.name, slug, description: data.description, order: data.order },
      });
      return NextResponse.json({ ok: true });
    }

    if (kind === "countries") {
      const { data, error } = await parseBody(req, countrySchema);
      if (error) return error;
      const existing = await db.country.findUnique({ where: { id }, select: { id: true, code: true } });
      if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (existing.code !== data.code) {
        return NextResponse.json({ error: "The country code cannot be changed" }, { status: 422 });
      }
      await db.country.update({
        where: { id },
        data: { name: data.name, flag: data.flag, latitude: data.latitude, longitude: data.longitude },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 404 });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { kind, id } = await params;

  try {
    if (kind === "expertise") {
      const exists = await db.expertise.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await db.expertise.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }
    if (kind === "industries") {
      const exists = await db.industry.findUnique({ where: { id }, select: { id: true } });
      if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await db.industry.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }
    if (kind === "countries") {
      const c = await db.country.findUnique({ where: { id }, include: { _count: { select: { professionals: true } } } });
      if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (c._count.professionals > 0) {
        return NextResponse.json(
          { error: `${c._count.professionals} profile(s) still use this country — move or delete them first` },
          { status: 409 }
        );
      }
      await db.country.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown type" }, { status: 404 });
  } catch (err) {
    return serverError(err);
  }
}
