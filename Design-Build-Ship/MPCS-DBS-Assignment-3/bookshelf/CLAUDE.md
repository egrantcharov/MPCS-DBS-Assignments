# Bookshelf

A class-shared bookshelf: classmates sign in, search Open Library for books,
save favorites, and see what everyone else is reading on the home page.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Auth**: Clerk (`@clerk/nextjs`) — sign-up, sign-in, sign-out, session tokens
- **Database**: Supabase Postgres (`@supabase/supabase-js`) with RLS enabled
- **External API**: [Open Library Search API](https://openlibrary.org/dev/docs/api/search) (no key required)
- **Styling**: Tailwind v4 (utility classes only, no custom component library)
- **Hosting**: Vercel

## Layout

- `src/app/page.tsx` — public home page; reads `favorites` from Supabase
- `src/app/search/page.tsx` — client-side search against Open Library; "Add to favorites" writes to Supabase as the signed-in user
- `src/app/my-books/page.tsx` — signed-in user's saved books, with remove
- `src/app/sign-in/[[...sign-in]]`, `src/app/sign-up/[[...sign-up]]` — Clerk hosted pages
- `src/components/Navbar.tsx` — sticky top nav with Clerk `UserButton`
- `src/lib/supabase.ts` — Supabase client factory (passes Clerk JWT to Supabase)
- `src/proxy.ts` — Clerk middleware (replaces `middleware.ts` in Next.js 16)
- `supabase/migrations/001_create_favorites.sql` — schema + RLS

## Style preferences

- TypeScript strict; no `any`
- Server Components by default; `'use client'` only when needed (hooks, events)
- Tailwind utility classes, indigo-600 accent, slate-ish neutrals, lots of whitespace
- No comments that restate the code; keep business-logic comments only
- Loading states use a spinning border; no skeleton libraries
- Images go through `next/image` with remotePatterns for `covers.openlibrary.org`
- Env vars: `NEXT_PUBLIC_*` for anything the browser needs; secrets stay server-only

## Conventions

- Never commit `.env.local`; keep `.env.local.example` in sync with required keys
- Build before pushing: `npm run build && npm run lint`
- Migrations live under `supabase/migrations/` and are idempotent (uses `create ... if not exists`, `drop policy if exists`)
