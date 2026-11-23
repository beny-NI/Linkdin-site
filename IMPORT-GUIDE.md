# Import people from Excel — guide

## 0) Back up
cp db/custom.db db/custom.before-import.db

## 1) Copy files (unzip over the project root; nothing existing is overwritten)
  prisma/people.json   (the 200 selected people)
  prisma/people-all.json (all 560, only if you want more later: PEOPLE_FILE=people-all.json)
  selection-review.xlsx (who was selected and why; for your review)
  prisma/import-people.ts
  public/images/portraits/placeholder.svg
  image-names.csv   (full name -> file name to use for each photo; not needed by the site)

## 2) City is empty -> 3 tiny edits so the site doesn't show ", Egypt"
In these 3 files replace the city/country text:
  src/components/site/professional-card.tsx  (line ~43)
  src/views/profile-view.tsx                 (line ~128)
  src/views/home-view.tsx                    (line ~180)

  {p.city}, {p.country.name}      ->  {[p.city, p.country.name].filter(Boolean).join(", ")}
  (in home-view.tsx the variable is `card` instead of `p`)

## 3) Run (do NOT run the seed or db:push)
bun prisma/import-people.ts                   # everyone as DRAFT
# optional flags:  PUBLISH=1   ARCHIVE_OLD=1 (archives the 22 sample people, reversible)

## 4) Review in /admin, then publish
Photos: put <slug>.png|jpg|webp in public/images/portraits/ (names in image-names.csv) and run the script again;
it only updates portraits of people already imported and never overwrites your edits.

## Selection (400 of 560)
prisma/people.json now holds only the 400 selected people (200 top-quality + 200 chosen for diversity across fields).
selection-report.csv shows who was picked and why (group, score). prisma/people-all.json is the full 560 (not used by the script).
