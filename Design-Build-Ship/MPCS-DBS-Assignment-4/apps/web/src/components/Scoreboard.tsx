'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Game, Sport, Team } from '@/lib/types';
import GameCard from './GameCard';

type LeagueFilter = 'all' | Sport;

export default function Scoreboard({
  initialGames,
  teams,
  starredTeamIds = [],
  clutchThreshold = 40,
  showOnlyFavs = false,
}: {
  initialGames: Game[];
  teams: Team[];
  starredTeamIds?: number[];
  clutchThreshold?: number;
  showOnlyFavs?: boolean;
}) {
  const [games, setGames] = useState<Game[]>(initialGames);
  const [league, setLeague] = useState<LeagueFilter>('all');

  useEffect(() => {
    const channel = supabase
      .channel('games-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games' },
        (payload) => {
          const row = (payload.new ?? payload.old) as Game | null;
          if (!row) return;
          setGames((prev) => {
            if (payload.eventType === 'DELETE') {
              return prev.filter((g) => g.game_pk !== row.game_pk);
            }
            const idx = prev.findIndex((g) => g.game_pk === row.game_pk);
            if (idx === -1) return [...prev, row].sort(gameSort);
            const copy = prev.slice();
            copy[idx] = row;
            return copy.sort(gameSort);
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const starred = useMemo(() => new Set(starredTeamIds), [starredTeamIds]);

  const isStarred = (g: Game) =>
    (g.home_team_id != null && starred.has(g.home_team_id)) ||
    (g.away_team_id != null && starred.has(g.away_team_id));

  const filtered = useMemo(
    () => (league === 'all' ? games : games.filter((g) => g.sport === league)),
    [games, league],
  );

  const { liveGames, upcoming, finals } = useMemo(() => {
    const live: Game[] = [];
    const upc: Game[] = [];
    const done: Game[] = [];
    for (const g of filtered) {
      if (g.status === 'Live') live.push(g);
      else if (g.status === 'Final') done.push(g);
      else upc.push(g);
    }
    return { liveGames: live, upcoming: upc, finals: done };
  }, [filtered]);

  const displayLive = showOnlyFavs ? liveGames.filter(isStarred) : liveGames;
  const clutchFloor = Number(clutchThreshold) || 0;
  const hotGames = liveGames
    .filter((g) => g.sport === 'mlb' && !isStarred(g) && (g.clutch_index ?? 0) >= clutchFloor && clutchFloor > 0)
    .sort((a, b) => (b.clutch_index ?? 0) - (a.clutch_index ?? 0));

  const counts = {
    all: games.length,
    mlb: games.filter((g) => g.sport === 'mlb').length,
    nhl: games.filter((g) => g.sport === 'nhl').length,
  };

  return (
    <div className="space-y-8">
      <LeagueTabs value={league} onChange={setLeague} counts={counts} />

      {hotGames.length > 0 && (
        <Section
          title={`Hot right now · CI ≥ ${Math.round(clutchFloor)}`}
          count={hotGames.length}
        >
          <Grid>
            {hotGames.map((g) => (
              <GameCard key={`hot-${g.game_pk}`} game={g} teams={teamMap} starred />
            ))}
          </Grid>
        </Section>
      )}

      {displayLive.length > 0 && (
        <Section title="Live now" count={displayLive.length}>
          <Grid>
            {displayLive.map((g) => (
              <GameCard key={g.game_pk} game={g} teams={teamMap} starred={isStarred(g)} />
            ))}
          </Grid>
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section title="Upcoming today" count={upcoming.length}>
          <Grid>
            {upcoming.map((g) => (
              <GameCard key={g.game_pk} game={g} teams={teamMap} starred={isStarred(g)} />
            ))}
          </Grid>
        </Section>
      )}

      {finals.length > 0 && (
        <Section title="Final" count={finals.length}>
          <Grid>
            {finals.map((g) => (
              <GameCard key={g.game_pk} game={g} teams={teamMap} starred={isStarred(g)} />
            ))}
          </Grid>
        </Section>
      )}

      {filtered.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-lg text-slate-500 dark:text-slate-400">
            No games in this view. The worker publishes as soon as schedules are out.
          </p>
        </div>
      )}
    </div>
  );
}

function LeagueTabs({
  value,
  onChange,
  counts,
}: {
  value: LeagueFilter;
  onChange: (v: LeagueFilter) => void;
  counts: { all: number; mlb: number; nhl: number };
}) {
  const tabs: Array<{ id: LeagueFilter; label: string; count: number }> = [
    { id: 'all', label: 'All sports', count: counts.all },
    { id: 'mlb', label: 'MLB', count: counts.mlb },
    { id: 'nhl', label: 'NHL', count: counts.nhl },
  ];
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600'
            }`}
          >
            {t.label}
            <span className={`ml-2 text-xs ${active ? 'opacity-90' : 'text-slate-500 dark:text-slate-400'}`}>
              {t.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function gameSort(a: Game, b: Game) {
  const statusWeight = (s: string) => (s === 'Live' ? 0 : s === 'Preview' ? 1 : 2);
  const sa = statusWeight(a.status);
  const sb = statusWeight(b.status);
  if (sa !== sb) return sa - sb;
  const ca = a.clutch_index ?? 0;
  const cb = b.clutch_index ?? 0;
  if (sa === 0 && cb !== ca) return cb - ca;
  return (a.game_start ?? '').localeCompare(b.game_start ?? '');
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">{count}</span>
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
