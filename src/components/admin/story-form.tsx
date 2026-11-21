"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "@/lib/admin-api";
import { STORY_CATEGORIES } from "@/lib/admin-schemas";
import { slugify } from "@/lib/slug";
import { ActionBar, Field, PageHeader, Section, StatusBadge } from "@/components/admin/form-bits";
import { ConfirmAction } from "@/components/admin/confirm-button";
import { ImageField } from "@/components/admin/image-field";
import { PickList } from "@/components/admin/pick-list";
import { useAdminOptions } from "@/components/admin/use-admin-options";
import { cn } from "@/lib/utils";

interface FormValues {
  slug: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  author: string;
  category: string;
  excerpt: string;
  content: string;
  publicationDate: string;
  published: boolean;
  professionalIds: string[];
  expertiseIds: string[];
}

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY: FormValues = {
  slug: "",
  title: "",
  subtitle: "",
  coverUrl: "",
  author: "SkilledSphere Editorial",
  category: "Interview",
  excerpt: "",
  content: "",
  publicationDate: today(),
  published: true,
  professionalIds: [],
  expertiseIds: [],
};

const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

export function StoryForm({ id }: { id?: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const options = useAdminOptions();
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [ready, setReady] = useState(!id);

  const existing = useQuery<FormValues>({
    queryKey: ["admin", "story", id],
    queryFn: () => adminFetch<FormValues>(`/api/admin/stories/${id}`),
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

  const readingMinutes = Math.max(1, Math.round(wordCount(values.content) / 200));

  const save = useMutation({
    mutationFn: (published: boolean) => {
      const payload = { ...values, published, slug: values.slug || undefined, readingMinutes };
      return id
        ? adminFetch<{ id: string; slug: string }>(`/api/admin/stories/${id}`, { method: "PUT", json: payload })
        : adminFetch<{ id: string; slug: string }>("/api/admin/stories", { method: "POST", json: payload });
    },
    onSuccess: (res, published) => {
      toast({
        title: published ? "Published — live in the magazine" : "Saved as draft",
        description: published ? `/magazine/${res.slug}` : "It is not visible to visitors yet.",
      });
      void qc.invalidateQueries();
      router.push("/admin/stories");
    },
    onError: (e) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: () => adminFetch(`/api/admin/stories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "Deleted" });
      void qc.invalidateQueries();
      router.push("/admin/stories");
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
  const expertiseItems = useMemo(
    () => (options.data?.expertise ?? []).map((e) => ({ id: e.id, label: e.name, sublabel: e.cluster })),
    [options.data]
  );

  if (!ready || options.isLoading) {
    return (
      <>
        <PageHeader title={id ? "Edit story" : "New story"} />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </>
    );
  }

  const busy = save.isPending || remove.isPending;

  return (
    <>
      <PageHeader
        eyebrow="Magazine"
        title={id ? values.title || "Edit story" : "New story"}
        description="Write the article in Markdown (## headings, **bold**, > quotes, lists)."
        actions={id ? <StatusBadge published={values.published} /> : undefined}
      />

      <div className="space-y-6">
        <Section title="Headline">
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
          <Field label="Subtitle" required htmlFor="subtitle">
            <Input id="subtitle" value={values.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Category" required>
              <select
                value={values.category}
                onChange={(e) => set("category", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                aria-label="Category"
              >
                {STORY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Author" required htmlFor="author">
              <Input id="author" value={values.author} onChange={(e) => set("author", e.target.value)} />
            </Field>
            <Field label="Publication date" required htmlFor="date">
              <Input id="date" type="date" value={values.publicationDate} onChange={(e) => set("publicationDate", e.target.value)} />
            </Field>
          </div>
          <Field
            label="URL slug"
            htmlFor="slug"
            hint={id ? "Changing the slug changes the article’s web address." : "Generated from the title — you can edit it."}
          >
            <Input
              id="slug"
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
              placeholder="auto-generated"
              className="max-w-md"
            />
          </Field>
        </Section>

        <Section title="Cover image" description="Shown as a square card on the homepage and in the magazine.">
          <ImageField value={values.coverUrl} onChange={(v) => set("coverUrl", v)} kind="covers" aspect="aspect-square" />
        </Section>

        <Section title="Article">
          <Field label="Excerpt" required htmlFor="excerpt" hint={`${values.excerpt.length}/600 — teaser shown on cards`}>
            <Textarea id="excerpt" rows={3} maxLength={600} value={values.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="inline-flex rounded-lg border border-border bg-background p-1 text-sm">
                {(["write", "preview"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cn(
                      "rounded-md px-3 py-1 font-medium capitalize transition-colors",
                      tab === t ? "bg-navy-900 text-gold-400" : "text-muted-foreground hover:text-navy-900"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {wordCount(values.content)} words · ≈ {readingMinutes} min read
              </p>
            </div>
            {tab === "write" ? (
              <Textarea
                rows={22}
                value={values.content}
                onChange={(e) => set("content", e.target.value)}
                placeholder={"Write your story here…\n\n## A heading\n\nParagraph text with **bold** and *italic*."}
                className="font-mono text-sm leading-relaxed"
                aria-label="Article content (Markdown)"
              />
            ) : (
              <div className="min-h-[24rem] rounded-xl border border-border bg-warmwhite p-6 sm:p-8">
                {values.content.trim() ? (
                  <div className="prose-skilledsphere">
                    <ReactMarkdown>{values.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
                )}
              </div>
            )}
          </div>
        </Section>

        <Section title="Connections" description="Related people link the story to their profiles; expertise tags feed “related stories”.">
          <Field label="Featured professionals">
            <PickList
              items={professionalItems}
              value={values.professionalIds}
              onChange={(v) => set("professionalIds", v)}
              placeholder="Search professionals…"
            />
          </Field>
          <Field label="Expertise tags">
            <PickList items={expertiseItems} value={values.expertiseIds} onChange={(v) => set("expertiseIds", v)} placeholder="Search expertise…" />
          </Field>
        </Section>
      </div>

      <ActionBar>
        {id && (
          <ConfirmAction
            title="Delete this story?"
            description="The article is permanently removed from the magazine. This cannot be undone."
            onConfirm={() => remove.mutate()}
          >
            <Button type="button" variant="ghost" disabled={busy} className="mr-auto text-destructive hover:text-destructive">
              <Trash2 aria-hidden /> Delete
            </Button>
          </ConfirmAction>
        )}
        {id && values.published && (
          <Button asChild type="button" variant="ghost">
            <Link href={`/magazine/${values.slug}`} target="_blank">
              <ExternalLink aria-hidden /> View on site
            </Link>
          </Button>
        )}
        <Button type="button" variant="outline" disabled={busy} onClick={() => router.push("/admin/stories")}>
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
