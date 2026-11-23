# Update 3

1) Install the Excel library:            bun add exceljs
2) Extract this zip over the project root (same paths).
3) .env  (AI works with ANY OpenAI-compatible provider):
     AI_API_KEY="..."
     AI_BASE_URL="https://api.openai.com/v1"
     AI_MODEL="gpt-4o-mini"
   (ANTHROPIC_API_KEY is no longer used.)
4) bunx prisma db push && bunx prisma generate     (adds 3 columns; keeps all data)
5) Edit by hand (see chat): src/lib/types.ts, src/lib/queries.ts, src/views/home-view.tsx,
   src/components/globe/Globe.tsx
6) restart: bun run dev

# EXCEL STANDARD
Sheet "People", headers in row 1, one person per row (download the template in Admin -> Professionals -> Import from Excel).
Required: full_name, professional_title, city, country, biography
Optional: organization, summary, expertise, industries, achievements, portrait_url, linkedin_url, website_url,
          experience, education, awards, publications, projects, slug
Several values in a cell: separate with ;   Lists: one entry per line (Alt+Enter), fields separated by |
  experience:   Role | Organization | Period | Description
  education:    Degree | Institution | Year
  awards:       Title | Organization | Year
  publications: Title | Venue | Year
  projects:     Name | Description | Year
