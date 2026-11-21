"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ExternalLink,
  Inbox,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Newspaper,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const GROUPS: { title: string; items: NavItem[] }[] = [
  { title: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }] },
  {
    title: "Publish",
    items: [
      { href: "/admin/professionals", label: "Professionals", icon: Users },
      { href: "/admin/stories", label: "Magazine stories", icon: Newspaper },
      { href: "/admin/collections", label: "Collections", icon: Layers },
    ],
  },
  {
    title: "Homepage",
    items: [{ href: "/admin/homepage", label: "Homepage", icon: LayoutTemplate }],
  },
  { title: "Inbox", items: [{ href: "/admin/applications", label: "Applications", icon: Inbox }] },
  { title: "Setup", items: [{ href: "/admin/taxonomy", label: "Expertise & places", icon: Tags }] },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" }).catch(() => null);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col bg-navy-950 text-navy-100">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-navy-800 px-5">
        <Image src="/header.logo.svg" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
        <div className="leading-tight">
          <p className="font-heading text-base font-extrabold tracking-tight text-white">
            Skilled<span className="text-gold-400">Sphere</span>
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-400">Control panel</p>
        </div>
      </div>

      <nav className="scrollbar-elegant flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Admin navigation">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-navy-400">{group.title}</p>
            <ul className="mt-2 space-y-0.5">
              {group.items.map((item) => {
                const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-navy-800 text-gold-400"
                          : "text-navy-200 hover:bg-navy-800/60 hover:text-white"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-navy-800 p-3">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-navy-200 hover:bg-navy-800/60 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" aria-hidden /> View live site
        </a>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-navy-200 hover:bg-navy-800/60 hover:text-white"
        >
          <LogOut className="h-4 w-4" aria-hidden /> Sign out
        </button>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen lg:block">
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* mobile top bar */}
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-navy-800 bg-navy-950 px-4 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button type="button" className="rounded-md p-2 text-white hover:bg-navy-800" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-navy-800 bg-navy-950 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Admin menu</SheetTitle>
              </SheetHeader>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <p className="font-heading text-base font-extrabold text-white">
            Skilled<span className="text-gold-400">Sphere</span>
            <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-400">Admin</span>
          </p>
          <span className="w-9" />
        </div>

        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
