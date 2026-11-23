import ExcelJS from "exceljs";
import worldCountries from "world-countries";
import { PLACEHOLDER_PORTRAIT, professionalSchema, type ProfessionalInput } from "@/lib/admin-schemas";
import { COLUMNS, MAX_ROWS } from "@/lib/import-columns";

export { COLUMNS, MAX_ROWS };

/**
 * THE EXCEL STANDARD
 * - one sheet called "People" (or the first sheet), headers in row 1, one person per row
 * - header names are case-insensitive; spaces and dashes count as "_"
 * - several values in one cell: separate with ;  (or a new line)
 * - structured lists (experience, education, ...): one entry per LINE (Alt+Enter), fields split by |
 */

/* ------------------------------------------------------------------ */

export function cellText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (Array.isArray(o.richText)) return o.richText.map((t) => String((t as { text?: unknown }).text ?? "")).join("").trim();
    if (o.text !== undefined) return cellText(o.text);
    if (o.result !== undefined) return cellText(o.result);
    if (typeof o.hyperlink === "string") return o.hyperlink.trim();
  }
  return "";
}

const normHeader = (h: string) => h.trim().toLowerCase().replace(/[\s\-]+/g, "_");
const splitList = (v: string) => v.split(/[;\n]+/).map((x) => x.trim()).filter(Boolean);
const splitLines = (v: string) => v.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
const parts = (line: string) => line.split("|").map((x) => x.trim());

export interface PreviewRow {
  row: number; // Excel row number
  name: string;
  title: string;
  country: string;
  ok: boolean;
  errors: string[];
  warnings: string[];
  duplicate: boolean;
  data: ProfessionalInput | null;
}

export interface Lookups {
  countries: { code: string; name: string }[];
  expertise: { id: string; name: string }[];
  industries: { id: string; name: string }[];
  existingNames: Set<string>; // lower-cased full names already on the site
}

type WC = { cca2: string; name: { common: string } };
const WORLD = worldCountries as WC[];

export function resolveCountry(input: string, known: { code: string; name: string }[]): { code: string; isNew: boolean } | null {
  const q = input.trim().toLowerCase();
  if (!q) return null;
  const inDb = known.find((c) => c.code.toLowerCase() === q || c.name.toLowerCase() === q);
  if (inDb) return { code: inDb.code, isNew: false };
  const wc = WORLD.find((c) => c.cca2.toLowerCase() === q || c.name.common.toLowerCase() === q);
  return wc ? { code: wc.cca2, isNew: true } : null;
}

export async function readWorkbookRows(buffer: Buffer): Promise<{ headers: string[]; rows: { row: number; cells: Record<string, string> }[] }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const ws = wb.getWorksheet("People") ?? wb.worksheets[0];
  if (!ws) throw new Error("The file has no sheets");

  const headerRow = ws.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    headers[col] = normHeader(cellText(cell.value));
  });

  const rows: { row: number; cells: Record<string, string> }[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const excelRow = ws.getRow(r);
    const cells: Record<string, string> = {};
    let any = false;
    headers.forEach((h, col) => {
      if (!h) return;
      const text = cellText(excelRow.getCell(col).value);
      if (text) any = true;
      cells[h] = text;
    });
    if (any) rows.push({ row: r, cells });
    if (rows.length > MAX_ROWS) throw new Error(`Too many rows — the limit is ${MAX_ROWS} people per file`);
  }
  return { headers: headers.filter(Boolean), rows };
}

export function buildPreview(rows: { row: number; cells: Record<string, string> }[], lookups: Lookups): PreviewRow[] {
  const seen = new Set<string>();
  return rows.map(({ row, cells }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const get = (k: string) => cells[k] ?? "";

    const fullName = get("full_name");
    const biography = get("biography");
    let summary = get("summary");
    if (!summary && biography) {
      summary = biography.replace(/\s+/g, " ").slice(0, 300).trim();
      if (biography.length > 300) summary = summary.replace(/\s+\S*$/, "") + "…";
      warnings.push("Summary was empty — taken from the biography");
    }

    const country = resolveCountry(get("country"), lookups.countries);
    if (!get("country")) errors.push("country is missing");
    else if (!country) errors.push(`Unknown country “${get("country")}”`);
    else if (country.isNew) warnings.push(`Country “${get("country")}” will be added to the site`);

    const pickIds = (raw: string, list: { id: string; name: string }[], label: string) => {
      const ids: string[] = [];
      for (const name of splitList(raw)) {
        const hit = list.find((x) => x.name.toLowerCase() === name.toLowerCase());
        if (hit) ids.push(hit.id);
        else warnings.push(`${label} “${name}” does not exist on the site — ignored`);
      }
      return Array.from(new Set(ids));
    };

    const links: { label: string; url: string }[] = [];
    if (get("linkedin_url")) links.push({ label: "LinkedIn", url: get("linkedin_url") });
    if (get("website_url")) links.push({ label: "Website", url: get("website_url") });

    const portrait = get("portrait_url");
    if (!portrait) warnings.push("No photo — a placeholder is used; upload one before publishing");

    const candidate = {
      slug: get("slug") || undefined,
      fullName,
      professionalTitle: get("professional_title"),
      summary,
      biography,
      portraitUrl: portrait || PLACEHOLDER_PORTRAIT,
      city: get("city"),
      organization: get("organization") || null,
      countryCode: country?.code ?? "",
      achievements: splitList(get("achievements")),
      experience: splitLines(get("experience")).map((l) => {
        const [role = "", org = "", period = "", ...rest] = parts(l);
        return { role, org, period, description: rest.join(" | ") };
      }),
      education: splitLines(get("education")).map((l) => {
        const [degree = "", institution = "", year = ""] = parts(l);
        return { degree, institution, year };
      }),
      projects: splitLines(get("projects")).map((l) => {
        const [name = "", description = "", year = ""] = parts(l);
        return { name, description, year };
      }),
      publications: splitLines(get("publications")).map((l) => {
        const [title = "", venue = "", year = ""] = parts(l);
        return { title, venue, year };
      }),
      awards: splitLines(get("awards")).map((l) => {
        const [title = "", org = "", year = ""] = parts(l);
        return { title, org, year };
      }),
      links,
      expertiseIds: pickIds(get("expertise"), lookups.expertise, "Expertise"),
      industryIds: pickIds(get("industries"), lookups.industries, "Industry"),
      published: false,
    };

    const parsed = professionalSchema.safeParse(candidate);
    let data: ProfessionalInput | null = null;
    if (parsed.success) data = parsed.data;
    else {
      for (const issue of parsed.error.issues.slice(0, 4)) {
        errors.push(`${issue.path.join(".") || "row"}: ${issue.message}`);
      }
    }

    const key = fullName.toLowerCase();
    const duplicate = !!key && (lookups.existingNames.has(key) || seen.has(key));
    if (key) seen.add(key);
    if (duplicate) warnings.push("A person with this name already exists (or appears twice in the file)");

    return {
      row,
      name: fullName,
      title: get("professional_title"),
      country: get("country"),
      ok: errors.length === 0,
      errors,
      warnings,
      duplicate,
      data: errors.length === 0 ? data : null,
    };
  });
}

/** The downloadable template: People (empty), Example (one filled row), Read me (column guide). */
export async function buildTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SkilledSphere";

  const headerStyle = {
    font: { bold: true, color: { argb: "FF0B1530" } },
    fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFC6A96B" } },
    alignment: { vertical: "middle" as const, wrapText: true },
  };

  const people = wb.addWorksheet("People", { views: [{ state: "frozen", ySplit: 1 }] });
  people.columns = COLUMNS.map((c) => ({ header: c.key, key: c.key, width: c.key === "biography" ? 60 : c.key.length > 14 ? 30 : 22 }));
  people.getRow(1).eachCell((cell) => Object.assign(cell, { style: headerStyle }));
  people.getRow(1).height = 22;
  COLUMNS.forEach((c, i) => {
    if (c.required) people.getRow(1).getCell(i + 1).note = "Required";
  });

  const example = wb.addWorksheet("Example");
  example.columns = COLUMNS.map((c) => ({ header: c.key, key: c.key, width: 30 }));
  example.getRow(1).eachCell((cell) => Object.assign(cell, { style: headerStyle }));
  example.addRow(Object.fromEntries(COLUMNS.map((c) => [c.key, c.example])));
  example.eachRow((row) => row.eachCell((cell) => (cell.alignment = { wrapText: true, vertical: "top" })));

  const guide = wb.addWorksheet("Read me");
  guide.columns = [
    { header: "Column", key: "k", width: 22 },
    { header: "Required", key: "r", width: 12 },
    { header: "What to enter", key: "d", width: 90 },
    { header: "Example", key: "e", width: 50 },
  ];
  guide.getRow(1).eachCell((cell) => Object.assign(cell, { style: headerStyle }));
  for (const c of COLUMNS) guide.addRow({ k: c.key, r: c.required ? "YES" : "", d: c.description, e: c.example });
  guide.addRow({});
  guide.addRow({ k: "Rules", d: "Fill the sheet “People”, one person per row. Keep the header row unchanged. Max 500 rows per file." });
  guide.addRow({ k: "", d: "Several values in one cell: separate with ;  — Lists (experience etc.): one entry per line (Alt+Enter), fields separated by |" });
  guide.addRow({ k: "", d: "Every row becomes a DRAFT. Nothing is public until you approve it in the review step." });

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out as ArrayBuffer);
}
