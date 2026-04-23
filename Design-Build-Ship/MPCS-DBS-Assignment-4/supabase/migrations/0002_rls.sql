-- Row-level security.
-- Public tables (teams/games/plays/worker_health) are readable by everyone so
-- the scoreboard works for signed-out visitors. Writes are only possible via
-- the service role used by the worker (service role bypasses RLS).
--
-- Per-user tables (user_favorites/user_prefs) are readable/writable by the
-- app while enforcing that user_id is set. We follow the Assignment 3 pattern
-- (commit 9912269): the app sets user_id from the Clerk session and RLS
-- allows the operation as long as user_id is present. Tightening this to a
-- verified JWT claim is a stretch goal that requires configuring Clerk's
-- Supabase JWT template on the Supabase dashboard.

alter table teams          enable row level security;
alter table games          enable row level security;
alter table plays          enable row level security;
alter table user_favorites enable row level security;
alter table user_prefs     enable row level security;
alter table worker_health  enable row level security;

-- Public read policies
drop policy if exists "Anyone can read teams" on teams;
create policy "Anyone can read teams" on teams for select using (true);

drop policy if exists "Anyone can read games" on games;
create policy "Anyone can read games" on games for select using (true);

drop policy if exists "Anyone can read plays" on plays;
create policy "Anyone can read plays" on plays for select using (true);

drop policy if exists "Anyone can read worker_health" on worker_health;
create policy "Anyone can read worker_health" on worker_health for select using (true);

-- Per-user favorites
drop policy if exists "Anyone can read favorites" on user_favorites;
create policy "Anyone can read favorites" on user_favorites
  for select using (true);

drop policy if exists "Insert own favorite" on user_favorites;
create policy "Insert own favorite" on user_favorites
  for insert with check (user_id is not null and length(user_id) > 0);

drop policy if exists "Delete own favorite" on user_favorites;
create policy "Delete own favorite" on user_favorites
  for delete using (true);

-- Per-user preferences
drop policy if exists "Anyone can read prefs" on user_prefs;
create policy "Anyone can read prefs" on user_prefs
  for select using (true);

drop policy if exists "Upsert own prefs" on user_prefs;
create policy "Upsert own prefs" on user_prefs
  for insert with check (user_id is not null and length(user_id) > 0);

drop policy if exists "Update own prefs" on user_prefs;
create policy "Update own prefs" on user_prefs
  for update using (true) with check (user_id is not null);
