"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import worldCountries from "world-countries";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "@/lib/admin-api";
import { EXPERTISE_CLUSTERS } from "@/lib/admin-schemas";
import { ConfirmAction } from "@/components/admin/confirm-button";
import { Field, PageHeader } from "@/components/admin/form-bits";
import { cn } from "@/lib/utils";

type Kind = "expertise" | "industries" | "countries";

interface Row {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  cluster?: string;
  order?: number;
  parentId?: string | null;
  code?: string;
  flag?: string;
  latitude?: number;
  longitude?: number;
  count: number;
}

const wc = worldCountries as Array<{ cca2: string; name: { common: string }; flag: string; latlng: [number, number] }>;

const TABS: { kind: Kind; label: string; hint: string }[] = [
  { kind: "expertise", label: "Expertise", hint: "Areas like “Artificial Intelligence”. Can be nested under a parent." },
  { kind: "industries", label: "Industries", hint: "Sectors like “Healthcare”." },
  { kind: "countries", label: "Countries", hint: "Needed before you can add people from a new country; each one appears on the globe." },
];

const selectCls =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export default function TaxonomyAdminPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [kind, setKind] = useState<Kind>("expertise");
  const [editing, setEditing] = useState<Partial<Row> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const { data } = useQuery<{ items: Row[] }>({
    queryKey: ["admin", "taxonomy", kind],
    queryFn: () => adminFetch<{ items: Row[] }>(`/api/admin/taxonomy/${kind}`),
  });
  const rows = useMemo(() => data?.items ?? [], [data]);
  const tab = TABS.find((t) => t.kind === kind)!;

  const save = useMutation({
    mutationFn: () => {
      const e = editing!;
      let body: Record<string, unknown>;
      if (kind === "expertise") {
        body = { name: e.name ?? "", slug: e.slug || undefined, description: e.description ?? "", cluster: e.cluster ?? "Technology", order: Number(e.order ?? 0), parentId: e.parentId || null };
      } else if (kind === "industries") {
        body = { name: e.name ?? "", slug: e.slug || undefined, description: e.description ?? "", order: Number(e.order ?? 0) };
      } else {
        body = { code: e.code ?? "", name: e.name ?? "", flag: e.flag ?? "", latitude: Number(e.latitude), longitude: Number(e.longitude) };
      }
      return isNew
        ? adminFetch(`/api/admin/taxonomy/${kind}`, { method: "POST", json: body })
        : adminFetch(`/api/admin/taxonomy/${kind}/${e.id}`, { method: "PUT", json: body });
    },
    onSuccess: () => {
      toast({ title: "Saved — live on the site" });
      setEditing(null);
      void qc.invalidateQueries();
    },
    onError: (e) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminFetch(`/api/admin/taxonomy/${kind}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "Deleted" });
      void qc.invalidateQueries();
    },
    onError: (e) => toast({ title: "Could not delete", description: e.message, variant: "destructive" }),
  });

  const existingCodes = new Set(rows.map((r) => r.code));
  const countrySuggestions = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return [];
    return wc.filter((c) => !existingCodes.has(c.cca2) && c.name.common.toLowerCase().includes(q)).slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countrySearch, rows]);

  function set(patch: Partial<Row>) {
    setEditing((e) => ({ ...e, ...patch }));
  }

  return (
    <>
      <PageHeader eyebrow="Setup" title="Expertise & places" description="The categories that organise the whole site." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-border bg-card p-1 text-sm">
          {TABS.map((t) => (
            <button
              key={t.kind}
              type="button"
              onClick={() => setKind(t.kind)}
              className={cn(
                "rounded-md px-3 py-1 font-medium transition-colors",
                kind === t.kind ? "bg-navy-900 text-gold-400" : "text-muted-foreground hover:text-navy-900"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{tab.hint}</p>
        <Button
          size="sm"
          className="ml-auto bg-gold-500 text-navy-950 hover:bg-gold-400"
          onClick={() => {
            setIsNew(true);
            setCountrySearch("");
            setEditing(kind === "expertise" ? { cluster: "Technology", order: rows.length + 1 } : kind === "industries" ? { order: rows.length + 1 } : {});
          }}
        >
          <Plus aria-hidden /> Add
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-5 py-3">
              {r.flag && <span className="text-xl">{r.flag}</span>}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy-900">
                  {r.name}
                  {r.parentId && <span className="ml-2 text-xs font-normal text-muted-foreground">(sub-area)</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.cluster ? `${r.cluster} · ` : ""}
                  {r.code ? `${r.code} · ` : ""}
                  {r.count} profile{r.count === 1 ? "" : "s"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Edit"
                onClick={() => {
                  setIsNew(false);
                  setEditing(r);
                }}
              >
                <Pencil />
              </Button>
              <ConfirmAction
                title={`Delete “${r.name}”?`}
                description={
                  kind === "countries"
                    ? "Only possible when no profile uses this country."
                    : "It is removed from every profile and story that uses it."
                }
                onConfirm={() => remove.mutate(r.id)}
              >
                <Button variant="ghost" size="icon" aria-label="Delete" className="text-destructive hover:text-destructive">
                  <Trash2 />
                </Button>
              </ConfirmAction>
            </li>
          ))}
          {rows.length === 0 && <li className="py-10 text-center text-sm text-muted-foreground">Nothing yet.</li>}
        </ul>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isNew ? "Add" : "Edit"} {kind === "countries" ? "country" : kind === "industries" ? "industry" : "expertise"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              {kind === "countries" && isNew && (
                <Field label="Find a country" hint="Type a name — flag and map position are filled in for you.">
                  <Input value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} placeholder="e.g. Portugal" />
                  {countrySuggestions.length > 0 && (
                    <ul className="mt-1 rounded-lg border border-border">
                      {countrySuggestions.map((c) => (
                        <li key={c.cca2}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                            onClick={() => {
                              set({ code: c.cca2, name: c.name.common, flag: c.flag, latitude: c.latlng[0], longitude: c.latlng[1] });
                              setCountrySearch("");
                            }}
                          >
                            <span>{c.flag}</span> {c.name.common} <span className="ml-auto text-xs text-muted-foreground">{c.cca2}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Field>
              )}

              <Field label="Name" required>
                <Input value={editing.name ?? ""} onChange={(e) => set({ name: e.target.value })} />
              </Field>

              {kind === "countries" ? (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Code" hint="ISO 2-letter">
                    <Input value={editing.code ?? ""} disabled={!isNew} maxLength={2} onChange={(e) => set({ code: e.target.value.toUpperCase() })} />
                  </Field>
                  <Field label="Flag emoji">
                    <Input value={editing.flag ?? ""} onChange={(e) => set({ flag: e.target.value })} />
                  </Field>
                  <Field label="Latitude">
                    <Input type="number" step="any" value={editing.latitude ?? ""} onChange={(e) => set({ latitude: e.target.value === "" ? undefined : Number(e.target.value) })} />
                  </Field>
                  <Field label="Longitude">
                    <Input type="number" step="any" value={editing.longitude ?? ""} onChange={(e) => set({ longitude: e.target.value === "" ? undefined : Number(e.target.value) })} />
                  </Field>
                </div>
              ) : (
                <>
                  <Field label="Description">
                    <Textarea rows={3} value={editing.description ?? ""} onChange={(e) => set({ description: e.target.value })} />
                  </Field>
                  {kind === "expertise" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Cluster">
                          <select className={selectCls} value={editing.cluster ?? "Technology"} onChange={(e) => set({ cluster: e.target.value })} aria-label="Cluster">
                            {EXPERTISE_CLUSTERS.map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Parent (optional)">
                          <select className={selectCls} value={editing.parentId ?? ""} onChange={(e) => set({ parentId: e.target.value || null })} aria-label="Parent">
                            <option value="">— none (top level) —</option>
                            {rows
                              .filter((r) => r.id !== editing.id && !r.parentId)
                              .map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                          </select>
                        </Field>
                      </div>
                    </>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Sort order">
                      <Input type="number" value={editing.order ?? 0} onChange={(e) => set({ order: Number(e.target.value) })} />
                    </Field>
                    <Field label="URL slug" hint="Blank = automatic">
                      <Input value={editing.slug ?? ""} onChange={(e) => set({ slug: e.target.value })} />
                    </Field>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-gold-500 text-navy-950 hover:bg-gold-400">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
