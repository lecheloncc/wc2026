# World Cup 2026 — Prediction Game

Next.js 15 + Supabase + Tailwind, styled after the `lecheloncc` cycling app.

## What users can do

- **Match predictions** — pick a score for every one of the 104 matches
- **Group-stage order** — rank 1st–4th for each of the 12 groups
- **Topscorer picks** — pick 3 players for the tournament; points per goal + Golden Boot bonus
- **Knockout bracket** — same match-prediction flow with stage multipliers (R16 ×1.5 … Final ×4)
- **Leaderboard** — overall ranking with per-category breakdown

## Scoring (balanced)

| Rule | Points |
|---|---|
| Correct outcome (W/D/L) | 3 |
| Correct goal difference | +2 |
| One team's score exact | +1 |
| Fully exact score | +5 bonus |
| Perfect pick total | **11** |
| Knockout multipliers | R16 ×1.5 · QF ×2 · SF ×3 · 3rd/Final ×4 |
| Group slot correct | 3 each |
| Full group perfect | +5 bonus |
| Goal by topscorer pick | 2 each |
| Golden Boot match | +10 bonus |

Run `npm run test:scoring` to verify the engines.

## Setup

### 1. Dependencies

```bash
cd wc2026-app
npm install
```

### 2. Supabase project

1. Create a new Supabase project at https://supabase.com/dashboard.
2. In **Project Settings → API**, copy the URL + anon key.
3. Open **SQL Editor** and run `supabase/migrations/0001_init.sql`.
4. Enable **Email/Password** auth (Auth → Providers → Email).
5. In **Auth → URL Configuration**, add your dev URL (`http://localhost:3000`) and production domain to the redirect allowlist.

### 3. Fill fixtures

1. Edit `data/fixtures-2026.json`: replace the `TBD ...` team names with the real draw results + flags.
2. Edit `scripts/generate-fixtures.ts` if you have specific kickoff times (otherwise it uses placeholders).
3. Generate the seed SQL:
   ```bash
   npx tsx scripts/generate-fixtures.ts > supabase/migrations/0002_seed.sql
   ```
4. Paste the output into the Supabase SQL editor to insert teams + matches.
5. As players are announced, insert them manually into `players` (admin work).

### 4. Environment

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
RESEND_API_KEY=re_...        # optional, for future email blasts
NEXT_PUBLIC_ADMIN_EMAIL=franken_robin@hotmail.com
```

The admin email grants access to `/admin` for entering match results and recomputing the leaderboard.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000, sign up, and verify:

- Session persists across refresh (middleware).
- You can save a prediction on any upcoming match.
- Admin (logged in as `NEXT_PUBLIC_ADMIN_EMAIL`) sees `/admin` nav item and can enter results.
- After entering a result and clicking **Recompute Leaderboard**, `/leaderboard` updates.

## Deployment (Vercel)

1. Push to GitHub.
2. Import in Vercel, set the same env vars.
3. Add the Vercel domain to Supabase's redirect allowlist.
4. Deploy. Add any custom domain before June 11, 2026.

## Layout

```
app/
  page.tsx                  dashboard
  predict/                  list + per-match entry
  groups/                   group-order picks
  topscorers/               topscorer picks
  bracket/                  knockout predictions
  leaderboard/              standings
  rules/                    scoring explainer
  admin/                    results + recompute (admin only)
  reset-password/           post-email landing
components/
  AuthGate.tsx              login/signup/reset
  SessionGate.tsx           auth boundary for pages
  Nav.tsx                   top navigation
lib/
  supabase.ts               browser client
  scoring/                  match, groups, topscorer, totals
utils/supabase/             server + middleware clients
middleware.ts               refresh auth cookies
supabase/migrations/        SQL: schema + seed
data/fixtures-2026.json     teams + schedule template
scripts/
  generate-fixtures.ts      build 0002_seed.sql
  test-scoring.ts           verify scoring engines
```

## Verification checklist

- `npm run test:scoring` → all green
- `npm run build` → no type errors
- Sign up → log in → save a prediction → log out → log back in → prediction persists
- Admin enters a test result → `/leaderboard` shows a score after Recompute

<!-- redeploy trigger -->
