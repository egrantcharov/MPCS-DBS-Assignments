# Bookshelf

A tiny class-shared bookshelf. Sign in, search [Open Library](https://openlibrary.org/dev/docs/api/search) for a book, save it to your favorites, and see what the rest of the class is reading on the home page.

Built for MPCS 51039 *Design, Build, Ship* — Assignment 3.

## Live

- **App**: _add Vercel URL after first deploy_
- **Repo**: https://github.com/egrantcharov/MPCS-DBS-Assignments

## Stack

| Layer    | Tech                                                   |
| -------- | ------------------------------------------------------ |
| Frontend | Next.js 16 (App Router), React 19, Tailwind v4         |
| Auth     | Clerk (`@clerk/nextjs`) — sign-up, sign-in, sign-out   |
| Database | Supabase Postgres + Row Level Security                 |
| API      | Open Library Search (`openlibrary.org/search.json`)    |
| Host     | Vercel                                                 |

## Local setup

```bash
npm install
cp .env.local.example .env.local   # then fill in Clerk + Supabase keys
npm run dev                         # http://localhost:3000
```

Apply the database schema by pasting `supabase/migrations/001_create_favorites.sql` into the Supabase SQL editor (or run it through the Supabase MCP).

## Reflection

> **Trace one request — e.g. signing up, calling the external API, saving to the database, and reloading the browser. What systems are involved?**

Hitting "Sign up" on the navbar opens Clerk's modal; Clerk handles the whole account creation flow against their API and sets a session cookie on `bookshelf.vercel.app`. After sign-in, typing a query on `/search` fires a `fetch` from the browser directly to `openlibrary.org/search.json` — no server of ours is involved, it's a public JSON API. When the user clicks "Add to favorites" we ask Clerk for a short-lived session token (`await getToken()`), build a Supabase client with that token in the `Authorization` header, and POST to Supabase's REST endpoint (`/rest/v1/favorites`). Supabase's PostgREST service validates the token (if the Clerk third-party auth integration is configured) and, if the RLS policy allows it, runs the `INSERT` against Postgres. On reload, `/` makes a plain anonymous `SELECT * from favorites` — the "public read" RLS policy lets that through. End-to-end: **browser → Clerk → browser → Open Library → browser → Supabase/Postgres → browser**.

> **Why do we include the publishable Clerk key as an env variable, but not the API key?**

Anything prefixed with `NEXT_PUBLIC_` gets baked into the JavaScript bundle that ships to every visitor's browser. Clerk's *publishable* key is explicitly designed for that — it identifies your Clerk instance so the front-end SDK can start a sign-in flow, but it can't do anything sensitive on its own. The *secret* key (`CLERK_SECRET_KEY`) can mint sessions, read any user's data, and impersonate backend calls, so it has to stay on the server where the browser never sees it. Same pattern with Supabase's publishable key vs. the service-role key. Rule of thumb: if leaking it on a sticky note would ruin your week, it doesn't belong in `NEXT_PUBLIC_*`.

> **A classmate is building something that could use Supabase as a key-value store. What would you recommend?**

Totally doable and a pretty good fit. Recommend a small two-column table: `key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW()`. JSONB is the unlock — Postgres can index into it (`->`, `->>`, `@>`), so you get querying when you need it without paying for it when you don't. Turn RLS on from day one and scope it to `auth.jwt() ->> 'sub'` so each user only touches their own keys. For hot-read workloads, use an `UPSERT` (`insert ... on conflict (key) do update`) rather than read-then-write, and if the values get big, stash them in Supabase Storage and keep the key/URL in the row. If they're only ever reading/writing by key and don't care about queries, they'd get a simpler life with Upstash Redis — but the moment they want "give me all keys where value.status = 'done'", Supabase wins.

> **Asked Claude to model a database for this project — why I went with what I went with.**

The shape is intentionally tiny: a single `favorites` table. Every row is one user saving one book: `(user_id, title, author, cover_url, ol_key, created_at)`, with `(user_id, ol_key)` unique so you can't double-save the same book. I didn't split `books` into its own table because Open Library *is* my canonical book database — storing the `ol_key` is enough to re-fetch anything richer later, and denormalizing `title`/`author`/`cover_url` keeps the public home page one query instead of a join. I didn't add a `users` table either, since Clerk owns identity; `user_id` is just the Clerk `sub` claim as `TEXT`. RLS is on: public read (it's a shared bookshelf, that's the point), and per-user write scoped by the Clerk JWT.

## Database schema

```sql
create table favorites (
  id         bigint generated always as identity primary key,
  user_id    text        not null,
  title      text        not null,
  author     text        not null default 'Unknown',
  cover_url  text        not null default '',
  ol_key     text        not null,
  created_at timestamptz not null default now(),
  unique (user_id, ol_key)
);
```

Full migration including RLS policies: [`supabase/migrations/001_create_favorites.sql`](supabase/migrations/001_create_favorites.sql).
