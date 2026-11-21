import { NextRequest, NextResponse } from "next/server";
import type { ZodType } from "zod";

/** Reads + validates a JSON body. Returns `{ data }` or `{ error }` (a ready-made 4xx response). */
export async function parseBody<T>(
  req: NextRequest,
  schema: ZodType<T>
): Promise<{ data: T; error?: undefined } | { data?: undefined; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path?.length ? `${issue.path.join(".")}: ` : "";
    return {
      error: NextResponse.json(
        { error: `${field}${issue?.message ?? "Validation failed"}` },
        { status: 422 }
      ),
    };
  }
  return { data: parsed.data };
}

export function serverError(err: unknown) {
  console.error("[admin api]", err);
  return NextResponse.json({ error: "Something went wrong on the server" }, { status: 500 });
}

export function parseJsonArray<T>(json: string, fallback: T[] = []): T[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? (v as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export function readingMinutesFor(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** "2026-11-17" -> Date at 00:00 UTC (the site compares featured dates in UTC). */
export function dateOnlyToUtc(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Prisma `data` for a quick PATCH { published?, archived? } on professionals / stories. */
export function toggleData(input: { published?: boolean; archived?: boolean }) {
  const data: { published?: boolean; archived?: boolean; homeFeatured?: boolean; homeOrder?: number } = {};
  if (input.archived === true) {
    // archived = hidden from the site and removed from the homepage
    Object.assign(data, { archived: true, published: false, homeFeatured: false, homeOrder: 0 });
  } else if (input.archived === false) {
    // restored items come back as drafts; publish them again when ready
    data.archived = false;
  }
  if (input.published !== undefined && input.archived !== true) {
    data.published = input.published;
    if (input.published) data.archived = false;
  }
  return data;
}
