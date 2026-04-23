# Deploying Clutch Index

You only need four platforms:

1. Supabase — Postgres + Realtime
2. Clerk — auth
3. Railway — background worker
4. Vercel — frontend

All four have free tiers that are plenty for this project. Budget ~20 minutes end-to-end.

> Everything below uses browser-based signups. Nothing here writes to the filesystem, so it is safe to do in any order, but the order below is the fastest.

---

## 1. Supabase

1. Go to <https://supabase.com> and create a new project (any region close to you; Free tier is fine). Choose a database password and save it.
2. Once the project is up, open **SQL Editor → New query** and paste the three migrations from `supabase/migrations/` in order:
   - `0001_init.sql`
   - `0002_rls.sql`
   - `0003_realtime.sql`
   Run each.
3. Open **Settings → API** and copy:
   - `Project URL` → `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
   - `anon (public)` key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY` (worker-only, never commit)
4. (Optional) Under **Database → Replication** confirm that `games`, `plays`, `worker_health` are in the `supabase_realtime` publication. Migration `0003` already does this.

---

## 2. Clerk

1. Go to <https://dashboard.clerk.com> and create a new application. Email + password is enough.
2. From **API keys**, copy:
   - `Publishable key` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `Secret key` → `CLERK_SECRET_KEY`
3. Under **Paths → User & Authentication → Sessions**, leave defaults. Sign-in/up are hosted at `/sign-in` and `/sign-up` via the routes in `apps/web/src/app/sign-{in,up}`.

> Optional hardening: configure Clerk's **Supabase JWT template** to tighten the RLS on user tables. Not required for the assignment.

---

## 3. Railway (worker)

1. Go to <https://railway.com> and create a new project → **Deploy from GitHub repo**.
2. Select this repo. Set **Root Directory** to `Design-Build-Ship/MPCS-DBS-Assignment-4/apps/worker`. Railway will use that folder's `railway.json` → `Dockerfile`.
3. Add environment variables under **Variables**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**. You should see startup logs like `[boot] clutch-index worker starting` and `[schedule] upserted N games for YYYY-MM-DD`.

Verify in Supabase SQL editor: `select count(*) from games where game_date = current_date;` → should be > 0 on any day MLB has games.

---

## 4. Vercel (frontend)

1. Go to <https://vercel.com/new> and import the same GitHub repo.
2. **Root Directory** → `Design-Build-Ship/MPCS-DBS-Assignment-4/apps/web`.
3. Framework preset will auto-detect as Next.js. Keep defaults.
4. Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
5. Deploy.

Open the live URL. The scoreboard should render; if any game is `Live`, you should see its WP bar tick in place after 15 seconds without refreshing.

---

## Verification checklist

- [ ] `/` scoreboard shows today's games (the Railway worker is populating `games`).
- [ ] Clicking a game opens `/game/{pk}` with a populated WP chart.
- [ ] Signing up via Clerk succeeds and redirects back to the app.
- [ ] `/settings` lets you star a team; a row appears in `user_favorites` in Supabase.
- [ ] During a live game, new plays tick in without a refresh (Realtime).
- [ ] Opening the site in another browser and signing up as a second user shows only their own starred teams.

---

## Troubleshooting

- **Worker crashes immediately on Railway**: check that `SUPABASE_SERVICE_ROLE_KEY` is the service role key, not the anon key. The worker fails fast otherwise.
- **Realtime events never arrive**: confirm `0003_realtime.sql` ran. `select * from pg_publication_tables where pubname='supabase_realtime';` should list `games` and `plays`.
- **Clerk 404 or redirect loop**: `src/proxy.ts` marks `/`, `/game/*`, `/sign-in*`, `/sign-up*` as public. Any new public route you add must be appended there.
- **Scoreboard is empty**: wait for the next worker tick or check Railway logs. The worker only upserts once the schedule poll fires.
