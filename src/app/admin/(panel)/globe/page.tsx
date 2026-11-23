"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "@/lib/admin-api";
import { PageHeader, Section } from "@/components/admin/form-bits";
import { SlotPicker } from "@/components/admin/slot-picker";
import { cn } from "@/lib/utils";

interface CountryRow {
  code: string;
  name: string;
  flag: string;
  total: number;
  chosen: number;
}

interface CountryPeople {
  people: { id: string; fullName: string; professionalTitle: string; portraitUrl: string; flag: string }[];
  chosen: string[];
}

const MAX = 5;

export default function GlobeAdminPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [value, setValue] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  const countries = useQuery<{ countries: CountryRow[] }>({
    queryKey: ["admin", "globe"],
    queryFn: () => adminFetch<{ countries: CountryRow[] }>("/api/admin/globe"),
  });

  const people = useQuery<CountryPeople>({
    queryKey: ["admin", "globe", selected],
    queryFn: () => adminFetch<CountryPeople>(`/api/admin/globe?country=${selected}`),
    enabled: !!selected,
  });

  useEffect(() => {
    if (people.data) {
      setValue(people.data.chosen);
      setDirty(false);
    }
  }, [people.data]);

  const save = useMutation({
    mutationFn: () => adminFetch("/api/admin/globe", { method: "PUT", json: { country: selected, ids: value } }),
    onSuccess: () => {
      toast({ title: "Saved — live on the globe", description: "Visitors now see these people when they click the country." });
      setDirty(false);
      void qc.invalidateQueries();
    },
    onError: (e) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (countries.data?.countries ?? []).filter((c) => c.total > 0 && (!q || c.name.toLowerCase().includes(q)));
  }, [countries.data, query]);

  const current = countries.data?.countries.find((c) => c.code === selected);

  function pick(code: string) {
    if (dirty && !window.confirm("You have unsaved changes for this country. Switch anyway?")) return;
    setSelected(code);
    setValue([]);
    setDirty(false);
  }

  return (
    <>
      <PageHeader
        eyebrow="Homepage"
        title="Globe countries"
        description="When a visitor clicks a country on the globe, they see up to 5 people. Choose who — and in which order — for each country."
        actions={
          <Button size="sm" onClick={() => save.mutate()} disabled={!selected || !dirty || save.isPending} className="bg-gold-500 text-navy-950 hover:bg-gold-400">
            {save.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />} Publish changes
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-navy-700">Step 1 · Choose a country</p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search countries…" className="pl-9" aria-label="Search countries" />
            </div>
          </div>
          <ul className="scrollbar-elegant max-h-[32rem] overflow-y-auto p-1.5">
            {countries.isLoading && <Skeleton className="m-2 h-24" />}
            {list.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => pick(c.code)}
                  className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors", selected === c.code ? "bg-navy-900 text-white" : "hover:bg-accent")}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                  <span className={cn("shrink-0 text-xs", selected === c.code ? "text-gold-400" : "text-muted-foreground")}>
                    {c.total > MAX ? `${c.chosen}/${MAX} of ${c.total}` : `${c.total}`}
                  </span>
                </button>
              </li>
            ))}
            {countries.data && list.length === 0 && <li className="px-3 py-6 text-center text-xs text-muted-foreground">No country with published people.</li>}
          </ul>
        </div>

        <div>
          {!selected ? (
            <div className="flex h-full min-h-48 items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Pick a country on the left.
            </div>
          ) : people.isLoading || !people.data ? (
            <Skeleton className="h-96 w-full rounded-2xl" />
          ) : (
            <Section
              title={`${current?.flag ?? ""} ${current?.name ?? selected} — up to ${MAX} people`}
              description={
                people.data.people.length <= MAX
                  ? "This country has 5 or fewer people, so all of them are shown anyway — you can still set their order."
                  : "Step 2 · The chosen people are listed first when the country is clicked. If you choose fewer than 5, the rest are filled in A–Z."
              }
            >
              <SlotPicker
                people={people.data.people}
                max={MAX}
                value={value}
                onChange={(ids) => {
                  setValue(ids);
                  setDirty(true);
                }}
              />
            </Section>
          )}
        </div>
      </div>
    </>
  );
}
