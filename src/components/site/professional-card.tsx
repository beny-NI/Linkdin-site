"use client";

import Image from "next/image";
import { MapPin, ArrowUpRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { ProfessionalCardDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProfessionalCardProps {
  professional: ProfessionalCardDTO;
  className?: string;
  compact?: boolean;
}

export function ProfessionalCard({ professional: p, className, compact }: ProfessionalCardProps) {
  const navigate = useAppStore((s) => s.navigate);
  return (
    <button
      type="button"
      onClick={() => navigate({ name: "profile", slug: p.slug })}
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold-500/60 hover:shadow-xl hover:shadow-gold-500/10 focus-visible:outline-2 focus-visible:outline-gold-500",
        className
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-navy-900">
        <Image
          src={p.portraitUrl}
          alt={`Portrait of ${p.fullName}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90" />
        {p.featuredLabel && (
          <span className="absolute left-3 top-3 rounded-full bg-gold-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-navy-900">
            {p.featuredLabel}
          </span>
        )}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 text-xs font-medium text-white/90">
          <MapPin className="h-3.5 w-3.5 text-gold-400" aria-hidden />
          <span>
            {p.city}, {p.country.name} {p.country.flag}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-heading text-lg font-bold leading-snug text-navy-900 group-hover:text-navy-700">
              {p.fullName}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm font-medium text-muted-foreground">
              {p.professionalTitle}
            </p>
          </div>
          <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-navy-700 transition-all duration-300 group-hover:border-gold-500 group-hover:bg-gold-500 group-hover:text-navy-900">
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </span>
        </div>
        {!compact && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground/90">{p.summary}</p>
        )}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {p.expertise.slice(0, 2).map((e) => (
            <span
              key={e.slug}
              className="rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-semibold text-navy-700"
            >
              {e.name}
            </span>
          ))}
          {p.expertise.length > 2 && (
            <span className="rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-semibold text-navy-700">
              +{p.expertise.length - 2}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
