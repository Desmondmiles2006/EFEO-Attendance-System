# EFEO Attendance System

Attendance and leave-management webapp for EFEO. Members self-register and submit
leave/absence requests with a reason; admins approve accounts and requests, and can
export records to Excel.

**Stack:** Next.js (App Router) + TypeScript + Tailwind, PostgreSQL via Prisma, NextAuth
(credentials login), ExcelJS for exports.

## How it works

- **Members** register at `/register`. New accounts start as `PENDING` until an admin
  approves them at `/admin/members`.
- Once active, a member signs in and submits leave/absence requests at
  `/dashboard/leave/new` (leave type, dates, reason). Requests start `PENDING`.
- **Admins** approve or reject requests at `/admin/requests`. Only approved requests
  count toward leave balances and appear in exports.
- Annual quotas (CL 12 days, Medical 15 days, Special 3 days) are tracked and shown
  as a warning when exceeded — submission is never blocked.
- Admins export data to `.xlsx` at `/admin/export`: institute-wide report, leave
  balance summary, a monthly calendar-style attendance sheet (color-coded to match
  the absence-code chart), and a per-member record.

The 15 absence codes (CL, CL1, CL2, MED, MEDH, MEDO, P, Co+, C-, AL, W, SL, D, SD, LWP)
plus `Pre` (present, used only in exports) are seeded from `prisma/seed.ts`.

## Local setup

1. **Get a PostgreSQL database.** The free tier of [Neon](https://neon.tech) or
   [Supabase](https://supabase.com) both work. Copy the connection string.
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — your Postgres connection string
   - `AUTH_SECRET` — generate with `npx auth secret`
   - `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — the first admin account (change the
     password after first login; there's no in-app change-password flow yet, use
     Prisma Studio or a fresh seed to update it)
3. Install dependencies and set up the database:
   ```bash
   npm install
   npm run db:migrate   # creates tables
   npm run db:seed      # seeds absence codes + the first admin
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 — sign in with the seeded admin account, or register a
   new member account and approve it from `/admin/members`.

Useful scripts:

- `npm run db:studio` — browse/edit the database in Prisma Studio
- `npm run db:migrate` — create/apply a new migration after editing `prisma/schema.prisma`
- `npm run db:seed` — re-run the seed (safe to re-run, it upserts)

## Deploying (Neon + Vercel)

1. Create a free Postgres database on [Neon](https://neon.tech) (or reuse your local one).
2. Push this repo to GitHub, then import it on [Vercel](https://vercel.com/new).
3. In the Vercel project's environment variables, set `DATABASE_URL` and `AUTH_SECRET`
   (same values as your `.env`). `SEED_ADMIN_*` are only needed when running the seed.
4. After the first deploy, run the migration + seed once against the production
   database from your machine:
   ```bash
   DATABASE_URL="<production-url>" npm run db:migrate -- --name init
   DATABASE_URL="<production-url>" SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run db:seed
   ```
   (On Windows PowerShell, set env vars with `$env:DATABASE_URL = "..."` on a line
   before the command instead of the inline `VAR=value` syntax.)

## Notes / v1 limitations

- No email notifications — approvals/rejections are visible in-app only (status badges).
- No password-reset flow yet; an admin would need to reset a member's password directly
  in the database (via Prisma Studio) if they forget it.
- Quota enforcement is "track and warn," never blocking — matches the institute's request.
