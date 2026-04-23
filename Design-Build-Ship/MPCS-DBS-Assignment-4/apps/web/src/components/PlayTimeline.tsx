import type { Play } from '@/lib/types';
import { inningOrdinal } from '@/lib/format';

export default function PlayTimeline({
  plays,
  limit = 12,
}: {
  plays: Play[];
  limit?: number;
}) {
  const sorted = [...plays].sort((a, b) => b.at_bat_index - a.at_bat_index).slice(0, limit);
  return (
    <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
      {sorted.map((p) => (
        <li key={p.at_bat_index} className="flex gap-3 px-4 py-3">
          <div className="w-12 shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {p.is_top_inning ? 'Top' : 'Bot'} {p.inning ? inningOrdinal(p.inning) : ''}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {p.event}
              </span>
              {p.is_swing_play && (
                <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                  Swing · {(Number(p.wp_delta) * 100).toFixed(0)}%
                </span>
              )}
              {p.captivating_index != null && p.captivating_index >= 40 && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                  CI {Math.round(p.captivating_index)}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{p.description}</p>
          </div>
          <div className="w-16 shrink-0 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {p.away_score}-{p.home_score}
          </div>
        </li>
      ))}
      {sorted.length === 0 && (
        <li className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          No plays yet.
        </li>
      )}
    </ul>
  );
}
