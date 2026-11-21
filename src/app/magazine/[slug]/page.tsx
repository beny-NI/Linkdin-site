import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryView } from "@/views/story-view";
import { JsonLd } from "@/components/seo/json-ld";
import { getStorySeo } from "@/lib/seo";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = await getStorySeo(slug);
  if (!s) return { title: "Story not found", robots: { index: false, follow: false } };

  const url = `/magazine/${s.slug}`;
  return {
    title: s.title,
    description: s.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: s.title,
      description: s.excerpt,
      url,
      siteName: SITE_NAME,
      publishedTime: s.publicationDate.toISOString(),
      authors: [s.author],
      images: s.coverUrl ? [{ url: s.coverUrl, alt: s.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: s.title,
      description: s.excerpt,
      images: s.coverUrl ? [s.coverUrl] : undefined,
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const s = await getStorySeo(slug);
  if (!s) notFound();

  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: s.title,
    description: s.excerpt,
    articleSection: s.category,
    datePublished: s.publicationDate.toISOString(),
    author: { "@type": "Person", name: s.author },
    publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: absoluteUrl("/logo.svg") } },
    mainEntityOfPage: absoluteUrl(`/magazine/${s.slug}`),
  };
  if (s.coverUrl) article.image = absoluteUrl(s.coverUrl);

  return (
    <>
      <JsonLd data={article} />
      <StoryView slug={slug} />
    </>
  );
}
