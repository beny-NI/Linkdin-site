"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { SearchDialog } from "@/components/site/search-dialog";
import { AnalyticsTracker } from "@/components/site/analytics-tracker";

/**
 * Public-site chrome (header, footer, search, analytics).
 * The admin panel (/admin/*) has its own shell, so the chrome is skipped there.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <>
      <AnalyticsTracker />
      <div className="flex min-h-screen flex-col">
        <Header />
        {/* each route's <main> comes from app/template.tsx */}
        {children}
        <Footer />
      </div>
      <SearchDialog />
    </>
  );
}
