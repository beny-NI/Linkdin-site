"use client";

import { Globe2, Linkedin, Twitter, Youtube } from "lucide-react";
import { useAppStore, type View } from "@/lib/store";

const COLUMNS: { title: string; links: { label: string; view: View }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Discover Professionals", view: { name: "discover" } },
      { label: "Expertise", view: { name: "expertise-directory" } },
      { label: "Industries", view: { name: "industry-directory" } },
      { label: "Collections", view: { name: "collections" } },
      { label: "Magazine", view: { name: "magazine" } },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", view: { name: "about" } },
      { label: "Get Featured", view: { name: "get-featured" } },
      { label: "Contact", view: { name: "contact" } },
    ],
  },
];

export function Footer() {
  const navigate = useAppStore((s) => s.navigate);
  return (
    <footer className="mt-auto border-t border-navy-700/60 bg-navy-950 text-navy-100">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <button
              type="button"
              onClick={() => navigate({ name: "home" })}
              className="flex items-center gap-2.5"
              aria-label="SkilledSphere home"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500/50 bg-navy-900">
                <Globe2 className="h-5 w-5 text-gold-400" aria-hidden />
              </span>
              <span className="font-heading text-lg font-extrabold tracking-tight text-white">
                Skilled<span className="text-gold-400">Sphere</span>
              </span>
            </button>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy-200">
              A curated global platform introducing exceptional professionals, experts,
              researchers, founders, and leaders — with a premium editorial identity.
            </p>
            <p className="mt-4 text-sm font-semibold text-gold-400">
              Discover the People Shaping What&apos;s Next.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { icon: Linkedin, label: "LinkedIn" },
                { icon: Twitter, label: "X (Twitter)" },
                { icon: Youtube, label: "YouTube" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-navy-700 text-navy-200 transition-colors hover:border-gold-500/60 hover:text-gold-400"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-gold-400">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      type="button"
                      onClick={() => navigate(link.view)}
                      className="text-sm text-navy-200 transition-colors hover:text-gold-400"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-gold-400">Legal</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm text-navy-200 transition-colors hover:text-gold-400"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-sm text-navy-200 transition-colors hover:text-gold-400"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="gold-hairline mt-12" />
        <div className="mt-6 flex flex-col items-center justify-between gap-3 text-xs text-navy-300 sm:flex-row">
          <p>© {new Date().getFullYear()} SkilledSphere. All rights reserved.</p>
          <p>Crafted for professionals worldwide. Demo data for development purposes.</p>
        </div>
      </div>
    </footer>
  );
}
