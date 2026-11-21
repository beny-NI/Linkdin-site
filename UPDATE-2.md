# Update 2

1) Extract this zip over the project root (overwrites the files with the same path).
2) DELETE these files/folders (no longer used):
   src/app/api/featured/route.ts
   src/app/api/admin/featured/            (whole folder)
   src/app/admin/(panel)/featured/        (whole folder)
3) Apply the 3 small edits to src/lib/types.ts, src/views/home-view.tsx and
   src/app/api/professionals/[slug]/route.ts (given in the chat).
4) .env (optional, for LinkedIn auto-fill):  ANTHROPIC_API_KEY="sk-ant-..."
   (optional) ANTHROPIC_MODEL="claude-sonnet-5-5"
5) bunx prisma db push && bunx prisma generate   (adds the "archived" column; no data is lost)
6) restart: bun run dev
