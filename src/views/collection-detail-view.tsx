"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfessionalCard } from "@/components/site/professional-card";
import { useAppStore } from "@/lib/store";
import { useCollection } from "@/lib/queries";

export function CollectionDetailView({ slug }: { slug: string }) {
  const navigate = useAppStore((s) => s.navigate);
  const { data: c, isLoading, isError } = useCollection(slug);

  if (isLoading) {
    return (
      <div className="flex-1 bg-background">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-32 sm:px-6 lg:px-8">
          <Skeleton className="h-12 w-96" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !c) {
    return (
      <div className="flex-1 bg-background">
        <div className="mx-auto max-w-md px-4 pb-24 pt-40 text-center">
          <h1 className="font-heading text-2xl font-bold text-navy-900">Collection not found</h1>
          <Button
            className="mt-6 bg-gold-500 text-navy-900 hover:bg-gold-400"
            onClick={() => navigate({ name: "collections" })}
          >
            Browse all collections
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background">
      {/* Hero with cover */}
      <section className="relative overflow-hidden bg-navy-950">
        {c.coverUrl && (
          <div className="absolute inset-0">
            <Image
              src={c.coverUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/80 to-navy-950/40" />
          </div>
        )}
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 md:pt-36 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-gold-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-navy-900">
              {c.kind === "ranking" ? (
                <>
                  <Trophy className="h-3 w-3" aria-hidden /> Ranking
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" aria-hidden /> Editorial Selection
                </>
              )}
            </span>
            {c.edition && (
              <span className="rounded-full border border-gold-500/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gold-300">
                {c.edition}
              </span>
            )}
          </div>
          <h1 className="mt-4 max-w-3xl font-heading text-3xl font-extrabold leading-tight text-white md:text-5xl">
            {c.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-navy-200 md:text-lg">
            {c.description}
          </p>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-gold-400">
            {c.members.length} {c.members.length === 1 ? "member" : "members"}
          </p>
        </div>
      </section>

      {/* Members */}
      <section className="py-14 md:py-16" aria-label="Collection members">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {c.kind === "ranking" && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {c.members.map((m, i) => (
                <div key={m.slug} className="relative">
                  <span className="absolute -left-1.5 -top-1.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 font-heading text-sm font-extrabold text-navy-900 shadow-md">
                    {i + 1}
                  </span>
                  <ProfessionalCard professional={m} />
                </div>
              ))}
            </div>
          )}
          {c.kind !== "ranking" && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {c.members.map((m) => (
                <ProfessionalCard key={m.slug} professional={m} />
              ))}
            </div>
          )}

          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            <p className="max-w-md text-sm text-muted-foreground">
              Know someone who belongs in this collection? Nominations are reviewed by our
              editorial team.
            </p>
            <Button
              className="bg-gold-500 font-semibold text-navy-900 hover:bg-gold-400"
              onClick={() => navigate({ name: "get-featured" })}
            >
              Nominate a professional
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => navigate({ name: "collections" })}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
          Back to all collections
        </Button>
      </div>
    </div>
  );
}
