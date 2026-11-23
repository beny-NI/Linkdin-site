import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import worldCountries from "world-countries";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { parseBody, serverError } from "@/lib/admin-server";
import { professionalSchema } from "@/lib/admin-schemas";
import { MAX_ROWS } from "@/lib/import-columns";
import { uniqueSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const commitSchema = z.object({ rows: z.array(z.record(z.string(), z.unknown())).min(1).max(MAX_ROWS) });

type WC = { cca2: string; name: { common: string }; flag: string; latlng: [number, number] };

/** POST { rows } — re-validates every row and creates it as a DRAFT (published = false). */
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { data, error } = await parseBody(req, commitSchema);
  if (error) return error;

  try {
    let created = 0;
    const failed: { index: number; error: string }[] = [];

    for (let i = 0; i < data.rows.length; i++) {
      const parsed = professionalSchema.safeParse({ ...data.rows[i], published: false });
      if (!parsed.success) {
        failed.push({ index: i, error: parsed.error.issues[0]?.message ?? "Invalid row" });
        continue;
      }
      const p = parsed.data;

      // add the country automatically if it is a real country not yet on the site
      let country = await db.country.findUnique({ where: { code: p.countryCode } });
      if (!country) {
        const wc = (worldCountries as WC[]).find((c) => c.cca2 === p.countryCode);
        if (!wc) {
          failed.push({ index: i, error: `Unknown country ${p.countryCode}` });
          continue;
        }
        country = await db.country.create({
          data: { code: wc.cca2, name: wc.name.common, flag: wc.flag, latitude: wc.latlng[0], longitude: wc.latlng[1] },
        });
      }

      try {
        const slug = p.slug && !(await db.professional.findUnique({ where: { slug: p.slug }, select: { id: true } }))
          ? p.slug
          : await uniqueSlug(p.slug || p.fullName, async (s) => !!(await db.professional.findUnique({ where: { slug: s }, select: { id: true } })), "person");

        await db.professional.create({
          data: {
            slug,
            fullName: p.fullName,
            professionalTitle: p.professionalTitle,
            summary: p.summary,
            biography: p.biography,
            portraitUrl: p.portraitUrl,
            city: p.city,
            organization: p.organization,
            countryCode: p.countryCode,
            achievements: JSON.stringify(p.achievements.filter(Boolean)),
            experience: JSON.stringify(p.experience),
            education: JSON.stringify(p.education),
            projects: JSON.stringify(p.projects),
            publications: JSON.stringify(p.publications),
            awards: JSON.stringify(p.awards),
            links: JSON.stringify(p.links.filter((l) => l.url)),
            published: false,
            expertise: { create: p.expertiseIds.map((expertiseId) => ({ expertiseId })) },
            industries: { create: p.industryIds.map((industryId) => ({ industryId })) },
          },
        });
        created++;
      } catch (err) {
        console.error("[import commit]", err);
        failed.push({ index: i, error: "Could not be saved" });
      }
    }

    return NextResponse.json({ created, failed });
  } catch (err) {
    return serverError(err);
  }
}
