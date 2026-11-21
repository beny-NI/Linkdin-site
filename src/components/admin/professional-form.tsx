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
import type { AwardItem, EducationItem, ExperienceItem, LinkItem, ProjectItem, PublicationItem } from "@/lib/types";
import { ActionBar, Field, PageHeader, Section, StatusBadge } from "@/components/admin/form-bits";
import { ConfirmAction } from "@/components/admin/confirm-button";
import { ImageField } from "@/components/admin/image-field";
import { LinkedInImport, type AutofillFields } from "@/components/admin/linkedin-import";
import { ListEditor, StringListEditor } from "@/components/admin/list-editor";
import { PickList } from "@/components/admin/pick-list";
import { useAdminOptions } from "@/components/admin/use-admin-options";

interface FormValues {
  slug: string;
  fullName: string;
  professionalTitle: string;
  summary: string;
  biography: string;
  portraitUrl: string;
  city: string;
  organization: string;
  countryCode: string;
  achievements: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  publications: PublicationItem[];
  awards: AwardItem[];
  links: LinkItem[];
  expertiseIds: string[];
  industryIds: string[];
  published: boolean;
}

const EMPTY: FormValues = {
  slug: "",
  fullName: "",
  professionalTitle: "",
  summary: "",
  biography: "",
  portraitUrl: "",
  city: "",
  organization: "",
  countryCode: "",
  achievements: [],
  experience: [],
  education: [],
  projects: [],
  publications: [],
  awards: [],
  links: [],
  expertiseIds: [],
  industryIds: [],
  published: true,
};

interface ApplicationDetail {
  fullName: string;
  professionalTitle: string;
  countryCode: string;
  biography: string;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  photoUrl: string | null;
  achievements: string[];
}

export function ProfessionalForm({ id, fromApplication }: { id?: string; fromApplication?: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const options = useAdminOptions();
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [ready, setReady] = useState(!id && !fromApplication);

  const existing = useQuery<FormValues>({
    queryKey: ["admin", "professional", id],
    queryFn: () => adminFetch<FormValues>(`/api/admin/professionals/${id}`),
    enabled: !!id,
  });

  const application = useQuery<ApplicationDetail>({
    queryKey: ["admin", "application", fromApplication],
    queryFn: () => adminFetch<ApplicationDetail>(`/api/admin/applications/${fromApplication}`),
    enabled: !!fromApplication && !id,
  });

  useEffect(() => {
    if (existing.data) {
      setValues({ ...EMPTY, ...existing.data });
      setSlugTouched(true);
      setReady(true);
    }
  }, [existing.data]);

  useEffect(() => {
    const a = application.data;
    if (!a) return;
    const links: LinkItem[] = [];
    if (a.linkedinUrl) links.push({ label: "LinkedIn", url: a.linkedinUrl });
    if (a.websiteUrl) links.push({ label: "Website", url: a.websiteUrl });
    setValues({
      ...EMPTY,
      fullName: a.fullName,
      professionalTitle: a.professionalTitle,
      countryCode: a.countryCode,
      biography: a.biography,
      summary: a.biography.slice(0, 220),
      portraitUrl: a.photoUrl ?? "",
      achievements: a.achievements,
      links,
      published: false,
    });
    setReady(true);
  }, [application.data]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  /** Fill ONLY empty fields from the LinkedIn import. Returns how many fields were filled. */
  function applyAutofill(fields: AutofillFields): number {
    let filled = 0;
    setValues((current) => {
      const next = { ...current } as Record<string, unknown>;
      for (const [key, incoming] of Object.entries(fields)) {
        if (!(key in current)) continue;
        const existing = (current as unknown as Record<string, unknown>)[key];
        const hasValue = Array.isArray(existing) ? existing.length > 0 : typeof existing === "string" ? existing.trim() !== "" : false;
        const hasIncoming = Array.isArray(incoming) ? incoming.length > 0 : typeof incoming === "string" ? incoming.trim() !== "" : false;
        if (!hasValue && hasIncoming) {
          next[key] = incoming;
          filled++;
        }
      }
      if (!slugTouched && !current.slug && typeof next.fullName === "string" && next.fullName) next.slug = slugify(next.fullName);
      return next as unknown as FormValues;
    });
    return filled;
  }

  const save = useMutation({
    mutationFn: async (published: boolean) => {
      const payload = { ...values, published, slug: values.slug || undefined };
      if (id) return adminFetch<{ id: string; slug: string }>(`/api/admin/professionals/${id}`, { method: "PUT", json: payload });
      const created = await adminFetch<{ id: string; slug: string }>("/api/admin/professionals", { method: "POST", json: payload });
      if (fromApplication) {
        // the application has been turned into a profile
        await adminFetch(`/api/admin/applications/${fromApplication}`, { method: "PATCH", json: { status: "approved" } }).catch(() => null);
      }
      return created;
    },
    onSuccess: (res, published) => {
      toast({
        title: published ? "Published — live on the site" : "Saved as draft",
        description: published ? `/professionals/${res.slug}` : "It is not visible to visitors yet.",
      });
      void qc.invalidateQueries();
      router.push("/admin/professionals");
    },
    onError: (e) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: () => adminFetch(`/api/admin/professionals/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "Deleted" });
      void qc.invalidateQueries();
      router.push("/admin/professionals");
    },
    onError: (e) => toast({ title: "Could not delete", description: e.message, variant: "destructive" }),
  });

  const expertiseItems = useMemo(
    () => (options.data?.expertise ?? []).map((e) => ({ id: e.id, label: e.name, sublabel: e.cluster })),
    [options.data]
  );
  const industryItems = useMemo(
    () => (options.data?.industries ?? []).map((i) => ({ id: i.id, label: i.name })),
    [options.data]
  );

  if (!ready || options.isLoading) {
    return (
      <>
        <PageHeader title={id ? "Edit professional" : "New professional"} />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </>
    );
  }

  const countries = options.data?.countries ?? [];
  const busy = save.isPending || remove.isPending;

  return (
    <>
      <PageHeader
        eyebrow="Professionals"
        title={id ? values.fullName || "Edit professional" : "New professional"}
        description={
          fromApplication
            ? "Pre-filled from a “Get featured” application. Review everything, then publish."
            : "Fill in the profile exactly as it will appear on the site."
        }
        actions={id ? <StatusBadge published={values.published} /> : undefined}
      />

      <div className="space-y-6">
        {!id && <LinkedInImport onResult={applyAutofill} />}

        <Section title="Basics">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Full name" required htmlFor="fullName">
              <Input
                id="fullName"
                value={values.fullName}
                onChange={(e) => {
                  set("fullName", e.target.value);
                  if (!slugTouched && !id) set("slug", slugify(e.target.value));
                }}
              />
            </Field>
            <Field label="Professional title" required htmlFor="title" hint="e.g. Chief AI Scientist">
              <Input id="title" value={values.professionalTitle} onChange={(e) => set("professionalTitle", e.target.value)} />
            </Field>
            <Field label="Organization" htmlFor="org">
              <Input id="org" value={values.organization} onChange={(e) => set("organization", e.target.value)} />
            </Field>
            <Field
              label="URL slug"
              htmlFor="slug"
              hint={id ? "Changing the slug changes the profile’s web address." : "Generated from the name — you can edit it."}
            >
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

        <Section title="Portrait" description="Shown on cards, the homepage hero and the profile page. Portrait photos (4:5) work best.">
          <ImageField value={values.portraitUrl} onChange={(v) => set("portraitUrl", v)} kind="portraits" />
        </Section>

        <Section title="Location">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Country" required hint="Missing a country? Add it under Expertise & places → Countries.">
              <select
                value={values.countryCode}
                onChange={(e) => set("countryCode", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                aria-label="Country"
              >
                <option value="">Choose a country…</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="City" required htmlFor="city">
              <Input id="city" value={values.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Expertise & industries" description="Controls where this person appears in Expertise, Industries and Discover filters.">
          <Field label="Areas of expertise">
            <PickList items={expertiseItems} value={values.expertiseIds} onChange={(v) => set("expertiseIds", v)} placeholder="Search expertise…" />
          </Field>
          <Field label="Industries">
            <PickList items={industryItems} value={values.industryIds} onChange={(v) => set("industryIds", v)} placeholder="Search industries…" />
          </Field>
        </Section>

        <Section title="Story">
          <Field label="Short summary" required htmlFor="summary" hint={`${values.summary.length}/400 — shown on cards`}>
            <Textarea id="summary" rows={3} maxLength={400} value={values.summary} onChange={(e) => set("summary", e.target.value)} />
          </Field>
          <Field label="Biography" required htmlFor="bio" hint="Long editorial biography on the profile page.">
            <Textarea id="bio" rows={10} value={values.biography} onChange={(e) => set("biography", e.target.value)} />
          </Field>
        </Section>

        <Section title="Achievements">
          <StringListEditor value={values.achievements} onChange={(v) => set("achievements", v)} addLabel="Add achievement" placeholder="e.g. Led a 40-person research lab" />
        </Section>

        <Section title="Career details" description="All optional — sections without entries are hidden on the profile.">
          <Field label="Experience">
            <ListEditor<ExperienceItem>
              value={values.experience}
              onChange={(v) => set("experience", v)}
              empty={{ role: "", org: "", period: "", description: "" }}
              addLabel="Add position"
              fields={[
                { key: "role", label: "Role", span: 3 },
                { key: "org", label: "Organization", span: 3 },
                { key: "period", label: "Period", placeholder: "2019 – Present", span: 2 },
                { key: "description", label: "Description", multiline: true, span: 4 },
              ]}
            />
          </Field>
          <Field label="Education">
            <ListEditor<EducationItem>
              value={values.education}
              onChange={(v) => set("education", v)}
              empty={{ degree: "", institution: "", year: "" }}
              addLabel="Add education"
              fields={[
                { key: "degree", label: "Degree", span: 3 },
                { key: "institution", label: "Institution", span: 2 },
                { key: "year", label: "Year", span: 1 },
              ]}
            />
          </Field>
          <Field label="Projects">
            <ListEditor<ProjectItem>
              value={values.projects}
              onChange={(v) => set("projects", v)}
              empty={{ name: "", description: "", year: "" }}
              addLabel="Add project"
              fields={[
                { key: "name", label: "Name", span: 4 },
                { key: "year", label: "Year", span: 2 },
                { key: "description", label: "Description", multiline: true, span: 6 },
              ]}
            />
          </Field>
          <Field label="Publications">
            <ListEditor<PublicationItem>
              value={values.publications}
              onChange={(v) => set("publications", v)}
              empty={{ title: "", venue: "", year: "" }}
              addLabel="Add publication"
              fields={[
                { key: "title", label: "Title", span: 6 },
                { key: "venue", label: "Venue", span: 4 },
                { key: "year", label: "Year", span: 2 },
              ]}
            />
          </Field>
          <Field label="Awards">
            <ListEditor<AwardItem>
              value={values.awards}
              onChange={(v) => set("awards", v)}
              empty={{ title: "", org: "", year: "" }}
              addLabel="Add award"
              fields={[
                { key: "title", label: "Award", span: 3 },
                { key: "org", label: "Organization", span: 2 },
                { key: "year", label: "Year", span: 1 },
              ]}
            />
          </Field>
          <Field label="Links">
            <ListEditor<LinkItem>
              value={values.links}
              onChange={(v) => set("links", v)}
              empty={{ label: "", url: "" }}
              addLabel="Add link"
              fields={[
                { key: "label", label: "Label", placeholder: "LinkedIn", span: 2 },
                { key: "url", label: "URL", placeholder: "https://…", span: 4 },
              ]}
            />
          </Field>
        </Section>
      </div>

      <ActionBar>
        {id && (
          <ConfirmAction
            title="Delete this professional?"
            description="The profile is removed from the site, collections, daily schedule and stories. This cannot be undone."
            onConfirm={() => remove.mutate()}
          >
            <Button type="button" variant="ghost" disabled={busy} className="mr-auto text-destructive hover:text-destructive">
              <Trash2 aria-hidden /> Delete
            </Button>
          </ConfirmAction>
        )}
        {id && values.published && (
          <Button asChild type="button" variant="ghost">
            <Link href={`/professionals/${values.slug}`} target="_blank">
              <ExternalLink aria-hidden /> View on site
            </Link>
          </Button>
        )}
        <Button type="button" variant="outline" disabled={busy} onClick={() => router.push("/admin/professionals")}>
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
