import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileView } from "@/views/profile-view";
import { JsonLd } from "@/components/seo/json-ld";
import { getProfessionalSeo } from "@/lib/seo";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProfessionalSeo(slug);
  if (!p) return { title: "Profile not found", robots: { index: false, follow: false } };

  const title = `${p.fullName} — ${p.professionalTitle}`;
  const url = `/professionals/${p.slug}`;
  return {
    title,
    description: p.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      title,
      description: p.summary,
      url,
      siteName: SITE_NAME,
      images: [{ url: p.portraitUrl, alt: p.fullName }],
    },
    twitter: { card: "summary_large_image", title, description: p.summary, images: [p.portraitUrl] },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const p = await getProfessionalSeo(slug);
  if (!p) notFound(); // real HTTP 404 for unknown / unpublished profiles

  const person: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.fullName,
    jobTitle: p.professionalTitle,
    description: p.summary,
    image: absoluteUrl(p.portraitUrl),
    url: absoluteUrl(`/professionals/${p.slug}`),
    address: { "@type": "PostalAddress", addressLocality: p.city, addressCountry: p.country.code },
  };
  if (p.organization) person.worksFor = { "@type": "Organization", name: p.organization };

  return (
    <>
      <JsonLd data={person} />
      <ProfileView slug={slug} />
    </>
  );
}
