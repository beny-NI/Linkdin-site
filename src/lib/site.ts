/**
 * Site-wide constants used by SEO helpers (metadata, sitemap, JSON-LD).
 * Set NEXT_PUBLIC_SITE_URL in .env for production, e.g. https://skilledsphere.com
 */
export const SITE_NAME = "SkilledSphere";
export const SITE_TAGLINE = "Discover the People Shaping What's Next";
export const SITE_DESCRIPTION =
  "SkilledSphere is a curated global professional discovery platform and editorial magazine introducing exceptional professionals, experts, researchers, founders, and leaders across industries worldwide.";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
