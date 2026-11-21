import type { View } from "@/lib/store";

/** Single source of truth: View object  ->  URL. */
export function viewToPath(view: View): string {
  switch (view.name) {
    case "home":
      return "/";
    case "discover": {
      const params = new URLSearchParams();
      const entries: [string, string | undefined][] = [
        ["country", view.country],
        ["expertise", view.expertise],
        ["industry", view.industry],
        ["collection", view.collection],
        ["q", view.q],
      ];
      for (const [k, v] of entries) {
        if (v && v !== "all") params.set(k, v);
      }
      const qs = params.toString();
      return qs ? `/discover?${qs}` : "/discover";
    }
    case "expertise-directory":
      return "/expertise";
    case "expertise":
      return `/expertise/${encodeURIComponent(view.slug)}`;
    case "industry-directory":
      return "/industries";
    case "industry":
      return `/industries/${encodeURIComponent(view.slug)}`;
    case "collections":
      return "/collections";
    case "collection":
      return `/collections/${encodeURIComponent(view.slug)}`;
    case "magazine":
      return "/magazine";
    case "story":
      return `/magazine/${encodeURIComponent(view.slug)}`;
    case "profile":
      return `/professionals/${encodeURIComponent(view.slug)}`;
    case "about":
      return "/about";
    case "get-featured":
      return "/get-featured";
    case "contact":
      return "/contact";
  }
}

/** True when `pathname` is `base` or one of its children (`/expertise` ⊃ `/expertise/ai`). */
export function isActivePath(pathname: string | null, base: string): boolean {
  if (!pathname) return false;
  return pathname === base || pathname.startsWith(`${base}/`);
}
