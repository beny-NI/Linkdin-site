"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StoryCard } from "@/components/site/story-card";
import { useStories } from "@/lib/queries";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "All",
  "Interview",
  "Leadership",
  "Innovation",
  "Industry Insight",
  "Success Story",
] as const;

export function MagazineView() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const { data: stories, isLoading } = useStories(category === "All" ? undefined : category);
  const [featured, ...rest] = stories ?? [];

  return (
    <div className="flex-1 bg-background">
      <section className="bg-navy-950 pb-12 pt-28 md:pb-16 md:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="eyebrow-light">Stories & Magazine</p>
          <h1 className="mt-3 font-heading text-3xl font-extrabold text-white md:text-5xl">
            The SkilledSphere Magazine
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy-200 md:text-lg">
            Interviews, professional journeys, leadership features, and industry insights —
            every story connected to the people behind it.
          </p>
        </div>
      </section>

      {/* Category filter */}
      <section className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur-sm" aria-label="Story categories">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3.5 sm:px-6 lg:px-8 scrollbar-elegant">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              className={cn(
                "whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                category === cat
                  ? "border-navy-900 bg-navy-900 text-gold-400"
                  : "border-border text-navy-800 hover:border-gold-500/60 hover:text-navy-900"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="py-12 md:py-16" aria-label="Stories">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {isLoading && (
            <div className="grid gap-6 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-2xl" />
              ))}
            </div>
          )}
          {!isLoading && stories?.length === 0 && (
            <div className="mx-auto max-w-md py-16 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-gold-500" aria-hidden />
              <h2 className="mt-4 font-heading text-xl font-bold text-navy-900">
                No stories in this category yet
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                New editorial features are published every week.
              </p>
            </div>
          )}
          {!isLoading && featured && (
            <div className="grid gap-6 lg:grid-cols-2">
              <StoryCard story={featured} variant="wide" className="lg:row-span-2" />
              <div className="flex flex-col gap-6">
                {rest.slice(0, 2).map((s) => (
                  <StoryCard key={s.slug} story={s} />
                ))}
              </div>
              {rest.slice(2).map((s) => (
                <StoryCard key={s.slug} story={s} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
