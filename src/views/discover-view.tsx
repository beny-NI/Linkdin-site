"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfessionalCard } from "@/components/site/professional-card";
import { useCountries, useExpertiseTree, useIndustries, useProfessionals } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface DiscoverViewProps {
  initialCountry?: string;
  initialExpertise?: string;
  initialIndustry?: string;
  initialCollection?: string;
  initialQuery?: string;
}

export function DiscoverView({
  initialCountry = "all",
  initialExpertise = "all",
  initialIndustry = "all",
  initialCollection,
  initialQuery = "",
}: DiscoverViewProps) {
  const [q, setQ] = useState(initialQuery);
  const [country, setCountry] = useState(initialCountry);
  const [expertise, setExpertise] = useState(initialExpertise);
  const [industry, setIndustry] = useState(initialIndustry);
  const [collection, setCollection] = useState(initialCollection ?? "all");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);

  const { data: countries } = useCountries();
  const { data: expertiseTree } = useExpertiseTree();
  const { data: industries } = useIndustries();

  const expertiseOptions = useMemo(() => {
    if (!expertiseTree) return [];
    return expertiseTree.flatMap((top) => [top, ...top.children]);
  }, [expertiseTree]);

  const filters = useMemo(
    () => ({
      q: q || undefined,
      country: country === "all" ? undefined : country,
      expertise: expertise === "all" ? undefined : expertise,
      industry: industry === "all" ? undefined : industry,
      collection: collection === "all" ? undefined : collection,
      sort,
      page,
      pageSize: 9,
    }),
    [q, country, expertise, industry, collection, sort, page]
  );

  const { data, isLoading, isFetching } = useProfessionals(filters);
  const total = data?.total ?? 0;

  const resetFilters = () => {
    setQ("");
    setCountry("all");
    setExpertise("all");
    setIndustry("all");
    setCollection("all");
    setSort("name");
    setPage(1);
  };

  const hasFilters =
    q !== "" || country !== "all" || expertise !== "all" || industry !== "all" || collection !== "all";

  return (
    <div className="flex-1 bg-background">
      {/* Hero */}
      <section className="bg-navy-950 pb-10 pt-28 md:pb-14 md:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="eyebrow-light">Discover Professionals</p>
          <h1 className="mt-3 font-heading text-3xl font-extrabold text-white md:text-5xl">
            The global directory of exceptional professionals
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy-200 md:text-lg">
            Search by name, title, expertise, or industry — filter by country and explore a
            curated selection of leaders, experts, and founders worldwide.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-border bg-card" aria-label="Search and filters">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, title, organization, or city…"
                className="pl-10"
                aria-label="Search professionals"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto lg:grid-cols-4">
              <Select
                value={country}
                onValueChange={(v) => {
                  setCountry(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full lg:w-[160px]" aria-label="Filter by country">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {countries?.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name} ({c.professionalCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={expertise}
                onValueChange={(v) => {
                  setExpertise(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full lg:w-[170px]" aria-label="Filter by expertise">
                  <SelectValue placeholder="Expertise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All expertise</SelectItem>
                  {expertiseOptions.map((e) => (
                    <SelectItem key={e.slug} value={e.slug}>
                      {e.name} ({e.professionalCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={industry}
                onValueChange={(v) => {
                  setIndustry(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full lg:w-[160px]" aria-label="Filter by industry">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All industries</SelectItem>
                  {industries?.map((i) => (
                    <SelectItem key={i.slug} value={i.slug}>
                      {i.name} ({i.professionalCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v)}>
                <SelectTrigger className="w-full lg:w-[150px]" aria-label="Sort results">
                  <SlidersHorizontal className="mr-1 h-3.5 w-3.5" aria-hidden />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort: Name</SelectItem>
                  <SelectItem value="newest">Sort: Recently added</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground" role="status">
              {isLoading ? (
                "Searching…"
              ) : (
                <>
                  <span className="font-bold text-navy-900">{total}</span>{" "}
                  {total === 1 ? "professional" : "professionals"} found
                  {isFetching && " · refreshing…"}
                </>
              )}
            </p>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                Clear all filters
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-10 md:py-14" aria-label="Professional results">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] w-full rounded-2xl" />
              ))}
            </div>
          ) : total === 0 ? (
            <div className="mx-auto max-w-md py-16 text-center">
              <Users className="mx-auto h-10 w-10 text-gold-500" aria-hidden />
              <h2 className="mt-4 font-heading text-xl font-bold text-navy-900">No professionals found</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Try broadening your search or clearing some filters. Our editorial team adds new
                professionals continuously.
              </p>
              <Button variant="outline" className="mt-5 border-navy-700 text-navy-800" onClick={resetFilters}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data?.items.map((p) => (
                  <ProfessionalCard key={p.slug} professional={p} />
                ))}
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="border-navy-700 text-navy-800"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: data.totalPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPage(i + 1)}
                      aria-current={page === i + 1 ? "page" : undefined}
                      className={cn(
                        "h-9 w-9 rounded-full text-sm font-semibold transition-colors",
                        page === i + 1
                          ? "bg-navy-900 text-gold-400"
                          : "border border-border text-navy-800 hover:border-gold-500/60"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === data.totalPages}
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    className="border-navy-700 text-navy-800"
                  >
                    Next
                  </Button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
