/** Column standard for the Excel import (plain data — safe to import in the browser). */
export interface ColumnDef {
  key: string;
  required: boolean;
  description: string;
  example: string;
}

export const COLUMNS: ColumnDef[] = [
  { key: "full_name", required: true, description: "Full name", example: "Dr. Anna Becker" },
  { key: "professional_title", required: true, description: "Job title", example: "Chief AI Scientist" },
  { key: "organization", required: false, description: "Company / institution", example: "Helix Labs" },
  { key: "city", required: true, description: "City", example: "Berlin" },
  { key: "country", required: true, description: "Country: English name or 2-letter code (DE). New countries are added automatically.", example: "Germany" },
  { key: "summary", required: false, description: "1-2 sentence teaser, max 400 characters (if empty: taken from the biography)", example: "Leads applied research on trustworthy machine learning." },
  { key: "biography", required: true, description: "Full biography (plain text)", example: "Anna Becker is a researcher and executive who ..." },
  { key: "expertise", required: false, description: "Names from your site's expertise list, separated by ;", example: "Artificial Intelligence; Data Science" },
  { key: "industries", required: false, description: "Names from your site's industry list, separated by ;", example: "Technology; Healthcare" },
  { key: "achievements", required: false, description: "Key achievements, separated by ; or new lines", example: "Built a 40-person research lab; 12 patents" },
  { key: "portrait_url", required: false, description: "Photo link (https://… or /images/…). Empty = placeholder; upload the photo in the review step", example: "https://example.com/anna.jpg" },
  { key: "linkedin_url", required: false, description: "LinkedIn profile link", example: "https://www.linkedin.com/in/anna-becker" },
  { key: "website_url", required: false, description: "Personal / company website", example: "https://annabecker.example" },
  { key: "experience", required: false, description: "One position per line:  Role | Organization | Period | Description", example: "CTO | Helix Labs | 2020 – Present | Leads engineering" },
  { key: "education", required: false, description: "One per line:  Degree | Institution | Year", example: "PhD Computer Science | TU Berlin | 2012" },
  { key: "awards", required: false, description: "One per line:  Title | Organization | Year", example: "Young Scientist Award | DFG | 2018" },
  { key: "publications", required: false, description: "One per line:  Title | Venue | Year", example: "Robust Learning at Scale | NeurIPS | 2021" },
  { key: "projects", required: false, description: "One per line:  Name | Description | Year", example: "Open Health AI | Open dataset for clinical models | 2022" },
  { key: "slug", required: false, description: "Web address part (leave empty = generated from the name)", example: "anna-becker" },
];

export const MAX_ROWS = 500;
