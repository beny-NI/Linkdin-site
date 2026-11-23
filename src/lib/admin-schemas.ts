import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);
const requiredText = (max: number, label: string) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

/** An uploaded image (/api/uploads/...), a site image (/images/...) or an https URL. */
const imageUrl = z
  .string()
  .trim()
  .max(600)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v), "Must be an image URL or a /path");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

const slugField = z
  .string()
  .trim()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may contain lowercase letters, numbers and dashes only")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const STORY_CATEGORIES = ["Interview", "Leadership", "Innovation", "Industry Insight", "Success Story"] as const;
export const COLLECTION_KINDS = ["editorial", "ranking"] as const;
export const EXPERTISE_CLUSTERS = ["Technology", "Business", "Science & Research", "Creative", "Finance"] as const;

export const PLACEHOLDER_PORTRAIT = "/images/portraits/placeholder.svg";

export const professionalSchema = z.object({
  slug: slugField,
  fullName: requiredText(120, "Full name").pipe(z.string().min(2, "Full name is too short")),
  professionalTitle: requiredText(160, "Title"),
  summary: requiredText(400, "Short summary"),
  biography: requiredText(20000, "Biography"),
  portraitUrl: imageUrl.pipe(z.string().min(1, "Portrait is required")),
  city: requiredText(80, "City"),
  organization: optionalText(160),
  countryCode: requiredText(2, "Country").pipe(z.string().length(2, "Choose a country")),
  achievements: z.array(text(500)).max(30).default([]),
  experience: z
    .array(z.object({ role: text(160), org: text(160), period: text(60), description: text(1500) }))
    .max(30)
    .default([]),
  education: z
    .array(z.object({ degree: text(160), institution: text(160), year: text(20) }))
    .max(20)
    .default([]),
  projects: z
    .array(z.object({ name: text(160), description: text(1500), year: text(20) }))
    .max(30)
    .default([]),
  publications: z
    .array(z.object({ title: text(300), venue: text(160), year: text(20) }))
    .max(50)
    .default([]),
  awards: z
    .array(z.object({ title: text(200), org: text(160), year: text(20) }))
    .max(30)
    .default([]),
  links: z.array(z.object({ label: text(60), url: text(500) })).max(20).default([]),
  expertiseIds: z.array(z.string()).max(30).default([]),
  industryIds: z.array(z.string()).max(30).default([]),
  published: z.boolean().default(true),
}).superRefine((v, ctx) => {
  if (v.published && v.portraitUrl === PLACEHOLDER_PORTRAIT) {
    ctx.addIssue({ code: "custom", path: ["portraitUrl"], message: "Upload a real portrait photo before publishing" });
  }
});
export type ProfessionalInput = z.infer<typeof professionalSchema>;

export const storySchema = z.object({
  slug: slugField,
  title: requiredText(200, "Title"),
  subtitle: requiredText(300, "Subtitle"),
  coverUrl: imageUrl.nullish().transform((v) => (v ? v : null)),
  author: requiredText(120, "Author"),
  category: z.enum(STORY_CATEGORIES),
  excerpt: requiredText(600, "Excerpt"),
  content: requiredText(200000, "Content"),
  readingMinutes: z.number().int().min(1).max(180).optional(),
  publicationDate: z.string().trim().min(8, "Publication date is required"),
  published: z.boolean().default(true),
  professionalIds: z.array(z.string()).max(30).default([]),
  expertiseIds: z.array(z.string()).max(30).default([]),
});
export type StoryInput = z.infer<typeof storySchema>;

export const collectionSchema = z.object({
  slug: slugField,
  title: requiredText(160, "Title"),
  description: requiredText(1500, "Description"),
  coverUrl: imageUrl.nullish().transform((v) => (v ? v : null)),
  kind: z.enum(COLLECTION_KINDS),
  edition: optionalText(60),
  published: z.boolean().default(true),
  memberIds: z.array(z.string()).max(200).default([]), // ORDER MATTERS
});
export type CollectionInput = z.infer<typeof collectionSchema>;

export const HOME_LIMITS = { professionals: 5, collections: 3, stories: 3 } as const;

export const homepageSchema = z.object({
  professionals: z.array(z.string()).max(HOME_LIMITS.professionals, "The hero can show at most 5 people"),
  /** the one hero person with the "Person of the Day" look (must be one of `professionals`) */
  potd: z.string().nullish().transform((v) => (v ? v : null)),
  collections: z.array(z.string()).max(HOME_LIMITS.collections),
  stories: z.array(z.string()).max(HOME_LIMITS.stories),
});

export const togglePatchSchema = z.object({
  published: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export const expertiseSchema = z.object({
  name: requiredText(100, "Name"),
  slug: slugField,
  description: text(600).default(""),
  cluster: z.enum(EXPERTISE_CLUSTERS),
  order: z.number().int().min(0).max(9999).default(0),
  parentId: z.string().nullish().transform((v) => (v ? v : null)),
});

export const industrySchema = z.object({
  name: requiredText(100, "Name"),
  slug: slugField,
  description: text(600).default(""),
  order: z.number().int().min(0).max(9999).default(0),
});

export const countrySchema = z.object({
  code: z.string().trim().toUpperCase().length(2, "Use the 2-letter ISO code"),
  name: requiredText(100, "Name"),
  flag: requiredText(16, "Flag"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const globeSchema = z.object({
  country: z.string().trim().length(2),
  ids: z.array(z.string()).max(5, "At most 5 people per country"),
});

export const bulkSchema = z.object({
  entity: z.enum(["professionals", "stories", "collections"]),
  action: z.enum(["delete", "publish", "unpublish", "archive", "restore"]),
  ids: z.array(z.string()).max(1000).optional(),
  /** apply to everything matching the current list filter instead of explicit ids */
  all: z.object({ q: z.string().max(100).default(""), status: z.enum(["all", "published", "draft", "archived"]).default("all") }).optional(),
});
