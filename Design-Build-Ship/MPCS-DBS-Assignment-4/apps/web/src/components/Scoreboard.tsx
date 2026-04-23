'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Game, Team } from '@/lib/types';
import GameCard from './GameCard';

export default function Scoreboard({
  initialGames,
  teams,
  starredTeamIds = [],
  clutchThreshold = 0,
  showOnlyFavs = false,
}: {
  initialGames: Game[];
  teams: Team[];
  starredTeamIds?: number[];
  clutchThreshold?: number;
  showOnlyFavs?: boolean;
}) {
  const [games, setGames] = useState<Game[]>(initialGames);

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
            const idx = prev.findIndex((g) => g.game_pk === row.game_pk);
            if (payload.eventType === 'DELETE') {
              return prev.filter((g) => g.game_pk !== row.game_pk);
            }
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

  const { liveGames, upcoming, finals } = useMemo(() => {
    const live: Game[] = [];
    const upc: Game[] = [];
    const done: Game[] = [];
    for (const g of games) {
      if (g.status === 'Live') live.push(g);
      else if (g.status === 'Final') done.push(g);
      else upc.push(g);
    }
    return { liveGames: live, upcoming: upc, finals: done };
  }, [games]);

  const isStarred = (g: Game) =>
    (g.home_team_id != null && starred.has(g.home_team_id)) ||
    (g.away_team_id != null && starred.has(g.away_team_id));

  const displayLive = showOnlyFavs
    ? liveGames.filter(isStarred)
    : liveGames.filter((g) =>
        isStarred(g) ||
        (g.clutch_index ?? 0) >= clutchThreshold,
      );

  return (
    <div className="space-y-10">
      {displayLive.length > 0 && (
        <Section title="Live now" count={displayLive.length}>
          <Grid>
            {displayLive.map((g) => (
              <GameCard
                key={g.game_pk}
                game={g}
                teams={teamMap}
                starred={isStarred(g)}
              />
            ))}
          </Grid>
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section title="Upcoming today" count={upcoming.length}>
          <Grid>
            {upcoming.map((g) => (
              <GameCard
                key={g.game_pk}
                game={g}
                teams={teamMap}
                starred={isStarred(g)}
              />
            ))}
          </Grid>
        </Section>
      )}

      {finals.length > 0 && (
        <Section title="Final" count={finals.length}>
          <Grid>
            {finals.map((g) => (
              <GameCard
                key={g.game_pk}
                game={g}
                teams={teamMap}
                starred={isStarred(g)}
              />
            ))}
          </Grid>
        </Section>
      )}

      {games.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-lg text-slate-500 dark:text-slate-400">
            No games yet today. Check back once the worker has polled the schedule.
          </p>
        </div>
      )}
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

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">{count}</span>
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
