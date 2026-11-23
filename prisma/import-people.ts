/**
 * SkilledSphere — import real people from prisma/people.json (made from data_with_links.xlsx).
 *
 * Safe to re-run: it never deletes anything and never overwrites text you edited in the admin panel.
 *   bun prisma/import-people.ts                 -> imports everyone as DRAFTS (published = false)
 *   PUBLISH=1 bun prisma/import-people.ts       -> imports as published
 *   ARCHIVE_OLD=1 bun prisma/import-people.ts   -> also archives every professional that is NOT in people.json
 *                                                  (e.g. the 22 sample people; reversible from the admin panel)
 * PEOPLE_FILE=people-all.json bun prisma/import-people.ts  -> import all 560 instead of the selected 200
 * Portraits: put files in public/images/portraits/<slug>.(png|jpg|jpeg|webp). Re-run the script afterwards
 * and the portraitUrl of already-imported people is updated.
 */
import { PrismaClient } from "@prisma/client";
import worldCountries from "world-countries";
import fs from "node:fs";
import path from "node:path";

const db = new PrismaClient();
const PUBLISH = process.env.PUBLISH === "1";
const ARCHIVE_OLD = process.env.ARCHIVE_OLD === "1";
const PLACEHOLDER = "/images/portraits/placeholder.svg";

type P = {
  slug: string; fullName: string; professionalTitle: string; organization: string | null; countryCode: string;
  summary: string; biography: string; expertise: string[]; industries: string[]; collections: string[];
  links: { label: string; url: string }[];
};
type Doc = {
  professionals: P[];
  expertise: { name: string; cluster: string }[];
  industries: { name: string }[];
  collections: { title: string; slug: string }[];
};

function slugify(input: string): string {
  return input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/g, "");
}

function findPortrait(slug: string): string | null {
  for (const ext of ["png", "jpg", "jpeg", "webp"]) {
    if (fs.existsSync(path.join(process.cwd(), "public", "images", "portraits", `${slug}.${ext}`))) {
      return `/images/portraits/${slug}.${ext}`;
    }
  }
  return null;
}

async function main() {
  const doc: Doc = JSON.parse(fs.readFileSync(path.join(process.cwd(), "prisma", process.env.PEOPLE_FILE ?? "people.json"), "utf8"));
  const wc = worldCountries as Array<{ cca2: string; name: { common: string }; flag: string; latlng: [number, number] }>;
  const byCode = new Map(wc.map((c) => [c.cca2, c]));

  // ---- countries (add the missing ones)
  const codes = [...new Set(doc.professionals.map((p) => p.countryCode))];
  let newCountries = 0;
  for (const code of codes) {
    const c = byCode.get(code);
    if (!c) throw new Error(`Unknown country code ${code}`);
    const exists = await db.country.findUnique({ where: { code } });
    if (!exists) {
      await db.country.create({ data: { code, name: c.name.common, flag: c.flag, latitude: c.latlng[0], longitude: c.latlng[1] } });
      newCountries++;
    }
  }
  console.log(`Countries: ${codes.length} used, ${newCountries} added`);

  // ---- expertise & industries (upsert by slug; existing rows are left untouched)
  const expId = new Map<string, string>();
  let order = 1000;
  for (const e of doc.expertise) {
    const slug = slugify(e.name);
    const row = await db.expertise.upsert({ where: { slug }, update: {}, create: { name: e.name, slug, cluster: e.cluster, order: order++ } });
    expId.set(e.name, row.id);
  }
  const indId = new Map<string, string>();
  order = 1000;
  for (const i of doc.industries) {
    const slug = slugify(i.name);
    const row = await db.industry.upsert({ where: { slug }, update: {}, create: { name: i.name, slug, order: order++ } });
    indId.set(i.name, row.id);
  }
  console.log(`Expertise: ${expId.size}, Industries: ${indId.size}`);

  // ---- collections (one per Excel category). Created UNPUBLISHED unless PUBLISH=1.
  const colId = new Map<string, string>();
  for (const c of doc.collections) {
    const row = await db.collection.upsert({
      where: { slug: c.slug },
      update: {},
      create: { title: c.title, slug: c.slug, description: `Professionals in ${c.title}.`, kind: "editorial", published: PUBLISH },
    });
    colId.set(c.title, row.id);
  }

  // ---- professionals
  let created = 0, skipped = 0, withPhoto = 0;
  const colOrder = new Map<string, number>();
  for (const p of doc.professionals) {
    const photo = findPortrait(p.slug);
    if (photo) withPhoto++;
    const existing = await db.professional.findUnique({ where: { slug: p.slug }, select: { id: true, portraitUrl: true } });
    let id: string;
    if (existing) {
      // never overwrite edited text; only upgrade the placeholder to a real photo
      if (photo && existing.portraitUrl !== photo) {
        await db.professional.update({ where: { id: existing.id }, data: { portraitUrl: photo } });
      }
      id = existing.id;
      skipped++;
    } else {
      const row = await db.professional.create({
        data: {
          slug: p.slug,
          fullName: p.fullName,
          professionalTitle: p.professionalTitle,
          summary: p.summary,
          biography: p.biography,
          portraitUrl: photo ?? PLACEHOLDER,
          city: "",
          organization: p.organization,
          countryCode: p.countryCode,
          links: JSON.stringify(p.links),
          published: PUBLISH,
          expertise: { create: p.expertise.filter((n) => expId.has(n)).map((n) => ({ expertiseId: expId.get(n)! })) },
          industries: { create: p.industries.filter((n) => indId.has(n)).map((n) => ({ industryId: indId.get(n)! })) },
        },
        select: { id: true },
      });
      id = row.id;
      created++;
    }
    for (const title of p.collections) {
      const collectionId = colId.get(title);
      if (!collectionId) continue;
      const o = (colOrder.get(title) ?? 0) + 1;
      colOrder.set(title, o);
      await db.collectionMember.upsert({
        where: { collectionId_professionalId: { collectionId, professionalId: id } },
        update: {},
        create: { collectionId, professionalId: id, order: o },
      });
    }
  }
  console.log(`Professionals: ${created} created, ${skipped} already existed. Real portraits found: ${withPhoto}/${doc.professionals.length}`);

  if (ARCHIVE_OLD) {
    const res = await db.professional.updateMany({
      where: { slug: { notIn: doc.professionals.map((p) => p.slug) }, archived: false },
      data: { archived: true },
    });
    console.log(`Archived ${res.count} professionals that are not in people.json`);
  }
  console.log(PUBLISH ? "Done — everyone is PUBLISHED." : "Done — everyone is a DRAFT. Review in /admin, then publish.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
