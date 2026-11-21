"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "@/lib/admin-api";
import { slugify } from "@/lib/slug";
import { ActionBar, Field, PageHeader, Section, StatusBadge } from "@/components/admin/form-bits";
import { ConfirmAction } from "@/components/admin/confirm-button";
import { ImageField } from "@/components/admin/image-field";
import { PickList } from "@/components/admin/pick-list";
import { useAdminOptions } from "@/components/admin/use-admin-options";

interface FormValues {
  slug: string;
  title: string;
  description: string;
  coverUrl: string;
  kind: string;
  edition: string;
  published: boolean;
  memberIds: string[];
}

const EMPTY: FormValues = {
  slug: "",
  title: "",
  description: "",
  coverUrl: "",
  kind: "editorial",
  edition: "",
  published: true,
  memberIds: [],
};

export function CollectionForm({ id }: { id?: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const options = useAdminOptions();
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [ready, setReady] = useState(!id);

  const existing = useQuery<FormValues>({
    queryKey: ["admin", "collection", id],
    queryFn: () => adminFetch<FormValues>(`/api/admin/collections/${id}`),
    enabled: !!id,
  });

  useEffect(() => {
    if (existing.data) {
      setValues({ ...EMPTY, ...existing.data });
      setSlugTouched(true);
      setReady(true);
    }
  }, [existing.data]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  const save = useMutation({
    mutationFn: (published: boolean) => {
      const payload = { ...values, published, slug: values.slug || undefined };
      return id
        ? adminFetch<{ id: string; slug: string }>(`/api/admin/collections/${id}`, { method: "PUT", json: payload })
        : adminFetch<{ id: string; slug: string }>("/api/admin/collections", { method: "POST", json: payload });
    },
    onSuccess: (res, published) => {
      toast({
        title: published ? "Published — live on the site" : "Saved as draft",
        description: published ? `/collections/${res.slug}` : "It is not visible to visitors yet.",
      });
      void qc.invalidateQueries();
      router.push("/admin/collections");
    },
    onError: (e) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: () => adminFetch(`/api/admin/collections/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "Deleted" });
      void qc.invalidateQueries();
      router.push("/admin/collections");
    },
    onError: (e) => toast({ title: "Could not delete", description: e.message, variant: "destructive" }),
  });

  const professionalItems = useMemo(
    () =>
      (options.data?.professionals ?? []).map((p) => ({
        id: p.id,
        label: p.fullName,
        sublabel: p.professionalTitle,
        image: p.portraitUrl,
        draft: !p.published,
      })),
    [options.data]
  );

  if (!ready || options.isLoading) {
    return (
      <>
        <PageHeader title={id ? "Edit collection" : "New collection"} />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </>
    );
  }

  const busy = save.isPending || remove.isPending;

  return (
    <>
      <PageHeader
        eyebrow="Collections"
        title={id ? values.title || "Edit collection" : "New collection"}
        description="A curated group of people. For rankings, the order below is the ranking."
        actions={id ? <StatusBadge published={values.published} /> : undefined}
      />

      <div className="space-y-6">
        <Section title="Details">
          <Field label="Title" required htmlFor="title">
            <Input
              id="title"
              value={values.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (!slugTouched && !id) set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="Description" required htmlFor="desc">
            <Textarea id="desc" rows={4} value={values.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Type" required>
              <select
                value={values.kind}
                onChange={(e) => set("kind", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                aria-label="Collection type"
              >
                <option value="editorial">Editorial selection</option>
                <option value="ranking">Ranking</option>
              </select>
            </Field>
            <Field label="Edition" htmlFor="edition" hint="e.g. 2026 Edition">
              <Input id="edition" value={values.edition} onChange={(e) => set("edition", e.target.value)} />
            </Field>
            <Field label="URL slug" htmlFor="slug">
              <Input
                id="slug"
                value={values.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
                placeholder="auto-generated"
              />
            </Field>
          </div>
        </Section>

        <Section title="Cover image">
          <ImageField value={values.coverUrl} onChange={(v) => set("coverUrl", v)} kind="covers" aspect="aspect-[4/3]" />
        </Section>

        <Section title="People in this collection" description="Use the arrows to set the order shown on the site.">
          <PickList
            ordered
            items={professionalItems}
            value={values.memberIds}
            onChange={(v) => set("memberIds", v)}
            placeholder="Search professionals to add…"
            maxListHeight="max-h-72"
          />
        </Section>
      </div>

      <ActionBar>
        {id && (
          <ConfirmAction
            title="Delete this collection?"
            description="The collection page is removed. The people in it are not deleted."
            onConfirm={() => remove.mutate()}
          >
            <Button type="button" variant="ghost" disabled={busy} className="mr-auto text-destructive hover:text-destructive">
              <Trash2 aria-hidden /> Delete
            </Button>
          </ConfirmAction>
        )}
        {id && values.published && (
          <Button asChild type="button" variant="ghost">
            <Link href={`/collections/${values.slug}`} target="_blank">
              <ExternalLink aria-hidden /> View on site
            </Link>
          </Button>
        )}
        <Button type="button" variant="outline" disabled={busy} onClick={() => router.push("/admin/collections")}>
          Cancel
        </Button>
        {values.published && id ? (
          <>
            <Button type="button" variant="outline" disabled={busy} onClick={() => save.mutate(false)}>
              Unpublish
            </Button>
            <Button type="button" disabled={busy} onClick={() => save.mutate(true)} className="bg-gold-500 text-navy-950 hover:bg-gold-400">
              {save.isPending && <Loader2 className="animate-spin" aria-hidden />} Save changes
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" disabled={busy} onClick={() => save.mutate(false)}>
              Save as draft
            </Button>
            <Button type="button" disabled={busy} onClick={() => save.mutate(true)} className="bg-gold-500 text-navy-950 hover:bg-gold-400">
              {save.isPending && <Loader2 className="animate-spin" aria-hidden />} Publish
            </Button>
          </>
        )}
      </ActionBar>
    </>
  );
}
