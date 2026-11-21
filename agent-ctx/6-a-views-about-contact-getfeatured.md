# Task 6-a — Views: About / Contact / GetFeatured

## Files created (only these three, nothing else touched)
- `src/views/about-view.tsx` — exports `AboutView`
- `src/views/contact-view.tsx` — exports `ContactView`
- `src/views/get-featured-view.tsx` — exports `GetFeaturedView`

All three are `"use client"` components, named exports, top-level `<div className="flex-1">`, with top padding that clears the fixed h-16 header.

## Key implementation notes
- **AboutView**: navy-950 hero (eyebrow-light, pt-28/pt-36), pull-quote on warm white with gold hairline, "What we do" 3-col grid (Compass/Newspaper/Handshake icons in gold-ringed circles), editorial principles 2x2 on navy-950 with gold `font-heading font-extrabold text-gold-500/40` numerals, 4-stat band, navy CTA band with gold Button navigating to `{ name: "get-featured" }`.
- **ContactView**: light hero pt-24/pt-32, `lg:grid-cols-[1fr_1.2fr]` two-column layout, channel cards with mailto links (Editorial/Partnerships/Press), offices row (London/Zürich/Singapore), 5-business-days note. Form: name/email/topic Select (Editorial, Get Featured, Partnership, Press, Other)/message with state-based inline validation (text-destructive), success Alert + toast, form reset. Demo nature noted.
- **GetFeaturedView**: navy hero with 3-step process (Submit → Editorial review → Curated publication). react-hook-form + zod (`zodResolver`, zod v4) with shadcn Form components. Countries fetched from `GET /api/countries` (CountryDTO[]), industries from `GET /api/industries` (IndustryDTO[]), with loading spinners inside the Select triggers. Custom `ChipsInput` control (Enter/comma/blur to add, X to remove, dedupe, count "n / max", URL validation for supporting links) used for expertise (max 12), achievements (max 10), supportingLinks (max 8). Submit POSTs to `/api/applications`; 201 → success panel + toast; 422 → toast + `details` mapped back to form field errors via `form.setError`; network error → destructive toast. Loader2 spinner on disabled submit button. Success panel: gold check, "Application received", demo note, "Return home" via `navigate({ name: "home" })`.

## API assumptions
- `GET /api/countries` → `CountryDTO[]` `{ code, name, flag, latitude, longitude, professionalCount }` — select value uses `code`, label shows flag + name.
- `GET /api/industries` → `{ slug, name, description, professionalCount }[]` — submits industry **name** per spec/server schema.
- `POST /api/applications` — body matches server zod schema exactly (optional URLs sent as `""`, arrays as string[]). Verified against the actual route implementation; 422 `details` shape `{ field: string[] }`.

## Verification
- `bunx tsc --noEmit` filtered for `views/(about|contact|get-featured)`: zero errors.
- `bun run lint`: only pre-existing error in `src/components/site/search-dialog.tsx` (not mine); my three files are clean.
- dev.log: only unresolved modules are `story-view`/`profile-view` (concurrent tasks); my views resolve.
