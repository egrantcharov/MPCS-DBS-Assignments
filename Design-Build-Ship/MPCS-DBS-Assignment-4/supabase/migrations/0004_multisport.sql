-- Multi-sport support: add sport discriminator, logo URL, and
-- sport-agnostic period/clock fields. Safe to re-run.

alter table teams
  add column if not exists sport text not null default 'mlb',
  add column if not exists logo_url text;

alter table games
  add column if not exists sport text not null default 'mlb',
  add column if not exists period_label text,
  add column if not exists clock text;

alter table plays
  add column if not exists sport text not null default 'mlb';

create index if not exists games_sport_date_idx on games (sport, game_date);
create index if not exists teams_sport_idx on teams (sport);
create index if not exists plays_sport_idx on plays (sport, played_at desc);

-- New table: rolled-up highlight feed of recent big moments across every
-- sport. Worker appends rows; frontend subscribes for a live ticker.
create table if not exists highlights (
  id             bigint generated always as identity primary key,
  sport          text not null,
  game_pk        bigint not null,
  at_bat_index   int,
  event          text,
  description    text,
  captivating_index int,
  home_win_prob  numeric(5,4),
  wp_delta       numeric(6,4),
  occurred_at    timestamptz not null default now()
);

create index if not exists highlights_occurred_idx on highlights (occurred_at desc);
create index if not exists highlights_sport_game_idx on highlights (sport, game_pk, at_bat_index);

alter table highlights enable row level security;
drop policy if exists "Anyone can read highlights" on highlights;
create policy "Anyone can read highlights" on highlights for select using (true);

-- publish highlights too, so the ticker is realtime
do $$ begin
  perform 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='highlights';
  if not found then
    execute 'alter publication supabase_realtime add table highlights';
  end if;
end $$;
