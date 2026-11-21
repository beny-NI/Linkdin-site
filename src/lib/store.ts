"use client";

import { create } from "zustand";
import { viewToPath } from "@/lib/routes";

/**
 * Kept for backwards compatibility: every view still calls
 * `navigate({ name: "profile", slug })`. The URL is now the source of truth —
 * <RouterBridge /> (mounted in the root layout) replaces `navigate` with a
 * real Next.js router.push.
 */
export type View =
  | { name: "home" }
  | { name: "discover"; country?: string; expertise?: string; industry?: string; collection?: string; q?: string }
  | { name: "expertise-directory" }
  | { name: "expertise"; slug: string }
  | { name: "industry-directory" }
  | { name: "industry"; slug: string }
  | { name: "collections" }
  | { name: "collection"; slug: string }
  | { name: "magazine" }
  | { name: "story"; slug: string }
  | { name: "profile"; slug: string }
  | { name: "about" }
  | { name: "get-featured" }
  | { name: "contact" };

interface AppState {
  searchOpen: boolean;
  navigate: (view: View) => void;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  searchOpen: false,
  // Fallback until RouterBridge mounts: a full page load is still a correct navigation.
  navigate: (view) => {
    if (typeof window !== "undefined") window.location.assign(viewToPath(view));
  },
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
}));
