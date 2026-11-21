"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Check, ExternalLink, Loader2, Plus, Save, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "@/lib/admin-api";
import { HOME_LIMITS } from "@/lib/admin-schemas";
import { PageHeader, Section } from "@/components/admin/form-bits";
import { PickList } from "@/components/admin/pick-list";
import { useAdminOptions } from "@/components/admin/use-admin-options";
import { cn } from "@/lib/utils";

interface Pinned {
  professionals: string[];
  collections: string[];
  stories: string[];
}

interface Person {
  id: string;
  fullName: string;
  professionalTitle: string;
  portraitUrl: string;
  flag: string;
}

/** Left: ALL published people. Right: the (max 5) slots at the top of the site, in order. */
function HeroPicker({ people, value, onChange }: { people: Person[]; value: string[]; onChange: (ids: string[]) => void }) {
  const [query, setQuery] = useState("");
  const max = HOME_LIMITS.professionals;
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const chosen = value.map((id) => byId.get(id)).filter((p): p is Person => !!p);
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

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* all people */}
      <div className="rounded-xl border border-border bg-background">
        <div className="border-b border-border p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-navy-700">
            1 · All people ({people.length})
          </p>
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
                  onClick={() => (on ? onChange(value.filter((v) => v !== p.id)) : onChange([...value, p.id]))}
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

      {/* chosen slots */}
      <div className="rounded-xl border border-border bg-background p-3">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-navy-700">
          2 · Shown at the top of the site ({chosen.length}/{max})
        </p>
        <ol className="space-y-2">
          {Array.from({ length: max }).map((_, i) => {
            const p = chosen[i];
            return p ? (
              <li key={p.id} className="flex items-center gap-3 rounded-xl border border-gold-500/50 bg-card px-3 py-2">
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
                <button type="button" onClick={() => onChange(value.filter((v) => v !== p.id))} className="rounded p-1.5 text-destructive hover:bg-destructive/10" aria-label={`Remove ${p.fullName}`}>
                  <X className="h-4 w-4" />
                </button>
              </li>
            ) : (
              <li key={`empty-${i}`} className="flex items-center gap-3 rounded-xl border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary font-bold">{i + 1}</span>
                Empty slot — optional
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">
          Click a person on the left to add or remove them. You don’t need to fill all 5 slots — only the chosen people are shown.
          If you choose nobody, the site automatically shows the first published profiles.
        </p>
      </div>
    </div>
  );
}

export default function HomepageAdminPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const options = useAdminOptions();
  const [pinned, setPinned] = useState<Pinned | null>(null);
  const [dirty, setDirty] = useState(false);

  const current = useQuery<Pinned>({
    queryKey: ["admin", "homepage"],
    queryFn: () => adminFetch<Pinned>("/api/admin/homepage"),
  });

  useEffect(() => {
    if (current.data && !pinned) setPinned(current.data);
  }, [current.data, pinned]);

  function update(key: keyof Pinned, ids: string[]) {
    setPinned((p) => (p ? { ...p, [key]: ids } : p));
    setDirty(true);
  }

  const save = useMutation({
    mutationFn: () => adminFetch("/api/admin/homepage", { method: "PUT", json: pinned }),
    onSuccess: () => {
      toast({ title: "Homepage updated", description: "Your selection is live on the site." });
      setDirty(false);
      void qc.invalidateQueries();
    },
    onError: (e) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });

  const people = useMemo<Person[]>(
    () => (options.data?.professionals ?? []).filter((p) => p.published),
    [options.data]
  );
  const collections = useMemo(
    () => (options.data?.collections ?? []).filter((c) => c.published).map((c) => ({ id: c.id, label: c.title, sublabel: c.kind })),
    [options.data]
  );
  const stories = useMemo(
    () => (options.data?.stories ?? []).filter((s) => s.published).map((s) => ({ id: s.id, label: s.title, sublabel: s.category })),
    [options.data]
  );

  const loading = options.isLoading || current.isLoading || !pinned;

  return (
    <>
      <PageHeader
        eyebrow="Homepage"
        title="Homepage"
        description="Choose what visitors see first. Changes go live when you press “Publish changes”."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <a href="/" target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden /> Open homepage
              </a>
            </Button>
            <Button size="sm" onClick={() => save.mutate()} disabled={!dirty || save.isPending} className="bg-gold-500 text-navy-950 hover:bg-gold-400">
              {save.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
              Publish changes
            </Button>
          </>
        }
      />

      {loading || !pinned ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <div className="space-y-6">
          <Section title="Top of the site — up to 5 people" description="These people appear first on the homepage, in exactly this order.">
            <HeroPicker people={people} value={pinned.professionals} onChange={(ids) => update("professionals", ids)} />
          </Section>

          <Section title="Collections — up to 3" description="Pinned collections come first on the homepage; if you pin fewer than 3, the rest are filled in automatically.">
            <PickList ordered max={HOME_LIMITS.collections} items={collections} value={pinned.collections} onChange={(ids) => update("collections", ids)} placeholder="Search published collections…" />
          </Section>

          <Section title="Stories — up to 3" description="Pinned stories come first; if you pin fewer than 3, the newest stories fill the rest.">
            <PickList ordered max={HOME_LIMITS.stories} items={stories} value={pinned.stories} onChange={(ids) => update("stories", ids)} placeholder="Search published stories…" />
          </Section>
        </div>
      )}
    </>
  );
}
