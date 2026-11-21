"use client";

import { ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import { useIndustries } from "@/lib/queries";

export function IndustriesView() {
  const navigate = useAppStore((s) => s.navigate);
  const { data: industries, isLoading } = useIndustries();

  return (
    <div className="flex-1 bg-background">
      <section className="bg-navy-950 pb-12 pt-28 md:pb-16 md:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="eyebrow-light">Industry Directory</p>
          <h1 className="mt-3 font-heading text-3xl font-extrabold text-white md:text-5xl">
            Explore by industry
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy-200 md:text-lg">
            Each industry page gathers the professionals, expertise clusters, and editorial
            stories shaping that sector.
          </p>
        </div>
      </section>

      <section className="py-14 md:py-20" aria-label="Industries list">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          )}
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {industries?.map((ind) => (
              <button
                key={ind.slug}
                type="button"
                onClick={() => navigate({ name: "industry", slug: ind.slug })}
                className="group flex w-full items-center justify-between gap-6 px-6 py-6 text-left transition-colors hover:bg-navy-50/70"
              >
                <div className="min-w-0">
                  <h2 className="font-heading text-lg font-bold text-navy-900 group-hover:text-navy-700">
                    {ind.name}
                  </h2>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{ind.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="hidden text-sm font-bold text-gold-600 sm:block">
                    {ind.professionalCount}{" "}
                    {ind.professionalCount === 1 ? "professional" : "professionals"}
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-all group-hover:border-gold-500 group-hover:bg-gold-500">
                    <ArrowUpRight className="h-4.5 w-4.5 text-navy-700" aria-hidden />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
