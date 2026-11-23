"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "@/lib/admin-api";
import { PLACEHOLDER_PORTRAIT } from "@/lib/admin-schemas";
import { ConfirmAction } from "@/components/admin/confirm-button";
import { PageHeader, Section } from "@/components/admin/form-bits";
import { ImageField } from "@/components/admin/image-field";
import { useAdminOptions } from "@/components/admin/use-admin-options";

interface DraftListItem {
  id: string;
}

interface Detail {
  id: string;
  slug: string;
  fullName: string;
  professionalTitle: string;
  organization: string;
  city: string;
  countryCode: string;
  summary: string;
  biography: string;
  portraitUrl: string;
  achievements: string[];
  experience: unknown[];
  education: unknown[];
  expertiseIds: string[];
  industryIds: string[];
  [key: string]: unknown;
}

export default function ReviewDraftsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const options = useAdminOptions();
  const [skipped, setSkipped] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [photo, setPhoto] = useState("");

  const list = useQuery<{ items: DraftListItem[]; total: number }>({
    queryKey: ["admin", "review-queue"],
    queryFn: () => adminFetch(`/api/admin/professionals?status=draft&pageSize=100&page=1`),
  });

  // oldest first = the order of the Excel file
  const queue = useMemo(() => (list.data ? [...list.data.items].reverse().map((i) => i.id) : []), [list.data]);
  const currentId = queue[cursor];

  // after a publish / delete the queue shrinks: keep the cursor inside it
  useEffect(() => {
    if (queue.length > 0 && cursor >= queue.length) setCursor(queue.length - 1);
  }, [queue.length, cursor]);

  const detail = useQuery<Detail>({
    queryKey: ["admin", "professional", currentId],
    queryFn: () => adminFetch<Detail>(`/api/admin/professionals/${currentId}`),
    enabled: !!currentId,
  });

  useEffect(() => {
    if (detail.data) setPhoto(detail.data.portraitUrl);
  }, [detail.data]);

  function afterRemoval() {
    // the current draft left the queue: refetch, the next one slides into the same position
    void qc.invalidateQueries();
    setSkipped([]);
  }

  const publish = useMutation({
    mutationFn: () => adminFetch(`/api/admin/professionals/${currentId}`, { method: "PUT", json: { ...detail.data, portraitUrl: photo, published: true } }),
    onSuccess: () => {
      toast({ title: "Published — live on the site", description: detail.data?.fullName });
      afterRemoval();
    },
    onError: (e) => toast({ title: "Could not publish", description: e.message, variant: "destructive" }),
  });

  const savePhotoOnly = useMutation({
    mutationFn: () => adminFetch(`/api/admin/professionals/${currentId}`, { method: "PUT", json: { ...detail.data, portraitUrl: photo, published: false } }),
    onSuccess: () => {
      toast({ title: "Saved as draft" });
      void qc.invalidateQueries({ queryKey: ["admin", "professional", currentId] });
    },
    onError: (e) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: () => adminFetch(`/api/admin/professionals/${currentId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "Deleted" });
      afterRemoval();
    },
    onError: (e) => toast({ title: "Could not delete", description: e.message, variant: "destructive" }),
  });

  const d = detail.data;
  const countryName = options.data?.countries.find((c) => c.code === d?.countryCode)?.name ?? d?.countryCode;
  const expertiseNames = (options.data?.expertise ?? []).filter((e) => d?.expertiseIds.includes(e.id)).map((e) => e.name);
  const needsPhoto = !photo || photo === PLACEHOLDER_PORTRAIT;
  const busy = publish.isPending || remove.isPending || savePhotoOnly.isPending;

  if (list.isLoading) {
    return (
      <>
        <PageHeader title="Review drafts" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </>
    );
  }

  if (queue.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Professionals" title="Review drafts" />
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Check className="mx-auto h-8 w-8 text-emerald-600" aria-hidden />
          <p className="mt-3 font-heading text-lg font-bold text-navy-900">No drafts left to review</p>
          <p className="mt-1 text-sm text-muted-foreground">Import more people from Excel, or add one by hand.</p>
          <div className="mt-5 flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/import">Import from Excel</Link>
            </Button>
            <Button asChild className="bg-gold-500 text-navy-950 hover:bg-gold-400">
              <Link href="/admin/professionals">Back to professionals</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Professionals"
        title="Review drafts"
        description={`Draft ${Math.min(cursor + 1, queue.length)} of ${queue.length}. Check the person, add a photo if needed, then publish — or skip / delete.`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/professionals">Back to list</Link>
          </Button>
        }
      />

      {!d || detail.isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <div className="space-y-6">
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${((cursor + 1) / queue.length) * 100}%` }} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
            <Section title="Photo" description={needsPhoto ? "A photo is required before publishing." : "Looks good."}>
              <ImageField value={photo === PLACEHOLDER_PORTRAIT ? "" : photo} onChange={(v) => setPhoto(v || PLACEHOLDER_PORTRAIT)} kind="portraits" />
              {photo !== d.portraitUrl && (
                <Button size="sm" variant="outline" disabled={busy || needsPhoto} onClick={() => savePhotoOnly.mutate()}>
                  Save photo
                </Button>
              )}
            </Section>

            <Section title={d.fullName} description={`${d.professionalTitle}${d.organization ? ` · ${d.organization}` : ""}`}>
              <p className="text-sm text-navy-800">
                <strong>Location:</strong> {d.city}, {countryName}
              </p>
              {expertiseNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {expertiseNames.map((n) => (
                    <span key={n} className="rounded-full border border-gold-500/50 bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                      {n}
                    </span>
                  ))}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-700">Summary</p>
                <p className="mt-1 text-sm text-navy-800">{d.summary}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy-700">Biography</p>
                <p className="mt-1 line-clamp-6 whitespace-pre-line text-sm text-navy-800">{d.biography}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {d.achievements.length} achievements · {d.experience.length} positions · {d.education.length} education entries
              </p>
              <Button asChild variant="ghost" size="sm" className="px-0">
                <Link href={`/admin/professionals/${d.id}`}>
                  <Pencil aria-hidden /> Edit all fields
                </Link>
              </Button>
            </Section>
          </div>

          <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
              <ConfirmAction title="Delete this draft?" description={`${d.fullName} is removed permanently.`} onConfirm={() => remove.mutate()}>
                <Button variant="ghost" disabled={busy} className="text-destructive hover:text-destructive">
                  <Trash2 aria-hidden /> Delete
                </Button>
              </ConfirmAction>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" disabled={cursor === 0 || busy} onClick={() => setCursor((c) => Math.max(0, c - 1))}>
                  <ArrowLeft aria-hidden /> Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={busy || cursor >= queue.length - 1}
                  onClick={() => {
                    setSkipped((s) => [...s, d.id]);
                    setCursor((c) => c + 1);
                  }}
                >
                  Skip <ArrowRight aria-hidden />
                </Button>
                <Button onClick={() => publish.mutate()} disabled={busy || needsPhoto} className="bg-gold-500 text-navy-950 hover:bg-gold-400">
                  {publish.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />} Approve & publish
                </Button>
              </div>
            </div>
            {skipped.length > 0 && <p className="mx-auto mt-1 max-w-5xl text-right text-[11px] text-muted-foreground">{skipped.length} skipped in this session</p>}
          </div>
        </div>
      )}
    </>
  );
}
