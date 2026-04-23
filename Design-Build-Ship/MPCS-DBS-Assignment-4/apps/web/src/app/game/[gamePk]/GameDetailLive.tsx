'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Game, Play, Team } from '@/lib/types';
import TeamChip from '@/components/TeamChip';
import ClutchBadge from '@/components/ClutchBadge';
import LiveDot from '@/components/LiveDot';
import WinProbChart from '@/components/WinProbChart';
import PlayTimeline from '@/components/PlayTimeline';
import { formatInning, formatStatus, formatWp } from '@/lib/format';

export default function GameDetailLive({
  initialGame,
  initialPlays,
  teams,
}: {
  initialGame: Game;
  initialPlays: Play[];
  teams: Team[];
}) {
  const [game, setGame] = useState<Game>(initialGame);
  const [plays, setPlays] = useState<Play[]>(initialPlays);

  useEffect(() => {
    const channel = supabase
      .channel(`game-${initialGame.game_pk}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `game_pk=eq.${initialGame.game_pk}`,
        },
        (payload) => {
          if (payload.new) setGame(payload.new as Game);
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plays',
          filter: `game_pk=eq.${initialGame.game_pk}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as Play | null;
          if (!row) return;
          setPlays((prev) => {
            const idx = prev.findIndex((p) => p.at_bat_index === row.at_bat_index);
            if (idx === -1) return [...prev, row].sort((a, b) => a.at_bat_index - b.at_bat_index);
            const copy = prev.slice();
            copy[idx] = row;
            return copy;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialGame.game_pk]);

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const home = game.home_team_id ? teamMap.get(game.home_team_id) : undefined;
  const away = game.away_team_id ? teamMap.get(game.away_team_id) : undefined;
  const swingPlays = useMemo(() => plays.filter((p) => p.is_swing_play), [plays]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        ← All games
      </Link>

      <header className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            {game.status === 'Live' ? <LiveDot /> : <span className="font-semibold">{formatStatus(game.status, game.detailed_state)}</span>}
            {game.status === 'Live' && <span>· {formatInning(game.inning, game.is_top_inning)}</span>}
          </div>
          {game.status === 'Live' && <ClutchBadge value={game.clutch_index} />}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <TeamBlock
            teamId={game.away_team_id}
            abbreviation={away?.abbreviation ?? '—'}
            name={away?.name ?? 'Away'}
            score={game.away_score}
            wp={game.home_win_prob == null ? null : 1 - game.home_win_prob}
          />
          <TeamBlock
            teamId={game.home_team_id}
            abbreviation={home?.abbreviation ?? '—'}
            name={home?.name ?? 'Home'}
            score={game.home_score}
            wp={game.home_win_prob}
          />
        </div>

        {game.status === 'Live' && (
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <Stat label="Batter" value={game.current_batter ?? '—'} />
            <Stat label="Pitcher" value={game.current_pitcher ?? '—'} />
            <Stat label="Outs" value={game.outs?.toString() ?? '—'} />
            <Stat
              label="On base"
              value={[
                game.on_first && '1st',
                game.on_second && '2nd',
                game.on_third && '3rd',
              ]
                .filter(Boolean)
                .join(' · ') || 'None'}
            />
            <Stat label="Leverage" value={game.leverage?.toFixed(2) ?? '—'} />
            <Stat
              label="Home WP"
              value={formatWp(game.home_win_prob)}
            />
            <Stat label="Swing plays" value={swingPlays.length.toString()} />
            <Stat label="Plays logged" value={plays.length.toString()} />
          </dl>
        )}

        {game.last_play && (
          <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <span className="font-semibold">Last play: </span>
            {game.last_play}
          </p>
        )}
      </header>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Win probability — {home?.abbreviation ?? 'HOME'}
        </h2>
        <WinProbChart
          plays={plays}
          homeAbbr={home?.abbreviation ?? 'HOME'}
          awayAbbr={away?.abbreviation ?? 'AWAY'}
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Play timeline
        </h2>
        <PlayTimeline plays={plays} limit={20} />
      </section>
    </div>
  );
}

function TeamBlock({
  teamId,
  abbreviation,
  name,
  score,
  wp,
}: {
  teamId: number | null;
  abbreviation: string;
  name: string;
  score: number;
  wp: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <TeamChip teamId={teamId} abbreviation={abbreviation} size="lg" />
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{name}</div>
          {wp != null && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Win prob {formatWp(wp)}
            </div>
          )}
        </div>
      </div>
      <div className="text-4xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
        {score}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100">
        {value}
      </dd>
    </div>
  );
}
