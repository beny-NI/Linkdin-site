"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2, Menu, Search, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { isActivePath } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Real <a href> links (crawlable, middle-click / open-in-new-tab work)
const NAV_ITEMS: { label: string; href: string }[] = [
  { label: "Discover", href: "/discover" },
  { label: "Expertise", href: "/expertise" },
  { label: "Industries", href: "/industries" },
  { label: "Collections", href: "/collections" },
  { label: "Magazine", href: "/magazine" },
];

export function Header() {
  const openSearch = useAppStore((s) => s.openSearch);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // "/" opens the search from anywhere (unless the user is typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      e.preventDefault();
      openSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-navy-700/60 bg-navy-950/90 shadow-lg shadow-navy-950/40 backdrop-blur-xl"
          : "border-b border-transparent bg-navy-950/40 backdrop-blur-md"
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-gold-500 focus:px-3 focus:py-1.5 focus:text-sm focus:font-semibold focus:text-navy-900"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-gold-500"
          aria-label="SkilledSphere home"
        >
        <Image
          src="/header.logo.svg"
          alt="SkilledSphere logo"
          width={36}
          height={36}
          priority
          className="h-9 w-9 object-contain"
          />
          <span className="font-heading text-lg font-extrabold tracking-tight text-white">
            Skilled<span className="text-gold-400">Sphere</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
              className={cn(
                "rounded-full px-3 py-2 text-sm font-medium transition-colors xl:px-4 focus-visible:outline-2 focus-visible:outline-gold-500",
                isActivePath(pathname, item.href)
                  ? "bg-navy-800 text-gold-400"
                  : "text-navy-100 hover:bg-navy-800/60 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Search box (md and up): looks like an input, opens the global search */}
          <button
            type="button"
            onClick={openSearch}
            className="hidden h-10 w-44 items-center gap-2.5 rounded-full border border-navy-600 bg-navy-900/60 pl-4 pr-3 text-left text-sm text-navy-200 transition-colors hover:border-gold-500/60 hover:bg-navy-900 hover:text-white focus-visible:outline-2 focus-visible:outline-gold-500 md:flex lg:w-40 xl:w-72"
            aria-label="Open global search"
          >
            <Search className="h-4 w-4 shrink-0 text-gold-400" aria-hidden />
            <span className="flex-1 truncate">
              <span className="xl:hidden">Search…</span>
              <span className="hidden xl:inline">Search professionals, expertise…</span>
            </span>
            <kbd className="hidden rounded border border-navy-600 px-1.5 py-0.5 text-[10px] font-semibold text-navy-300 xl:inline">
              /
            </kbd>
          </button>
          {/* Icon only on phones */}
          <button
            type="button"
            onClick={openSearch}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-navy-600 bg-navy-900/60 text-navy-100 transition-colors hover:border-gold-500/60 hover:text-gold-400 focus-visible:outline-2 focus-visible:outline-gold-500 md:hidden"
            aria-label="Open global search"
          >
            <Search className="h-4.5 w-4.5" aria-hidden />
          </button>
          <Button
            asChild
            size="sm"
            className="hidden bg-gold-500 font-semibold text-navy-900 hover:bg-gold-400 sm:inline-flex"
          >
            <Link href="/get-featured">
              <Sparkles className="mr-1.5 h-4 w-4" aria-hidden />
              Get Featured
            </Link>
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-navy-600 bg-navy-900/60 text-navy-100 transition-colors hover:text-gold-400 lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" aria-hidden />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-navy-700 bg-navy-950 p-0 text-white">
              <SheetHeader className="border-b border-navy-700/60 px-5 py-4">
                <SheetTitle className="font-heading text-white">
                  Skilled<span className="text-gold-400">Sphere</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Mobile navigation">
                {[...NAV_ITEMS, { label: "About", href: "/about" }, { label: "Contact", href: "/contact" }].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-4 py-3 text-left text-base font-medium text-navy-100 transition-colors hover:bg-navy-800 hover:text-gold-400"
                  >
                    {item.label}
                  </Link>
                ))}
                <Button
                  asChild
                  className="mt-3 bg-gold-500 font-semibold text-navy-900 hover:bg-gold-400"
                >
                  <Link href="/get-featured" onClick={() => setMobileOpen(false)}>
                    <Sparkles className="mr-1.5 h-4 w-4" aria-hidden />
                    Get Featured
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}