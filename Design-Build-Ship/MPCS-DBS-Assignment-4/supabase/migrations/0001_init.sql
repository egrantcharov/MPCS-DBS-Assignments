-- Clutch Index — core schema.
-- Tables are seeded and updated by the worker via the Supabase service role.
-- RLS is added separately in 0002_rls.sql; realtime publication in 0003_realtime.sql.

create table if not exists teams (
  id           int primary key,
  abbreviation text not null,
  name         text not null,
  location     text,
  league       text,
  division     text
);

create table if not exists games (
  game_pk         bigint primary key,
  game_date       date not null,
  status          text not null,
  detailed_state  text,
  home_team_id    int references teams(id),
  away_team_id    int references teams(id),
  home_score      int not null default 0,
  away_score      int not null default 0,
  inning          int,
  is_top_inning   boolean,
  outs            int,
  on_first        boolean not null default false,
  on_second       boolean not null default false,
  on_third        boolean not null default false,
  current_batter  text,
  current_pitcher text,
  last_play       text,
  home_win_prob   numeric(5,4),
  leverage        numeric(6,3),
  clutch_index    numeric(5,2),
  game_start      timestamptz,
  updated_at      timestamptz not null default now()
);

create index if not exists games_date_status_idx on games (game_date, status);
create index if not exists games_clutch_idx on games (clutch_index desc);

create table if not exists plays (
  game_pk           bigint not null references games(game_pk) on delete cascade,
  at_bat_index      int not null,
  inning            int,
  is_top_inning     boolean,
  event             text,
  description       text,
  home_score        int,
  away_score        int,
  captivating_index int,
  home_win_prob     numeric(5,4),
  wp_delta          numeric(6,4),
  is_swing_play     boolean not null default false,
  played_at         timestamptz,
  primary key (game_pk, at_bat_index)
);

create index if not exists plays_game_pk_idx on plays (game_pk, at_bat_index);
create index if not exists plays_swing_idx on plays (game_pk) where is_swing_play;

create table if not exists user_favorites (
  user_id    text not null,
  team_id    int not null references teams(id),
  created_at timestamptz not null default now(),
  primary key (user_id, team_id)
);

create index if not exists user_favorites_user_idx on user_favorites (user_id);

create table if not exists user_prefs (
  user_id           text primary key,
  show_only_favs    boolean not null default false,
  clutch_threshold  numeric(5,2) not null default 40,
  updated_at        timestamptz not null default now()
);

create table if not exists worker_health (
  id            int primary key default 1,
  last_poll_at  timestamptz,
  last_error    text,
  error_count   int not null default 0,
  constraint single_row check (id = 1)
);

insert into worker_health (id) values (1) on conflict (id) do nothing;
