import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExpertiseDetailView } from "@/views/expertise-detail-view";
import { getExpertiseSeo } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getExpertiseSeo(slug);
  if (!item) return { title: "Not found", robots: { index: false, follow: false } };

  const title = `${item.name} experts`;
  const description = item.description || `Leading ${item.name} professionals on SkilledSphere.`;
  return {
    title,
    description,
    alternates: { canonical: `/expertise/${item.slug}` },
    openGraph: { title, description, url: `/expertise/${item.slug}` },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const item = await getExpertiseSeo(slug);
  if (!item) notFound();
  return <ExpertiseDetailView slug={slug} />;
}
