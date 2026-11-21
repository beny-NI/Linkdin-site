"use client";

import { ChevronRight, Layers } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import { useExpertiseTree } from "@/lib/queries";

const CLUSTER_ORDER = ["Technology", "Business", "Science & Research", "Creative", "Finance"];

export function ExpertiseDirectoryView() {
  const navigate = useAppStore((s) => s.navigate);
  const { data: tree, isLoading } = useExpertiseTree();

  const clusters = CLUSTER_ORDER.map((name) => ({
    name,
    items: (tree ?? []).filter((e) => e.cluster === name),
  })).filter((c) => c.items.length > 0);

  return (
    <div className="flex-1 bg-background">
      <section className="bg-navy-950 pb-12 pt-28 md:pb-16 md:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="eyebrow-light">Expertise Directory</p>
          <h1 className="mt-3 font-heading text-3xl font-extrabold text-white md:text-5xl">
            Navigate every discipline
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy-200 md:text-lg">
            A hierarchical taxonomy of professional expertise — from broad domains to precise
            sub-specialties — each connected to the people who practice it.
          </p>
        </div>
      </section>

      <section className="py-14 md:py-20" aria-label="Expertise clusters">
        <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6 lg:px-8">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          {clusters.map((cluster) => (
            <div key={cluster.name}>
              <SectionHeading
                eyebrow={`Cluster · ${cluster.items.reduce((acc, e) => acc + e.professionalCount, 0)} professionals`}
                title={cluster.name}
              />
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {cluster.items.map((e) => (
                  <div
                    key={e.slug}
                    className="rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-gold-500/50 hover:shadow-lg hover:shadow-gold-500/5"
                  >
                    <button
                      type="button"
                      onClick={() => navigate({ name: "expertise", slug: e.slug })}
                      className="group flex w-full items-start justify-between gap-3 text-left"
                    >
                      <div>
                        <h3 className="font-heading text-lg font-bold text-navy-900 group-hover:text-navy-700">
                          {e.name}
                        </h3>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gold-600">
                          {e.professionalCount}{" "}
                          {e.professionalCount === 1 ? "professional" : "professionals"}
                        </p>
                      </div>
                      <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border transition-colors group-hover:border-gold-500 group-hover:bg-gold-500">
                        <ChevronRight className="h-4 w-4 text-navy-700" aria-hidden />
                      </span>
                    </button>
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {e.description}
                    </p>
                    {e.children.length > 0 && (
                      <div className="mt-4 border-t border-border pt-3">
                        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                          <Layers className="h-3.5 w-3.5" aria-hidden /> Sub-specialties
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {e.children.map((child) => (
                            <button
                              key={child.slug}
                              type="button"
                              onClick={() => navigate({ name: "expertise", slug: child.slug })}
                              className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-700 transition-colors hover:bg-navy-900 hover:text-gold-300"
                            >
                              {child.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
