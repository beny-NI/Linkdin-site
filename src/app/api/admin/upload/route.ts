import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/lib/admin-auth";
import { UPLOAD_KINDS, uploadDir, type UploadKind } from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * POST multipart/form-data { file, kind: "portraits" | "covers" }
 * The image is decoded and re-encoded as WebP (resized to max 1600px) — this
 * also strips EXIF/GPS data and rejects anything that is not a real image.
 */
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
  const kind = String(form.get("kind") ?? "portraits") as UploadKind;
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received" }, { status: 400 });
  if (!UPLOAD_KINDS.includes(kind)) return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "The file is empty" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image is larger than 8 MB" }, { status: 413 });

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const output = await sharp(input)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const name = `${Date.now()}-${randomBytes(4).toString("hex")}.webp`;
    const dir = path.join(uploadDir(), kind);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), output);

    return NextResponse.json({ url: `/api/uploads/${kind}/${name}` }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "This file is not a supported image (use JPG, PNG or WebP)" }, { status: 415 });
  }
}
