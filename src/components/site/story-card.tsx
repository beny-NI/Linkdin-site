"use client";

import Image from "next/image";
import { ArrowUpRight, Clock } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { StoryCardDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface StoryCardProps {
  story: StoryCardDTO;
  variant?: "default" | "wide" | "minimal";
  className?: string;
}

export function StoryCard({ story: s, variant = "default", className }: StoryCardProps) {
  const navigate = useAppStore((s) => s.navigate);

  if (variant === "minimal") {
    return (
      <button
        type="button"
        onClick={() => navigate({ name: "story", slug: s.slug })}
        className={cn(
          "group flex w-full items-start gap-4 rounded-xl p-3 text-left transition-colors hover:bg-navy-50",
          className
        )}
      >
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-navy-900">
          {s.coverUrl && (
            <Image src={s.coverUrl} alt="" fill sizes="96px" className="object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-600">{s.category}</p>
          <h4 className="mt-1 line-clamp-2 font-heading text-sm font-bold leading-snug text-navy-900 group-hover:text-navy-700">
            {s.title}
          </h4>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden /> {s.readingMinutes} min read
          </p>
        </div>
      </button>
    );
  }

  const wide = variant === "wide";
  return (
    <button
      type="button"
      onClick={() => navigate({ name: "story", slug: s.slug })}
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold-500/60 hover:shadow-xl hover:shadow-gold-500/10",
        wide && "md:flex-row",
        className
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden bg-navy-900",
          wide ? "aspect-[16/10] md:aspect-auto md:w-[55%]" : "aspect-[16/10]"
        )}
      >
        {s.coverUrl && (
          <Image
            src={s.coverUrl}
            alt={`Cover image for ${s.title}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-navy-950/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-400 backdrop-blur-sm">
          {s.category}
        </span>
      </div>
      <div className={cn("flex flex-1 flex-col p-5", wide && "md:p-7 md:justify-center")}>
        <h3
          className={cn(
            "font-heading font-bold leading-snug text-navy-900 group-hover:text-navy-700",
            wide ? "text-xl md:text-2xl" : "text-lg"
          )}
        >
          {s.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{s.subtitle}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDate(s.publicationDate)}</span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden /> {s.readingMinutes} min
            <ArrowUpRight className="h-3.5 w-3.5 text-gold-600 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </button>
  );
}
