"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { viewToPath } from "@/lib/routes";

/** Connects the legacy `navigate(view)` API to the Next.js App Router. */
export function RouterBridge() {
  const router = useRouter();

  useEffect(() => {
    useAppStore.setState({
      navigate: (view) => router.push(viewToPath(view)),
    });
  }, [router]);

  return null;
}
