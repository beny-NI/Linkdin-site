"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "@/lib/admin-api";
import { HOME_LIMITS } from "@/lib/admin-schemas";
import { PageHeader, Section } from "@/components/admin/form-bits";
import { PickList } from "@/components/admin/pick-list";
import { SlotPicker, type SlotPerson } from "@/components/admin/slot-picker";
import { useAdminOptions } from "@/components/admin/use-admin-options";

interface Pinned {
  professionals: string[];
  potd: string | null;
  collections: string[];
  stories: string[];
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

  const people = useMemo<SlotPerson[]>(
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
          <Section title="Top of the site — up to 5 people" description="These people appear first on the homepage, in exactly this order. Choose a card style for each.">
            <SlotPicker
              people={people}
              max={HOME_LIMITS.professionals}
              value={pinned.professionals}
              onChange={(ids) => update("professionals", ids)}
              potdId={pinned.potd}
              onPotdChange={(id) => {
                setPinned((p) => (p ? { ...p, potd: id } : p));
                setDirty(true);
              }}
              helpText="Every card has the same size. Give one person the “Person of the Day” tag to show their card with a golden, eye-catching look. You don’t have to fill all 5 slots — only the chosen people are shown. If nobody is chosen, the site shows the first published profiles."
            />
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
