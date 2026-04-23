# Clutch Index — Architecture

Live MLB **win-probability + leverage** dashboard. A background worker polls the MLB Stats API every 15 seconds during live games, writes state and play-by-play into Supabase, and a Next.js frontend subscribes to Supabase Realtime so users see win probability, leverage, and "clutch" moments as they happen — without refreshing the page.

## Stack

- **Monorepo**: npm workspaces (`apps/web`, `apps/worker`).
- **Worker**: Node 20 + TypeScript. Deployed on Railway.
- **Database**: Supabase Postgres with Realtime enabled on `games` + `plays`.
- **Frontend**: Next.js 16 (App Router, Turbopack) + Tailwind v4. Deployed on Vercel.
- **Auth**: Clerk (`@clerk/nextjs`) with per-user favorites + thresholds stored in Supabase.
- **Data source**: [MLB Stats API](https://statsapi.mlb.com) — free, official, no key required.

## Data flow

```
MLB Stats API
     │  poll /schedule every 5 min, /feed/live every 15 s
     ▼
apps/worker  ──(service-role upsert)──►  Supabase Postgres
                                              │
                                              │ Realtime publication
                                              ▼
                                         apps/web (Next.js)
                                              │
                                              └─ Clerk JWT ⟶ personalized reads
```

## Tables

| Table | Written by | Read by | Realtime |
|---|---|---|---|
| `teams` | worker (seed) | web | no |
| `games` | worker (every tick) | web | yes |
| `plays` | worker (append per at-bat) | web | yes |
| `user_favorites` | web (signed-in user) | web | no |
| `user_prefs` | web (signed-in user) | web | no |
| `worker_health` | worker | web | no |

See `supabase/migrations/` for the source of truth.

## Worker

Entry point: `apps/worker/src/index.ts`.

- Seeds `teams` once from `/api/v1/teams?sportId=1`.
- Every 5 minutes: `refreshSchedule()` upserts today's games from `/api/v1/schedule`.
- Every 15 seconds: `refreshLiveGames()` iterates games whose status is `Live`, fetches `/api/v1.1/game/{pk}/feed/live`, upserts the game row, and appends new plays on `(game_pk, at_bat_index)` primary key.
- Computes a home-team win probability per play (`src/wp.ts`) using score differential, inning weight, outs, and base state. Leverage and `is_swing_play` are derived. `clutch_index` is MLB's own `captivatingIndex` passed through.
- Health heartbeat to `worker_health` after every successful schedule poll.

## Frontend

- `/` — public scoreboard (live games + today's schedule).
- `/dashboard` — signed-in view with three strips: **My Teams Live**, **League-Wide Clutch**, **All Games Today**.
- `/game/[gamePk]` — single-game deep view with WP chart over plays, swing-play timeline, current matchup.
- `/settings` — star favorite teams, set clutch threshold, toggle "only show my teams."

Realtime subscriptions:
- Scoreboard listens to `games` `UPDATE` events.
- Game detail page listens to `plays` `INSERT` events and re-renders the WP chart.

## Conventions (mirrors Assignment 3)

- TypeScript strict everywhere; no `any`.
- Server Components by default; `'use client'` only for hooks/events.
- Tailwind utility classes only; indigo-600 accent.
- Migrations are idempotent (`create table if not exists`, `drop policy if exists`).
- `.env.local` is gitignored; `.env.local.example` is kept in sync.
- RLS-lite: writes that Supabase can't cryptographically verify (Clerk JWT) rely on the app setting `user_id` correctly, matching the A3 pattern after commit `9912269`.

## Notes on the win-probability model

The WP here is a transparent approximation, not MLB-official win expectancy. It combines:
1. A logistic over score differential.
2. An inning-weight term that amplifies late-inning impact.
3. A base-out state adjustment from a hard-coded 24-state run-expectancy table (Tango/FanGraphs).

Good enough to surface leverage and swing plays in real time; not a replacement for FanGraphs WPA.
