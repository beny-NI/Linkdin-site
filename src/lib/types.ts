// Shared DTO types between API and frontend

export interface CountryDTO {
  code: string;
  name: string;
  flag: string;
  latitude: number;
  longitude: number;
  professionalCount: number;
}

export interface ExpertiseDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  cluster: string;
  order: number;
  parentSlug: string | null;
  children: ExpertiseDTO[];
  professionalCount: number;
}

export interface IndustryDTO {
  slug: string;
  name: string;
  description: string;
  professionalCount: number;
}

export interface ProfessionalCardDTO {
  slug: string;
  fullName: string;
  professionalTitle: string;
  summary: string;
  portraitUrl: string;
  city: string;
  organization: string | null;
  country: { code: string; name: string; flag: string };
  expertise: { slug: string; name: string }[];
  industries: { slug: string; name: string }[];
  featuredLabel?: string | null;
}

export interface ExperienceItem { role: string; org: string; period: string; description: string }
export interface EducationItem { degree: string; institution: string; year: string }
export interface ProjectItem { name: string; description: string; year: string }
export interface PublicationItem { title: string; venue: string; year: string }
export interface AwardItem { title: string; org: string; year: string }
export interface LinkItem { label: string; url: string }

export interface ProfessionalDetailDTO extends ProfessionalCardDTO {
  biography: string;
  achievements: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  publications: PublicationItem[];
  awards: AwardItem[];
  links: LinkItem[];
  relatedProfessionals: ProfessionalCardDTO[];
  relatedStories: StoryCardDTO[];
}

export interface CollectionCardDTO {
  slug: string;
  title: string;
  description: string;
  coverUrl: string | null;
  kind: string;
  edition: string | null;
  memberCount: number;
  members: ProfessionalCardDTO[];
}

export interface StoryCardDTO {
  slug: string;
  title: string;
  subtitle: string;
  coverUrl: string | null;
  author: string;
  category: string;
  excerpt: string;
  readingMinutes: number;
  publicationDate: string;
  relatedProfessionals?: ProfessionalCardDTO[];
}

export interface StoryDetailDTO extends StoryCardDTO {
  content: string;
  relatedExpertise: { slug: string; name: string }[];
  relatedStories: StoryCardDTO[];
}


export interface BootstrapDTO {
  hero: ProfessionalDetailDTO[];
  countries: CountryDTO[];
  expertiseTree: ExpertiseDTO[];
  industries: IndustryDTO[];
  collections: CollectionCardDTO[];
  stories: StoryCardDTO[];
  stats: { professionals: number; countries: number; stories: number; collections: number; expertise: number };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchResultsDTO {
  professionals: ProfessionalCardDTO[];
  expertise: { slug: string; name: string; cluster: string }[];
  industries: { slug: string; name: string }[];
  collections: { slug: string; title: string; memberCount: number }[];
  stories: StoryCardDTO[];
}