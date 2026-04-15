# Bookshelf

A class bookshelf. Sign in, search Open Library for a book, save it, and see what everyone else in the class is reading on the home page.

Built for MPCS 51039 Design, Build, Ship, Assignment 3.

## Links

- **Live app**: _add Vercel URL once deployed_
- **Repo**: https://github.com/egrantcharov/MPCS-DBS-Assignments (this folder: `Design-Build-Ship/MPCS-DBS-Assignment-3/bookshelf`)

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind v4
- Clerk for auth (sign up, sign in, sign out)
- Supabase Postgres for storing favorites, with Row Level Security on
- Open Library search API for book data (called from a Next.js API route, not the browser)
- Vercel for hosting

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in Clerk + Supabase keys
npm run dev                         # http://localhost:3000
```

Then paste `supabase/migrations/001_create_favorites.sql` into the Supabase SQL editor to create the `favorites` table.

## Reflection

### 1. Trace a request: a user searches, saves, and views it on their profile. What systems are involved?

User is signed into Clerk, so there's already a Clerk session cookie on the browser.

1. User types "dune" on `/search` and hits submit. The browser calls `/api/search?q=dune` on my Next.js app. That API route runs on Vercel's server, calls `openlibrary.org/search.json`, and returns the results.
2. User clicks "Add to Favorites" on a result. The page calls `getToken()` to get a Clerk session JWT, builds a Supabase client with that token in the Authorization header, and sends a POST to Supabase's REST endpoint (`/rest/v1/favorites`). Supabase checks the token, checks the RLS policy, and writes the row into Postgres.
3. User navigates to `/my-books`. Same thing in reverse: Clerk token to Supabase, SELECT filtered by `user_id` that matches the Clerk `sub`, RLS allows the read, rows come back and render.

So the systems are: the browser, Clerk (auth), my Next.js app on Vercel (server route for the external API call), Open Library (third-party API), and Supabase (Postgres + PostgREST + RLS).

### 2. Why should your app call the external API from the server (API route) instead of directly from the browser?

A few reasons:

- If the API ever needed a key, the key would leak if I called it from the browser. Doing it server-side keeps secrets on the server. Open Library does not need a key right now, but this keeps the pattern correct for the next API I add.
- CORS. Not every API sets permissive CORS headers. A server route avoids the whole problem since it is just a server-to-server fetch.
- Caching and rate limiting. My API route uses Next's `revalidate: 300` so repeat queries within 5 minutes do not re-hit Open Library. I could not do that cleanly from the browser.
- Shape control. I only return the fields the UI needs (`key`, `title`, `author_name`, `cover_i`, `first_publish_year`) instead of shipping the whole Open Library response to the client.
- One place to change. If I swap Open Library for Google Books later, only the server route changes. The page code stays the same.

### 3. A classmate signs up on your app. What data does Clerk store vs. what does Supabase store? How are they connected?

Clerk stores the identity stuff: the user's email, password hash, any OAuth linked accounts, the session tokens, sign-in history, and metadata like first and last name. I never see the password and I do not keep a users table.

Supabase stores the app data: the `favorites` rows. Each row has the book info (`title`, `author`, `cover_url`, `ol_key`), a `created_at`, and a `user_id`.

The connection is that `user_id` column. It holds the Clerk user's `sub` claim (something like `user_2abc...`). When a user saves a book, the app reads the Clerk userId on the client and writes it into the row. When the app needs "my books", it filters `favorites` where `user_id = currentClerkUserId`. The Clerk session JWT is also passed to Supabase so RLS can verify the user on writes.

### 4. Ask Claude (with MCP) to describe your database. Paste the response. Does it match your mental model?

I do not have the Supabase MCP wired up locally, so I asked Claude to describe the schema from the migration file. Response:

> You have one table, `favorites`, in the `public` schema. Columns:
> - `id` (bigint, identity, primary key)
> - `user_id` (text, not null): stores the Clerk user's `sub` claim
> - `title` (text, not null)
> - `author` (text, not null, defaults to "Unknown")
> - `cover_url` (text, not null, defaults to empty string)
> - `ol_key` (text, not null): the Open Library work key
> - `created_at` (timestamptz, defaults to `now()`)
>
> There is a unique constraint on `(user_id, ol_key)` so a user cannot save the same book twice. Indexes exist on `user_id` and on `created_at DESC`.
>
> Row Level Security is enabled with three policies: public SELECT (anyone can read all favorites), and permissive INSERT and DELETE (would be tightened to `auth.jwt() ->> 'sub' = user_id` once Clerk's third-party auth is set up on the Supabase side).

That matches what I expected. One table, per-user rows, Clerk id as the join key, denormalized book fields so the home page is a single query. The only thing worth noting is that the RLS on writes is still permissive for the assignment, and I would tighten it once the Clerk and Supabase third-party auth integration is configured in the Supabase dashboard.
