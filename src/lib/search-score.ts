/**
 * Tiny relevance scorer used by /api/search and /api/professionals.
 * SQLite has no full-text ranking, so we fetch a bounded candidate set with
 * `contains` and rank it here:
 *   exact match > prefix / word-prefix match > plain substring match
 * multiplied by a per-field weight (name beats summary).
 */

export interface ScoredField {
  value: string | null | undefined;
  weight: number;
}

export function scoreFields(query: string, fields: ScoredField[]): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  let total = 0;
  for (const { value, weight } of fields) {
    if (!value) continue;
    const v = value.toLowerCase();
    if (v === q) total += weight * 5;
    else if (v.startsWith(q)) total += weight * 3;
    else if (new RegExp(`\\b${escapeRegExp(q)}`).test(v)) total += weight * 3; // a word starting with q counts like a prefix match
    else if (v.includes(q)) total += weight;
  }
  return total;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Sort by score desc, then by a stable tiebreaker (name asc). */
export function rankBy<T>(items: T[], score: (item: T) => number, name: (item: T) => string): T[] {
  return items
    .map((item) => ({ item, s: score(item) }))
    .sort((a, b) => b.s - a.s || name(a.item).localeCompare(name(b.item)))
    .map((x) => x.item);
}
