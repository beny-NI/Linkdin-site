export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Returns `base`, `base-2`, `base-3`… — the first slug for which `exists` is false. */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
  fallbackPrefix = "item"
): Promise<string> {
  const root = slugify(base) || `${fallbackPrefix}-${Math.random().toString(36).slice(2, 8)}`;
  let candidate = root;
  let n = 2;
  while (await exists(candidate)) {
    candidate = `${root}-${n++}`;
    if (n > 500) throw new Error("Could not find a free slug");
  }
  return candidate;
}
