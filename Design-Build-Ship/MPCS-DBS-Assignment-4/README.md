# Clutch Index ⚾

Live MLB dashboard that quantifies **how much each at-bat matters**. Every play ticks a win-probability chart in real time; the biggest swings get pinned to the top of your feed. Star your team and every clutch moment surfaces without a page refresh.

> MPCS 51040 · Design, Build, Ship · Assignment 4

## What it does

- Polls the MLB Stats API every 15 seconds during live games.
- Computes a home-team win probability + leverage for every at-bat.
- Streams updates over Supabase Realtime to a Next.js frontend.
- Lets signed-in users star favorite teams and tune a "clutch threshold" slider.

## Architecture

```
MLB Stats API  →  Railway worker  →  Supabase (Postgres + Realtime)  →  Vercel frontend
                                         ↑
                                      Clerk auth (per-user favorites)
```

See [CLAUDE.md](./CLAUDE.md) for the full architecture.

## Repo layout

```
apps/
  worker/   Node 20 + TypeScript poller (deployed on Railway)
  web/      Next.js 16 + Tailwind v4 + Clerk (deployed on Vercel)
supabase/
  migrations/   Idempotent SQL: tables, RLS, realtime publication
```

## Running locally

```bash
# 1. install
npm install

# 2. fill in env
cp .env.local.example .env.local       # root values consumed by worker
cp .env.local.example apps/web/.env.local

# 3. apply migrations (Supabase CLI, or paste into SQL editor)
supabase db push

# 4. worker + web in two shells
npm run dev:worker
npm run dev:web
```

## Deployment

- Worker → Railway (connect GitHub, set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`).
- Web → Vercel (connect GitHub, set `NEXT_PUBLIC_SUPABASE_*` + `CLERK_*`, root = `apps/web`).
- Database + realtime → Supabase.

Full step-by-step in [DEPLOY.md](./DEPLOY.md).

## Win-probability model

This project uses an **approximate** home-team win probability based on:
- score differential (logistic)
- inning + half-inning weight
- outs and base state (24-state run-expectancy table)

It is not FanGraphs WPA. The goal is to rank and surface *clutch* live plays in real time, not to compete with professional WPA tools. The `captivating_index` column is MLB's own play-interest metric passed through from the Stats API.

## Credits

- Data: [MLB Stats API](https://statsapi.mlb.com)
- Classroom foundation: MPCS Design, Build, Ship (Week 4 lesson).
