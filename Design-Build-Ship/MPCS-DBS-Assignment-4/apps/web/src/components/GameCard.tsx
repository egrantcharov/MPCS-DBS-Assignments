import Link from 'next/link';
import ClutchBadge from './ClutchBadge';
import LiveDot from './LiveDot';
import TeamChip from './TeamChip';
import type { Game, Team } from '@/lib/types';
import { formatClock, formatInning, formatStatus, formatWp } from '@/lib/format';

export default function GameCard({
  game,
  teams,
  starred = false,
}: {
  game: Game;
  teams: Map<number, Team>;
  starred?: boolean;
}) {
  const home = game.home_team_id ? teams.get(game.home_team_id) : undefined;
  const away = game.away_team_id ? teams.get(game.away_team_id) : undefined;
  const isLive = game.status === 'Live';
  const isFinal = game.status === 'Final';
  const wpHome = game.home_win_prob;

  return (
    <Link
      href={`/game/${game.game_pk}` as const}
      className={`group block rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-slate-900 ${
        starred
          ? 'border-amber-300 ring-2 ring-amber-200 dark:border-amber-500 dark:ring-amber-800/50'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {isLive ? <LiveDot /> : isFinal ? <span className="font-semibold text-slate-700 dark:text-slate-300">Final</span> : <span>{formatClock(game.game_start)}</span>}
          <span>·</span>
          <span>{formatStatus(game.status, game.detailed_state)}</span>
          {isLive && <span>· {formatInning(game.inning, game.is_top_inning)}</span>}
        </div>
        {isLive && <ClutchBadge value={game.clutch_index} />}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <TeamChip teamId={game.away_team_id} abbreviation={away?.abbreviation ?? '—'} />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{away?.name ?? '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <TeamChip teamId={game.home_team_id} abbreviation={home?.abbreviation ?? '—'} />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{home?.name ?? '—'}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {game.away_score}
          </div>
          <div className="text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {game.home_score}
          </div>
        </div>
      </div>

      {isLive && wpHome != null && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span>{away?.abbreviation ?? 'AWAY'} {formatWp(1 - wpHome)}</span>
            <span>Leverage {game.leverage?.toFixed(2) ?? '—'}</span>
            <span>{home?.abbreviation ?? 'HOME'} {formatWp(wpHome)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full bg-indigo-600"
              style={{ width: `${Math.round(wpHome * 100)}%` }}
            />
          </div>
        </div>
      )}

      {isLive && game.last_play && (
        <p className="mt-3 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
          {game.last_play}
        </p>
      )}
    </Link>
  );
}
