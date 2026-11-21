import type { Prisma } from "@prisma/client";
import type {
  ProfessionalCardDTO,
  ProfessionalDetailDTO,
  StoryCardDTO,
} from "@/lib/types";

function parse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

type ProfessionalWithRelations = Prisma.ProfessionalGetPayload<{
  include: {
    country: true;
    expertise: { include: { expertise: true } };
    industries: { include: { industry: true } };
  };
}>;

export const professionalInclude = {
  country: true,
  expertise: { include: { expertise: true } },
  industries: { include: { industry: true } },
} satisfies Prisma.ProfessionalInclude;

export function toProfessionalCard(
  p: ProfessionalWithRelations,
  featuredLabel?: string | null
): ProfessionalCardDTO {
  return {
    slug: p.slug,
    fullName: p.fullName,
    professionalTitle: p.professionalTitle,
    summary: p.summary,
    portraitUrl: p.portraitUrl,
    city: p.city,
    organization: p.organization,
    country: { code: p.country.code, name: p.country.name, flag: p.country.flag },
    expertise: p.expertise.map((e) => ({ slug: e.expertise.slug, name: e.expertise.name })),
    industries: p.industries.map((i) => ({ slug: i.industry.slug, name: i.industry.name })),
    featuredLabel: featuredLabel ?? null,
  };
}

type StoryWithRelations = Prisma.StoryGetPayload<{
  include: {
    relatedProfessionals: { include: { professional: { include: typeof professionalInclude } } };
  };
}>;

export const storyInclude = {
  relatedProfessionals: {
    include: { professional: { include: professionalInclude } },
  },
} satisfies Prisma.StoryInclude;

export function toStoryCard(s: StoryWithRelations): StoryCardDTO {
  return {
    slug: s.slug,
    title: s.title,
    subtitle: s.subtitle,
    coverUrl: s.coverUrl,
    author: s.author,
    category: s.category,
    excerpt: s.excerpt,
    readingMinutes: s.readingMinutes,
    publicationDate: s.publicationDate.toISOString(),
    relatedProfessionals: s.relatedProfessionals.map((rp) =>
      toProfessionalCard(rp.professional)
    ),
  };
}

type ProfessionalFull = ProfessionalWithRelations & {
  featuredSchedules?: { label: string; featuredDate: Date; active: boolean }[];
};

export function toProfessionalDetail(
  p: ProfessionalFull
): ProfessionalDetailDTO {
  const card = toProfessionalCard(p, p.featuredSchedules?.[0]?.label);
  return {
    ...card,
    biography: p.biography,
    achievements: parse<string[]>(p.achievements, []),
    experience: parse(p.experience, []),
    education: parse(p.education, []),
    projects: parse(p.projects, []),
    publications: parse(p.publications, []),
    awards: parse(p.awards, []),
    links: parse(p.links, []),
    relatedProfessionals: [],
    relatedStories: [],
  };
}
