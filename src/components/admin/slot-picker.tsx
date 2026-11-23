"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Plus, Search, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SlotPerson {
  id: string;
  fullName: string;
  professionalTitle: string;
  portraitUrl: string;
  flag: string;
}

/**
 * Left: ALL people (searchable, click to add / remove).
 * Right: numbered slots (max N) with up / down. Optional "Person of the Day" tag per slot.
 */
export function SlotPicker({
  people,
  value,
  onChange,
  max,
  potdId,
  onPotdChange,
  helpText,
}: {
  people: SlotPerson[];
  value: string[];
  onChange: (ids: string[]) => void;
  max: number;
  potdId?: string | null;
  onPotdChange?: (id: string | null) => void;
  helpText?: string;
}) {
  const [query, setQuery] = useState("");
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const chosen = value.map((id) => byId.get(id)).filter((p): p is SlotPerson => !!p);
  const full = chosen.length >= max;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter((p) => !q || p.fullName.toLowerCase().includes(q) || p.professionalTitle.toLowerCase().includes(q));
  }, [people, query]);

  function move(i: number, dir: -1 | 1) {
    const next = [...value];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id));
    if (potdId === id) onPotdChange?.(null);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-background">
        <div className="border-b border-border p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-navy-700">1 · All people ({people.length})</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or title…" className="bg-card pl-9" aria-label="Search people" />
          </div>
        </div>
        <ul className="scrollbar-elegant max-h-[28rem] overflow-y-auto p-1.5">
          {visible.length === 0 && <li className="px-3 py-6 text-center text-xs text-muted-foreground">No one found</li>}
          {visible.map((p) => {
            const on = value.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={!on && full}
                  onClick={() => (on ? remove(p.id) : onChange([...value, p.id]))}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                    on ? "bg-accent" : "hover:bg-accent/60",
                    !on && full && "cursor-not-allowed opacity-40"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.portraitUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover object-top" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-navy-900">
                      {p.fullName} {p.flag}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{p.professionalTitle}</span>
                  </span>
                  {on ? (
                    <span className="flex items-center gap-1 rounded-full bg-navy-900 px-2 py-0.5 text-[11px] font-semibold text-gold-400">
                      <Check className="h-3 w-3" aria-hidden /> #{value.indexOf(p.id) + 1}
                    </span>
                  ) : (
                    <Plus className="h-4 w-4 shrink-0 text-gold-600" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-background p-3">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-navy-700">
          2 · Chosen ({chosen.length}/{max})
        </p>
        <ol className="space-y-2">
          {Array.from({ length: max }).map((_, i) => {
            const p = chosen[i];
            if (!p) {
              return (
                <li key={`empty-${i}`} className="flex items-center gap-3 rounded-xl border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary font-bold">{i + 1}</span>
                  Empty slot — optional
                </li>
              );
            }
            const isPotd = potdId === p.id;
            return (
              <li
                key={p.id}
                className={cn(
                  "rounded-xl border bg-card px-3 py-2",
                  isPotd ? "border-gold-500 shadow-[0_0_0_2px_rgba(198,169,107,0.35)]" : "border-gold-500/40"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-gold-400">{i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.portraitUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover object-top" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-navy-900">{p.fullName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{p.professionalTitle}</span>
                  </span>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1.5 text-navy-600 hover:bg-navy-50 disabled:opacity-30" aria-label={`Move ${p.fullName} up`}>
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === chosen.length - 1} className="rounded p-1.5 text-navy-600 hover:bg-navy-50 disabled:opacity-30" aria-label={`Move ${p.fullName} down`}>
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => remove(p.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10" aria-label={`Remove ${p.fullName}`}>
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {onPotdChange && (
                  <div className="mt-2 inline-flex rounded-lg border border-border bg-background p-0.5 text-xs" role="group" aria-label={`Card style for ${p.fullName}`}>
                    <button
                      type="button"
                      onClick={() => isPotd && onPotdChange(null)}
                      className={cn("rounded-md px-3 py-1 font-semibold transition-colors", !isPotd ? "bg-navy-900 text-gold-400" : "text-muted-foreground hover:text-navy-900")}
                    >
                      Normal card
                    </button>
                    <button
                      type="button"
                      onClick={() => onPotdChange(p.id)}
                      className={cn("flex items-center gap-1 rounded-md px-3 py-1 font-semibold transition-colors", isPotd ? "bg-gold-500 text-navy-950" : "text-muted-foreground hover:text-navy-900")}
                    >
                      <Sparkles className="h-3 w-3" aria-hidden /> Person of the Day
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        {helpText && <p className="mt-3 text-xs text-muted-foreground">{helpText}</p>}
      </div>
    </div>
  );
}
