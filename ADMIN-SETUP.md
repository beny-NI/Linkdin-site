# SkilledSphere admin panel — setup

## 1) Back up the database
cp db/custom.db db/custom.backup.db

## 2) Copy the files
Unzip this archive in the project root (the folder with package.json). Same paths as the project.
It OVERWRITES these 6 existing files:
  prisma/schema.prisma
  src/app/layout.tsx
  src/app/robots.ts
  src/app/api/bootstrap/route.ts
  src/components/site/footer.tsx
  src/lib/admin-auth.ts
Everything else is new (src/app/admin/**, src/app/api/admin/**, src/components/admin/**, ...).

## 3) Add to .env
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD="a-long-password"
ADMIN_SESSION_SECRET="<random 32+ chars, e.g. output of: openssl rand -hex 32>"
# optional: where uploaded images are stored (use an absolute, persistent folder in production)
# UPLOAD_DIR="/var/skilledsphere/uploads"

## 4) Update the database (adds 2 columns per table + PageView table; keeps all data)
bunx prisma db push
bunx prisma generate
(Do NOT run `bun run db:push` or the seed — they can wipe data.)

## 5) Run
bun run dev   ->  http://localhost:3000  ->  footer "Admin login"  (or /admin)
