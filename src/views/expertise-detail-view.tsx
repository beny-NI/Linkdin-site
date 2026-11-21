"use client";

import { ArrowLeft, Briefcase, ChevronRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfessionalCard } from "@/components/site/professional-card";
import { StoryCard } from "@/components/site/story-card";
import { useAppStore } from "@/lib/store";
import { useExpertise } from "@/lib/queries";

export function ExpertiseDetailView({ slug }: { slug: string }) {
  const navigate = useAppStore((s) => s.navigate);
  const { data: e, isLoading, isError } = useExpertise(slug);

  if (isLoading) {
    return (
      <div className="flex-1 bg-background">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-32 sm:px-6 lg:px-8">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-96" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !e) {
    return (
      <div className="flex-1 bg-background">
        <div className="mx-auto max-w-md px-4 pb-24 pt-40 text-center">
          <h1 className="font-heading text-2xl font-bold text-navy-900">Expertise not found</h1>
          <Button
            className="mt-6 bg-gold-500 text-navy-900 hover:bg-gold-400"
            onClick={() => navigate({ name: "expertise-directory" })}
          >
            Browse the expertise directory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background">
      <section className="bg-navy-950 pb-12 pt-28 md:pb-16 md:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-navy-300">
            <button
              type="button"
              onClick={() => navigate({ name: "expertise-directory" })}
              className="font-semibold transition-colors hover:text-gold-400"
            >
              Expertise
            </button>
            {e.parent && (
              <>
                <ChevronRight className="h-4 w-4" aria-hidden />
                <button
                  type="button"
                  onClick={() => navigate({ name: "expertise", slug: e.parent!.slug })}
                  className="font-semibold transition-colors hover:text-gold-400"
                >
                  {e.parent.name}
                </button>
              </>
            )}
            <ChevronRight className="h-4 w-4" aria-hidden />
            <span className="text-gold-400">{e.name}</span>
          </div>
          <h1 className="mt-4 font-heading text-3xl font-extrabold text-white md:text-5xl">{e.name}</h1>
          <p className="mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-navy-300">
            <Layers className="h-4 w-4 text-gold-400" aria-hidden />
            {e.cluster} · {e.professionals.length}{" "}
            {e.professionals.length === 1 ? "professional" : "professionals"}
          </p>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-navy-200">{e.description}</p>

          {e.children.length > 0 && (
            <div className="mt-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-navy-300">
                Sub-specialties
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {e.children.map((child) => (
                  <button
                    key={child.slug}
                    type="button"
                    onClick={() => navigate({ name: "expertise", slug: child.slug })}
                    className="rounded-full border border-navy-600 px-3.5 py-1.5 text-sm font-semibold text-navy-100 transition-colors hover:border-gold-500/60 hover:text-gold-300"
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Professionals */}
      <section className="py-14 md:py-16" aria-label={`Professionals in ${e.name}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-2xl font-bold text-navy-900">
              Professionals in {e.name}
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="border-navy-700 text-navy-800"
              onClick={() => navigate({ name: "discover", expertise: e.slug })}
            >
              View in Discover with filters
            </Button>
          </div>
          {e.professionals.length === 0 ? (
            <p className="mt-8 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No professionals listed in this expertise yet. Our editorial team is expanding
              coverage continuously.
            </p>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {e.professionals.map((p) => (
                <ProfessionalCard key={p.slug} professional={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Related industries & stories */}
      <div className="border-t border-border bg-warmwhite py-14 md:py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <section aria-label="Related industries">
            <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-navy-900">
              <Briefcase className="h-5 w-5 text-gold-600" aria-hidden /> Related Industries
            </h2>
            <div className="mt-5 space-y-2.5">
              {e.relatedIndustries.map((ind) => (
                <button
                  key={ind.slug}
                  type="button"
                  onClick={() => navigate({ name: "industry", slug: ind.slug })}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-5 py-4 text-left transition-all hover:border-gold-500/60 hover:shadow-md"
                >
                  <span className="font-semibold text-navy-900">{ind.name}</span>
                  <span className="text-xs font-bold text-gold-600">{ind.count} shared</span>
                </button>
              ))}
            </div>
          </section>
          {e.relatedStories.length > 0 && (
            <section aria-label="Related editorial stories">
              <h2 className="font-heading text-xl font-bold text-navy-900">Related Stories</h2>
              <div className="mt-5 space-y-4">
                {e.relatedStories.slice(0, 3).map((s) => (
                  <StoryCard key={s.slug} story={s} variant="minimal" />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => navigate({ name: "expertise-directory" })}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
          Back to all expertise
        </Button>
      </div>
    </div>
  );
}
