import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { serverError } from "@/lib/admin-server";
import { buildPreview, readWorkbookRows, COLUMNS } from "@/lib/import-people";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

/** POST multipart { file: .xlsx } -> validated preview rows (nothing is saved yet). */
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received" }, { status: 400 });
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json({ error: "Please upload an .xlsx file (Excel). Use “Download template”." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File is larger than 5 MB" }, { status: 413 });

  try {
    const { headers, rows } = await readWorkbookRows(Buffer.from(await file.arrayBuffer()));
    const required = COLUMNS.filter((c) => c.required).map((c) => c.key);
    const missing = required.filter((k) => !headers.includes(k));
    if (missing.length) {
      return NextResponse.json({ error: `Missing required column(s): ${missing.join(", ")}. Use the template.` }, { status: 422 });
    }
    if (rows.length === 0) return NextResponse.json({ error: "No people found — fill rows below the header" }, { status: 422 });

    const [countries, expertise, industries, existing] = await Promise.all([
      db.country.findMany({ select: { code: true, name: true } }),
      db.expertise.findMany({ select: { id: true, name: true } }),
      db.industry.findMany({ select: { id: true, name: true } }),
      db.professional.findMany({ select: { fullName: true } }),
    ]);

    const preview = buildPreview(rows, {
      countries,
      expertise,
      industries,
      existingNames: new Set(existing.map((e) => e.fullName.toLowerCase())),
    });
    return NextResponse.json({ rows: preview });
  } catch (err) {
    console.error("[import preview]", err);
    return NextResponse.json({ error: "This file could not be read. Is it a valid .xlsx made from the template?" }, { status: 422 });
  }
}
