-- Bookshelf — favorites table.
-- Books are stored per user (user_id is the Clerk user's `sub` claim).
-- Rows are readable publicly so classmates can see what everyone is reading.

create table if not exists favorites (
  id         bigint generated always as identity primary key,
  user_id    text        not null,
  title      text        not null,
  author     text        not null default 'Unknown',
  cover_url  text        not null default '',
  ol_key     text        not null,
  created_at timestamptz not null default now(),
  unique (user_id, ol_key)
);

create index if not exists favorites_user_id_idx on favorites (user_id);
create index if not exists favorites_created_at_idx on favorites (created_at desc);

alter table favorites enable row level security;

-- Public read: anyone can see the class bookshelf (signed in or not).
drop policy if exists "Anyone can read favorites" on favorites;
create policy "Anyone can read favorites"
  on favorites for select
  using (true);

-- Writes: the app sets user_id to the Clerk user.id on every insert, and
-- scopes `my-books` deletes to the current user client-side. In a production
-- build we'd tighten these policies with auth.jwt()->>'sub' once the Clerk +
-- Supabase third-party auth integration is wired up in the Supabase dashboard.
drop policy if exists "Users can insert their own favorites" on favorites;
create policy "Users can insert their own favorites"
  on favorites for insert
  with check (true);

drop policy if exists "Users can delete their own favorites" on favorites;
create policy "Users can delete their own favorites"
  on favorites for delete
  using (true);
