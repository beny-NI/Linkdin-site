import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionDetailView } from "@/views/collection-detail-view";
import { getCollectionSeo } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getCollectionSeo(slug);
  if (!item) return { title: "Not found", robots: { index: false, follow: false } };

  const title = item.title;
  const description = item.description;
  return {
    title,
    description,
    alternates: { canonical: `/collections/${item.slug}` },
    openGraph: { title, description, url: `/collections/${item.slug}`, images: item.coverUrl ? [{ url: item.coverUrl, alt: item.title }] : undefined },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const item = await getCollectionSeo(slug);
  if (!item) notFound();
  return <CollectionDetailView slug={slug} />;
}
