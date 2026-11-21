"use client";

import { useEffect, useRef, useState } from "react";
import { CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, Command } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store";
import { useSearch } from "@/lib/queries";
import { Search, Sparkles, Users, Layers, Briefcase, BookOpen, Newspaper, Loader2 } from "lucide-react";

export function SearchDialog() {
  const { searchOpen, closeSearch, navigate } = useAppStore();
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(input.trim()), 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [input]);

  const { data, isFetching } = useSearch(debounced);
  const hasQuery = debounced.length >= 2;
  const hasResults =
    !!data &&
    (data.professionals.length > 0 ||
      data.expertise.length > 0 ||
      data.industries.length > 0 ||
      data.collections.length > 0 ||
      data.stories.length > 0);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (timer.current) clearTimeout(timer.current);
      setInput("");
      setDebounced("");
      closeSearch();
    }
  };

  const go = (fn: () => void) => {
    closeSearch();
    fn();
  };

  return (
    <Dialog open={searchOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0 [&>button]:z-10">
        <DialogHeader className="sr-only">
          <DialogTitle>Global search</DialogTitle>
          <DialogDescription>
            Search professionals, expertise, industries, collections, and editorial stories.
          </DialogDescription>
        </DialogHeader>
        <Command shouldFilter={false} className="rounded-none">
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="h-5 w-5 shrink-0 text-gold-600" aria-hidden />
            <CommandInput
              value={input}
              onValueChange={setInput}
              placeholder="Search professionals, expertise, industries, stories…"
              className="flex-1"
            />
            {isFetching && hasQuery && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />}
          </div>
          <CommandList className="max-h-[60vh] scrollbar-elegant">
            {!hasQuery && (
              <div className="px-6 py-10 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-gold-500" aria-hidden />
                <p className="mt-3 text-sm font-semibold text-navy-900">
                  Search across SkilledSphere
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Find professionals, areas of expertise, industries, collections, and stories.
                </p>
              </div>
            )}
            {hasQuery && !isFetching && !hasResults && (
              <CommandEmpty>
                No results for &ldquo;{debounced}&rdquo;. Try a name, expertise, industry, or country.
              </CommandEmpty>
            )}

            {data?.professionals.length ? (
              <CommandGroup heading="Professionals">
                {data.professionals.map((p) => (
                  <CommandItem
                    key={p.slug}
                    value={p.slug}
                    onSelect={() => go(() => navigate({ name: "profile", slug: p.slug }))}
                  >
                    <Users className="h-4 w-4 text-gold-600" aria-hidden />
                    <span className="font-medium">{p.fullName}</span>
                    <span className="ml-1 truncate text-xs text-muted-foreground">
                      — {p.professionalTitle} · {p.country.name}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {data?.expertise.length ? (
              <CommandGroup heading="Expertise">
                {data.expertise.map((e) => (
                  <CommandItem
                    key={e.slug}
                    value={`exp-${e.slug}`}
                    onSelect={() => go(() => navigate({ name: "expertise", slug: e.slug }))}
                  >
                    <Layers className="h-4 w-4 text-gold-600" aria-hidden />
                    <span className="font-medium">{e.name}</span>
                    <span className="ml-1 text-xs text-muted-foreground">— {e.cluster}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {data?.industries.length ? (
              <CommandGroup heading="Industries">
                {data.industries.map((i) => (
                  <CommandItem
                    key={i.slug}
                    value={`ind-${i.slug}`}
                    onSelect={() => go(() => navigate({ name: "industry", slug: i.slug }))}
                  >
                    <Briefcase className="h-4 w-4 text-gold-600" aria-hidden />
                    <span className="font-medium">{i.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {data?.collections.length ? (
              <CommandGroup heading="Collections">
                {data.collections.map((c) => (
                  <CommandItem
                    key={c.slug}
                    value={`col-${c.slug}`}
                    onSelect={() => go(() => navigate({ name: "collection", slug: c.slug }))}
                  >
                    <Sparkles className="h-4 w-4 text-gold-600" aria-hidden />
                    <span className="font-medium">{c.title}</span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      — {c.memberCount} members
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {data?.stories.length ? (
              <CommandGroup heading="Stories">
                {data.stories.map((s) => (
                  <CommandItem
                    key={s.slug}
                    value={`story-${s.slug}`}
                    onSelect={() => go(() => navigate({ name: "story", slug: s.slug }))}
                  >
                    <Newspaper className="h-4 w-4 text-gold-600" aria-hidden />
                    <span className="font-medium">{s.title}</span>
                    <span className="ml-1 text-xs text-muted-foreground">— {s.category}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {hasQuery && hasResults && (
              <div className="border-t border-border p-2">
                <CommandItem
                  value="all-results"
                  onSelect={() => go(() => navigate({ name: "discover", q: debounced }))}
                >
                  <Search className="h-4 w-4 text-gold-600" aria-hidden />
                  <span className="font-medium">
                    See all professionals matching &ldquo;{debounced}&rdquo;
                  </span>
                </CommandItem>
              </div>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
