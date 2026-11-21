import type { FeaturedApplication } from "@prisma/client";

function parseArray(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function serializeApplication(a: FeaturedApplication) {
  return {
    id: a.id,
    fullName: a.fullName,
    professionalTitle: a.professionalTitle,
    email: a.email,
    countryCode: a.countryCode,
    industry: a.industry,
    expertise: parseArray(a.expertise),
    biography: a.biography,
    linkedinUrl: a.linkedinUrl,
    websiteUrl: a.websiteUrl,
    photoUrl: a.photoUrl,
    achievements: parseArray(a.achievements),
    supportingLinks: parseArray(a.supportingLinks),
    status: a.status,
    editorialNotes: a.editorialNotes,
    createdAt: a.createdAt.toISOString(),
  };
}
