"use client";

import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StoryCard } from "@/components/site/story-card";
import { formatDate } from "@/components/site/story-card";
import { useAppStore } from "@/lib/store";
import { useStory } from "@/lib/queries";

export function StoryView({ slug }: { slug: string }) {
  const navigate = useAppStore((s) => s.navigate);
  const { data: s, isLoading, isError } = useStory(slug);

  if (isLoading) {
    return (
      <div className="flex-1 bg-background">
        <div className="mx-auto max-w-3xl space-y-5 px-4 py-32 sm:px-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !s) {
    return (
      <div className="flex-1 bg-background">
        <div className="mx-auto max-w-md px-4 pb-24 pt-40 text-center">
          <h1 className="font-heading text-2xl font-bold text-navy-900">Story not found</h1>
          <Button
            className="mt-6 bg-gold-500 text-navy-900 hover:bg-gold-400"
            onClick={() => navigate({ name: "magazine" })}
          >
            Back to the Magazine
          </Button>
        </div>
      </div>
    );
  }

  return (
    <article className="flex-1 bg-background">
      {/* Hero */}
      <header className="bg-navy-950 pb-14 pt-28 md:pt-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate({ name: "magazine" })}
            className="mb-8 flex items-center gap-2 text-sm font-semibold text-navy-200 transition-colors hover:text-gold-400"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to the Magazine
          </button>
          <p className="eyebrow-light">{s.category}</p>
          <h1 className="mt-4 font-heading text-3xl font-extrabold leading-tight text-white md:text-4xl">
            {s.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-navy-200 md:text-lg">{s.subtitle}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-navy-300">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-gold-400" aria-hidden />
              {s.author}
            </span>
            <span>{formatDate(s.publicationDate)}</span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gold-400" aria-hidden />
              {s.readingMinutes} min read
            </span>
          </div>
        </div>
      </header>

      {/* Cover */}
      {s.coverUrl && (
        <div className="mx-auto -mt-0 max-w-4xl px-4 sm:px-6">
          <div className="relative aspect-[16/8] w-full overflow-hidden rounded-b-2xl bg-navy-900">
            <Image
              src={s.coverUrl}
              alt={`Cover image for ${s.title}`}
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
        <div className="prose-skilledsphere">
          <ReactMarkdown>{s.content}</ReactMarkdown>
        </div>

        {/* Related expertise */}
        {s.relatedExpertise.length > 0 && (
          <div className="mt-12 border-t border-border pt-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gold-600">
              Related expertise
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {s.relatedExpertise.map((e) => (
                <button
                  key={e.slug}
                  type="button"
                  onClick={() => navigate({ name: "expertise", slug: e.slug })}
                  className="rounded-full border border-border px-3.5 py-1.5 text-sm font-semibold text-navy-800 transition-colors hover:border-gold-500 hover:bg-navy-900 hover:text-gold-300"
                >
                  {e.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Related professionals */}
        {s.relatedProfessionals && s.relatedProfessionals.length > 0 && (
          <div className="mt-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gold-600">
              People in this story
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {s.relatedProfessionals.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => navigate({ name: "profile", slug: p.slug })}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-gold-500/60 hover:shadow-md"
                >
                  <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-navy-800">
                    <Image
                      src={p.portraitUrl}
                      alt={`Portrait of ${p.fullName}`}
                      fill
                      sizes="56px"
                      className="object-cover object-top"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-heading text-sm font-bold text-navy-900 group-hover:text-navy-700">
                      {p.fullName}
                    </span>
                    <span className="mt-0.5 block line-clamp-2 text-xs leading-snug text-muted-foreground">
                      {p.professionalTitle}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related stories */}
      {s.relatedStories.length > 0 && (
        <section className="border-t border-border bg-warmwhite py-14" aria-label="Related stories">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="font-heading text-xl font-bold text-navy-900">Keep reading</h2>
            <div className="mt-6 space-y-4">
              {s.relatedStories.map((rs) => (
                <StoryCard key={rs.slug} story={rs} variant="minimal" />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
