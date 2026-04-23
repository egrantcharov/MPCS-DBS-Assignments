'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Highlight, Team } from '@/lib/types';
import SportBadge from './SportBadge';

export default function HighlightsFeed({
  initial,
  teams,
  limit = 20,
  title = 'Biggest moments right now',
  compact = false,
}: {
  initial: Highlight[];
  teams: Team[];
  limit?: number;
  title?: string;
  compact?: boolean;
}) {
  const [items, setItems] = useState<Highlight[]>(initial);

  useEffect(() => {
    const channel = supabase
      .channel('highlights-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'highlights' },
        (payload) => {
          const row = payload.new as Highlight;
          setItems((prev) => {
            const next = [row, ...prev.filter((h) => h.id !== row.id)];
            next.sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
            return next.slice(0, limit);
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  void teamMap;

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        No highlights yet today — check back once plays start swinging win probability.
      </div>
    );
  }

  return (
    <section>
      {title && (
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      )}
      <ol className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {items.map((h) => (
          <li key={h.id} className="flex items-baseline gap-3 px-4 py-3">
            <SportBadge sport={h.sport} />
            <Link
              href={`/game/${h.game_pk}` as const}
              className="flex-1 text-sm text-slate-900 hover:underline dark:text-slate-100"
            >
              <span className="font-semibold">{h.event ?? 'Play'}: </span>
              <span className="text-slate-600 dark:text-slate-400">
                {h.description ?? '—'}
              </span>
            </Link>
            {!compact && (
              <div className="flex shrink-0 items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                {h.wp_delta != null && (
                  <span className={wpBadge(Number(h.wp_delta))}>
                    {Number(h.wp_delta) >= 0 ? '+' : ''}
                    {(Number(h.wp_delta) * 100).toFixed(0)}% WP
                  </span>
                )}
                {h.captivating_index != null && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                    CI {Math.round(h.captivating_index)}
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function wpBadge(delta: number) {
  if (delta >= 0.15) return 'rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
  if (delta <= -0.15) return 'rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-800 dark:bg-rose-900/40 dark:text-rose-200';
  return 'rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200';
}
