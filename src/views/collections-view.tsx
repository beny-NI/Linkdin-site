"use client";

import Image from "next/image";
import { ArrowRight, Trophy, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import { useCollections } from "@/lib/queries";

export function CollectionsView() {
  const navigate = useAppStore((s) => s.navigate);
  const { data: collections, isLoading } = useCollections();

  return (
    <div className="flex-1 bg-background">
      <section className="bg-navy-950 pb-12 pt-28 md:pb-16 md:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="eyebrow-light">Professional Collections</p>
          <h1 className="mt-3 font-heading text-3xl font-extrabold text-white md:text-5xl">
            Curated selections of exceptional people
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy-200 md:text-lg">
            Editorial selections and occasional rankings — not every list is a leaderboard.
            Each collection is hand-assembled by our editorial team.
          </p>
        </div>
      </section>

      <section className="py-14 md:py-20" aria-label="Collections">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {isLoading && (
            <div className="grid gap-8 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-2xl" />
              ))}
            </div>
          )}
          <div className="grid gap-8 md:grid-cols-2">
            {collections?.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => navigate({ name: "collection", slug: c.slug })}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold-500/60 hover:shadow-xl hover:shadow-gold-500/10"
              >
                <div className="relative aspect-[21/9] w-full overflow-hidden bg-navy-900">
                  {c.coverUrl && (
                    <Image
                      src={c.coverUrl}
                      alt={`Cover for ${c.title}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 to-transparent" />
                  <div className="absolute bottom-4 left-5 flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-full bg-gold-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-navy-900">
                      {c.kind === "ranking" ? (
                        <>
                          <Trophy className="h-3 w-3" aria-hidden /> Ranking
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" aria-hidden /> Editorial
                        </>
                      )}
                    </span>
                    {c.edition && (
                      <span className="rounded-full bg-navy-950/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gold-300 backdrop-blur-sm">
                        {c.edition}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="font-heading text-xl font-bold text-navy-900 group-hover:text-navy-700">
                    {c.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {c.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex -space-x-2.5">
                      {c.members.slice(0, 6).map((m) => (
                        <span
                          key={m.slug}
                          className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-card bg-navy-800"
                        >
                          <Image src={m.portraitUrl} alt="" fill sizes="36px" className="object-cover object-top" />
                        </span>
                      ))}
                    </div>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-gold-600">
                      {c.memberCount} members
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
