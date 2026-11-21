"use client";

import { ArrowLeft, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfessionalCard } from "@/components/site/professional-card";
import { StoryCard } from "@/components/site/story-card";
import { useAppStore } from "@/lib/store";
import { useIndustry } from "@/lib/queries";

export function IndustryDetailView({ slug }: { slug: string }) {
  const navigate = useAppStore((s) => s.navigate);
  const { data: ind, isLoading, isError } = useIndustry(slug);

  if (isLoading) {
    return (
      <div className="flex-1 bg-background">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-32 sm:px-6 lg:px-8">
          <Skeleton className="h-12 w-80" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !ind) {
    return (
      <div className="flex-1 bg-background">
        <div className="mx-auto max-w-md px-4 pb-24 pt-40 text-center">
          <h1 className="font-heading text-2xl font-bold text-navy-900">Industry not found</h1>
          <Button
            className="mt-6 bg-gold-500 text-navy-900 hover:bg-gold-400"
            onClick={() => navigate({ name: "industry-directory" })}
          >
            Browse all industries
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background">
      <section className="bg-navy-950 pb-12 pt-28 md:pb-16 md:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="eyebrow-light">Industry</p>
          <h1 className="mt-3 font-heading text-3xl font-extrabold text-white md:text-5xl">
            {ind.name}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy-200 md:text-lg">
            {ind.description}
          </p>
          <p className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-navy-300">
            <Briefcase className="h-4 w-4 text-gold-400" aria-hidden />
            {ind.professionals.length}{" "}
            {ind.professionals.length === 1 ? "professional" : "professionals"}
          </p>
        </div>
      </section>

      {/* Expertise clusters */}
      {ind.expertiseClusters.length > 0 && (
        <section className="border-b border-border bg-warmwhite py-10" aria-label="Expertise clusters">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.24em] text-gold-600">
              Expertise clusters in {ind.name}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {ind.expertiseClusters.map((e) => (
                <button
                  key={e.slug}
                  type="button"
                  onClick={() => navigate({ name: "expertise", slug: e.slug })}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-navy-800 transition-all hover:border-gold-500 hover:bg-navy-900 hover:text-gold-300"
                >
                  {e.name}
                  <span className="rounded-full bg-navy-50 px-1.5 py-0.5 text-[10px] font-bold text-navy-700">
                    {e.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Professionals */}
      <section className="py-14 md:py-16" aria-label={`Professionals in ${ind.name}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-2xl font-bold text-navy-900">
              Professionals in {ind.name}
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="border-navy-700 text-navy-800"
              onClick={() => navigate({ name: "discover", industry: ind.slug })}
            >
              View in Discover with filters
            </Button>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ind.professionals.map((p) => (
              <ProfessionalCard key={p.slug} professional={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Related stories */}
      {ind.relatedStories.length > 0 && (
        <section className="border-t border-border bg-warmwhite py-14" aria-label="Related stories">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-xl font-bold text-navy-900">
              {ind.name} stories from the Magazine
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {ind.relatedStories.map((s) => (
                <StoryCard key={s.slug} story={s} />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => navigate({ name: "industry-directory" })}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
          Back to all industries
        </Button>
      </div>
    </div>
  );
}
