import { cache } from "react";
import { db } from "@/lib/db";

/**
 * Lightweight, request-cached lookups used by generateMetadata() and the page
 * component (React `cache` makes the second call free). A `null` result means
 * "does not exist / not published" -> the page calls notFound() (real 404).
 */

export const getProfessionalSeo = cache(async (slug: string) =>
  db.professional.findFirst({
    where: { slug, published: true },
    select: {
      slug: true,
      fullName: true,
      professionalTitle: true,
      summary: true,
      portraitUrl: true,
      city: true,
      organization: true,
      updatedAt: true,
      country: { select: { name: true, code: true } },
    },
  })
);

export const getStorySeo = cache(async (slug: string) =>
  db.story.findFirst({
    where: { slug, published: true },
    select: {
      slug: true,
      title: true,
      subtitle: true,
      excerpt: true,
      coverUrl: true,
      author: true,
      category: true,
      publicationDate: true,
    },
  })
);

export const getCollectionSeo = cache(async (slug: string) =>
  db.collection.findFirst({
    where: { slug, published: true },
    select: { slug: true, title: true, description: true, coverUrl: true },
  })
);

export const getExpertiseSeo = cache(async (slug: string) =>
  db.expertise.findUnique({
    where: { slug },
    select: { slug: true, name: true, description: true },
  })
);

export const getIndustrySeo = cache(async (slug: string) =>
  db.industry.findUnique({
    where: { slug },
    select: { slug: true, name: true, description: true },
  })
);
