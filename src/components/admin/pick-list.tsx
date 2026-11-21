"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PickItem {
  id: string;
  label: string;
  sublabel?: string;
  image?: string | null;
  draft?: boolean;
}

interface PickListProps {
  items: PickItem[];
  value: string[];
  onChange: (ids: string[]) => void;
  /** show numbered rows with up / down arrows (order matters) */
  ordered?: boolean;
  /** pick exactly one item (choosing another replaces it) */
  single?: boolean;
  placeholder?: string;
  /** the first N selected rows get a badge (e.g. "Shown on homepage") */
  highlightFirst?: number;
  highlightLabel?: string;
  maxListHeight?: string;
  /** maximum number of items that can be selected */
  max?: number;
}

function Avatar({ src, label }: { src?: string | null; label: string }) {
  if (!src) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-100 text-[11px] font-bold text-navy-700">
        {label.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover object-top" />;
}

export function PickList({
  items,
  value,
  onChange,
  ordered,
  single,
  placeholder = "Search…",
  highlightFirst,
  highlightLabel = "On homepage",
  maxListHeight = "max-h-60",
  max,
}: PickListProps) {
  const [query, setQuery] = useState("");
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const selected = value.map((id) => byId.get(id)).filter((i): i is PickItem => !!i);

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    const taken = new Set(value);
    return items
      .filter((i) => !taken.has(i.id))
      .filter((i) => !q || i.label.toLowerCase().includes(q) || (i.sublabel ?? "").toLowerCase().includes(q))
      .slice(0, 60);
  }, [items, value, query]);

  function add(id: string) {
    onChange(single ? [id] : [...value, id]);
    setQuery("");
  }
  function remove(id: string) {
    onChange(value.filter((v) => v !== id));
  }
  function move(index: number, dir: -1 | 1) {
    const next = [...value];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <ul className={cn(ordered ? "space-y-1.5" : "flex flex-wrap gap-2")}>
          {selected.map((item, index) =>
            ordered ? (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2"
              >
                <span className="w-5 text-center text-xs font-bold text-gold-600">{index + 1}</span>
                <Avatar src={item.image} label={item.label} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy-900">{item.label}</p>
                  {item.sublabel && <p className="truncate text-xs text-muted-foreground">{item.sublabel}</p>}
                </div>
                {item.draft && (
                  <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-semibold text-gold-600">Draft</span>
                )}
                {highlightFirst !== undefined && index < highlightFirst && (
                  <span className="hidden rounded-full bg-navy-900 px-2 py-0.5 text-[10px] font-semibold text-gold-400 sm:inline">
                    {highlightLabel}
                  </span>
                )}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded p-1.5 text-navy-600 hover:bg-navy-50 disabled:opacity-30"
                    aria-label={`Move ${item.label} up`}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === selected.length - 1}
                    className="rounded p-1.5 text-navy-600 hover:bg-navy-50 disabled:opacity-30"
                    aria-label={`Move ${item.label} down`}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                    aria-label={`Remove ${item.label}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ) : (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-full border border-gold-500/50 bg-accent py-1 pl-3 pr-1.5 text-xs font-semibold text-accent-foreground"
              >
                {item.label}
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="rounded-full p-0.5 hover:bg-gold-500/30"
                  aria-label={`Remove ${item.label}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            )
          )}
        </ul>
      )}

      {max !== undefined && value.length >= max && (
        <p className="rounded-lg border border-gold-500/50 bg-accent px-3 py-2 text-xs text-accent-foreground">
          Maximum of {max} reached — remove one to add another.
        </p>
      )}

      {!(single && value.length > 0) && !(max !== undefined && value.length >= max) && (
        <div className="rounded-xl border border-input bg-background">
          <div className="relative border-b border-border">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="border-0 pl-9 shadow-none focus-visible:ring-0"
              aria-label={placeholder}
            />
          </div>
          <ul className={cn("scrollbar-elegant overflow-y-auto p-1.5", maxListHeight)}>
            {available.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-muted-foreground">Nothing to add</li>
            )}
            {available.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => add(item.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-accent"
                >
                  <Avatar src={item.image} label={item.label} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-navy-900">{item.label}</span>
                    {item.sublabel && <span className="block truncate text-xs text-muted-foreground">{item.sublabel}</span>}
                  </span>
                  {item.draft && (
                    <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-semibold text-gold-600">Draft</span>
                  )}
                  <Plus className="h-4 w-4 shrink-0 text-gold-600" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
