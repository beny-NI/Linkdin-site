import type { Metadata } from "next";
import { DiscoverView } from "@/views/discover-view";

export const metadata: Metadata = {
  title: "Discover Professionals",
  description:
    "Search and filter exceptional professionals by country, expertise, industry and collection on SkilledSphere.",
  alternates: { canonical: "/discover" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const country = first(sp.country);
  const expertise = first(sp.expertise);
  const industry = first(sp.industry);
  const collection = first(sp.collection);
  const q = first(sp.q);

  return (
    <DiscoverView
      // re-mount when the URL filters change so the view's local state re-initialises
      key={JSON.stringify([country, expertise, industry, collection, q])}
      initialCountry={country}
      initialExpertise={expertise}
      initialIndustry={industry}
      initialCollection={collection}
      initialQuery={q}
    />
  );
}
