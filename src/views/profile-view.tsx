"use client";

import Image from "next/image";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  BookOpen,
  Briefcase,
  ExternalLink,
  GraduationCap,
  Link2,
  Mail,
  MapPin,
  Newspaper,
  Rocket,
  ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ProfessionalCard } from "@/components/site/professional-card";
import { StoryCard } from "@/components/site/story-card";
import { useAppStore } from "@/lib/store";
import { useProfessional } from "@/lib/queries";

function ProfileSkeleton() {
  return (
    <div className="flex-1 bg-background">
      <div className="bg-navy-950 pb-16 pt-28">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:flex-row sm:px-6 lg:px-8">
          <Skeleton className="h-56 w-44 rounded-2xl bg-navy-800" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-80 bg-navy-800" />
            <Skeleton className="h-5 w-96 bg-navy-800" />
            <Skeleton className="h-4 w-full max-w-xl bg-navy-800" />
            <Skeleton className="h-4 w-3/4 max-w-lg bg-navy-800" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-14 sm:px-6 lg:px-8">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function ProfileView({ slug }: { slug: string }) {
  const navigate = useAppStore((s) => s.navigate);
  const { data: p, isLoading, isError } = useProfessional(slug);

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !p) {
    return (
      <div className="flex-1 bg-background">
        <div className="mx-auto max-w-md px-4 pb-24 pt-40 text-center">
          <h1 className="font-heading text-2xl font-bold text-navy-900">Profile not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This professional may have been unpublished or the link is incorrect.
          </p>
          <Button
            className="mt-6 bg-gold-500 text-navy-900 hover:bg-gold-400"
            onClick={() => navigate({ name: "discover" })}
          >
            Browse all professionals
          </Button>
        </div>
      </div>
    );
  }

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "journey", label: "Career Journey" },
    { id: "expertise", label: "Expertise" },
    { id: "experience", label: "Experience" },
    { id: "achievements", label: "Achievements" },
    { id: "education", label: "Education" },
    ...(p.projects.length ? [{ id: "projects", label: "Projects" }] : []),
    ...(p.publications.length ? [{ id: "publications", label: "Publications" }] : []),
    ...(p.awards.length ? [{ id: "awards", label: "Awards" }] : []),
    ...(p.relatedStories.length ? [{ id: "stories", label: "Stories" }] : []),
    ...(p.relatedProfessionals.length ? [{ id: "related", label: "Related" }] : []),
  ];

  return (
    <div className="flex-1 bg-background">
      {/* Header band */}
      <section className="bg-navy-950 pb-14 pt-28 md:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate({ name: "discover" })}
            className="mb-8 flex items-center gap-2 text-sm font-semibold text-navy-200 transition-colors hover:text-gold-400"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to Discover
          </button>

          <div className="flex flex-col gap-8 md:flex-row md:items-start">
            <div className="relative mx-auto h-64 w-52 shrink-0 overflow-hidden rounded-2xl border border-gold-500/40 shadow-2xl shadow-navy-950/60 md:mx-0 md:h-72 md:w-60">
              <Image
                src={p.portraitUrl}
                alt={`Portrait of ${p.fullName}`}
                fill
                priority
                sizes="240px"
                className="object-cover object-top"
              />
            </div>
            <div className="min-w-0 flex-1 text-center md:pt-3 md:text-left">
              {p.featuredLabel && (
                <span className="mb-3 inline-block rounded-full bg-gold-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-navy-900">
                  {p.featuredLabel}
                </span>
              )}
              <h1 className="font-heading text-3xl font-extrabold leading-tight text-white md:text-5xl">
                {p.fullName}
              </h1>
              <p className="mt-3 text-base font-medium text-gold-300 md:text-lg">
                {p.professionalTitle}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-navy-200 md:justify-start">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gold-400" aria-hidden />
                  {p.city}, {p.country.name} <span aria-hidden>{p.country.flag}</span>
                </span>
                {p.organization && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-gold-400" aria-hidden />
                    {p.organization}
                  </span>
                )}
              </div>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-navy-100/90 md:mx-0 md:text-base">
                {p.summary}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                {p.expertise.slice(0, 4).map((e) => (
                  <button
                    key={e.slug}
                    type="button"
                    onClick={() => navigate({ name: "expertise", slug: e.slug })}
                    className="rounded-full border border-gold-500/40 px-3 py-1 text-xs font-semibold text-gold-300 transition-colors hover:bg-gold-500 hover:text-navy-900"
                  >
                    {e.name}
                  </button>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 md:justify-start">
                <Button
                  size="sm"
                  className="bg-gold-500 font-semibold text-navy-900 hover:bg-gold-400"
                  onClick={() => navigate({ name: "contact" })}
                >
                  <Mail className="mr-1.5 h-4 w-4" aria-hidden />
                  Contact & Collaboration
                </Button>
                {p.links.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-navy-600 px-3.5 py-2 text-xs font-semibold text-navy-100 transition-colors hover:border-gold-500/60 hover:text-gold-400"
                  >
                    <Link2 className="h-3.5 w-3.5" aria-hidden />
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
        {/* Section nav */}
        <nav aria-label="Profile sections" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1 border-l border-border pl-4">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-navy-900"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-14">
          {/* Overview */}
          <section id="overview" aria-label="Professional overview" className="scroll-mt-24">
            <h2 className="font-heading text-xl font-bold text-navy-900">Professional Overview</h2>
            <div className="gold-hairline mt-3" />
            <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-foreground/90">
              {p.biography.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          {/* Career journey */}
          <section id="journey" aria-label="Career journey" className="scroll-mt-24">
            <h2 className="font-heading text-xl font-bold text-navy-900">Career Journey</h2>
            <div className="gold-hairline mt-3" />
            <ol className="relative mt-6 space-y-8 border-l-2 border-navy-100 pl-6">
              {[...p.experience].reverse().map((job, i) => (
                <li key={i} className="relative">
                  <span
                    className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-gold-500 bg-background"
                    aria-hidden
                  />
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-600">{job.period}</p>
                  <h3 className="mt-1 font-heading text-base font-bold text-navy-900">{job.role}</h3>
                  <p className="text-sm font-medium text-navy-700">{job.org}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{job.description}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Expertise */}
          <section id="expertise" aria-label="Areas of expertise" className="scroll-mt-24">
            <h2 className="font-heading text-xl font-bold text-navy-900">Areas of Expertise</h2>
            <div className="gold-hairline mt-3" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {p.expertise.map((e) => (
                <button
                  key={e.slug}
                  type="button"
                  onClick={() => navigate({ name: "expertise", slug: e.slug })}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-gold-500/60 hover:shadow-md"
                >
                  <span className="font-semibold text-navy-900 group-hover:text-navy-700">{e.name}</span>
                  <ExternalLink className="h-4 w-4 text-gold-600" aria-hidden />
                </button>
              ))}
            </div>
          </section>

          {/* Achievements */}
          {p.achievements.length > 0 && (
            <section id="achievements" aria-label="Key achievements" className="scroll-mt-24">
              <h2 className="font-heading text-xl font-bold text-navy-900">Key Achievements</h2>
              <div className="gold-hairline mt-3" />
              <ul className="mt-5 space-y-3">
                {p.achievements.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" aria-hidden />
                    <span className="text-sm leading-relaxed text-foreground/90">{a}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Experience detail moved to journey; here organizations summary */}
          <section id="experience" aria-label="Professional experience" className="scroll-mt-24">
            <h2 className="font-heading text-xl font-bold text-navy-900">Professional Experience</h2>
            <div className="gold-hairline mt-3" />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {p.experience.map((job, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-base font-bold text-navy-900">{job.role}</h3>
                      <p className="text-sm font-medium text-navy-700">{job.org}</p>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-bold text-navy-700">
                      {job.period}
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{job.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          {p.education.length > 0 && (
            <section id="education" aria-label="Education" className="scroll-mt-24">
              <h2 className="font-heading text-xl font-bold text-navy-900">Education</h2>
              <div className="gold-hairline mt-3" />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {p.education.map((ed, i) => (
                  <div key={i} className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-100">
                      <GraduationCap className="h-5 w-5 text-gold-600" aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-heading text-sm font-bold text-navy-900">{ed.degree}</h3>
                      <p className="text-sm text-muted-foreground">{ed.institution}</p>
                      <p className="mt-0.5 text-xs font-semibold text-gold-600">{ed.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {p.projects.length > 0 && (
            <section id="projects" aria-label="Selected projects" className="scroll-mt-24">
              <h2 className="font-heading text-xl font-bold text-navy-900">Selected Projects</h2>
              <div className="gold-hairline mt-3" />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {p.projects.map((pr, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading text-base font-bold text-navy-900">{pr.name}</h3>
                      <span className="rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-bold text-navy-700">
                        {pr.year}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pr.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Publications */}
          {p.publications.length > 0 && (
            <section id="publications" aria-label="Research and publications" className="scroll-mt-24">
              <h2 className="font-heading text-xl font-bold text-navy-900">Research & Publications</h2>
              <div className="gold-hairline mt-3" />
              <ul className="mt-5 space-y-3">
                {p.publications.map((pub, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                    <ScrollText className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold leading-snug text-navy-900">{pub.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {pub.venue} · {pub.year}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Awards */}
          {p.awards.length > 0 && (
            <section id="awards" aria-label="Awards and recognition" className="scroll-mt-24">
              <h2 className="font-heading text-xl font-bold text-navy-900">Awards & Recognition</h2>
              <div className="gold-hairline mt-3" />
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {p.awards.map((aw, i) => (
                  <div key={i} className="flex items-start gap-3.5 rounded-xl border border-gold-500/30 bg-gold-100/40 p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500/20">
                      <Award className="h-5 w-5 text-gold-600" aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-heading text-sm font-bold text-navy-900">{aw.title}</h3>
                      <p className="text-sm text-muted-foreground">{aw.org}</p>
                      <p className="mt-0.5 text-xs font-semibold text-gold-600">{aw.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Stories */}
          {p.relatedStories.length > 0 && (
            <section id="stories" aria-label="Featured interviews and articles" className="scroll-mt-24">
              <div className="flex items-center gap-2.5">
                <Newspaper className="h-5 w-5 text-gold-600" aria-hidden />
                <h2 className="font-heading text-xl font-bold text-navy-900">
                  Featured Interviews & Articles
                </h2>
              </div>
              <div className="gold-hairline mt-3" />
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {p.relatedStories.map((s) => (
                  <StoryCard key={s.slug} story={s} />
                ))}
              </div>
            </section>
          )}

          {/* Related professionals */}
          {p.relatedProfessionals.length > 0 && (
            <section id="related" aria-label="Related professionals" className="scroll-mt-24">
              <div className="flex items-center gap-2.5">
                <Rocket className="h-5 w-5 text-gold-600" aria-hidden />
                <h2 className="font-heading text-xl font-bold text-navy-900">Related Professionals</h2>
              </div>
              <div className="gold-hairline mt-3" />
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {p.relatedProfessionals.map((rp) => (
                  <ProfessionalCard key={rp.slug} professional={rp} compact />
                ))}
              </div>
            </section>
          )}

          <Separator />
          <div className="flex flex-col items-center gap-4 pb-4 text-center">
            <BookOpen className="h-6 w-6 text-gold-500" aria-hidden />
            <p className="max-w-md text-sm text-muted-foreground">
              Discover more exceptional professionals shaping what&apos;s next across {p.country.name}{" "}
              and beyond.
            </p>
            <Button
              variant="outline"
              className="border-navy-700 text-navy-800 hover:bg-navy-50"
              onClick={() => navigate({ name: "discover", country: p.country.code })}
            >
              Explore {p.country.name}&apos;s professionals
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
