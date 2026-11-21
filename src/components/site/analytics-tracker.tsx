"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Sends one anonymous page view per route change to /api/track
 * (no cookies, no stored IP — see app/api/track/route.ts). Respects Do-Not-Track.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (typeof navigator !== "undefined" && navigator.doNotTrack === "1") return;

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer: document.referrer || "" }),
      keepalive: true,
    }).catch(() => {
      /* analytics must never break the site */
    });
  }, [pathname]);

  return null;
}
