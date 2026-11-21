import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IndustryDetailView } from "@/views/industry-detail-view";
import { getIndustrySeo } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getIndustrySeo(slug);
  if (!item) return { title: "Not found", robots: { index: false, follow: false } };

  const title = `${item.name} professionals`;
  const description = item.description || `Leading professionals in ${item.name} on SkilledSphere.`;
  return {
    title,
    description,
    alternates: { canonical: `/industries/${item.slug}` },
    openGraph: { title, description, url: `/industries/${item.slug}` },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const item = await getIndustrySeo(slug);
  if (!item) notFound();
  return <IndustryDetailView slug={slug} />;
}
