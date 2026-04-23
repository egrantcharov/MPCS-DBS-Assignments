'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { WorkerHealth } from '@/lib/types';

export default function StatusClient({
  initialHealth,
  byLeague,
  totalPlays,
  totalHighlights,
  totalTeams,
}: {
  initialHealth: WorkerHealth | null;
  byLeague: Record<string, { total: number; live: number; final: number }>;
  totalPlays: number;
  totalHighlights: number;
  totalTeams: number;
}) {
  const [health, setHealth] = useState<WorkerHealth | null>(initialHealth);
  const [now, setNow] = useState<number>(() => 0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const channel = supabase
      .channel('worker-health-page')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'worker_health', filter: 'id=eq.1' },
        (payload) => {
          if (payload.new) setHealth(payload.new as WorkerHealth);
        },
      )
      .subscribe();
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(tick);
    };
  }, []);

  const last = health?.last_poll_at ? new Date(health.last_poll_at).getTime() : null;
  const age = last != null ? now - last : null;
  const online = age != null && age < 90_000 && (health?.error_count ?? 0) < 3;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">System status</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Live view of the Railway worker and the data it has pushed to Supabase.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${online ? 'bg-emerald-500 live-dot' : age != null && age < 5 * 60_000 ? 'bg-amber-500' : 'bg-rose-500'}`}
          />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {online ? 'Worker is online' : age != null && age < 5 * 60_000 ? 'Worker is delayed' : 'Worker offline'}
          </h2>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Stat label="Last poll" value={formatAge(age)} />
          <Stat label="Errors" value={health?.error_count?.toString() ?? '0'} />
          <Stat label="Teams" value={totalTeams.toString()} />
          <Stat label="Plays logged" value={totalPlays.toLocaleString()} />
          <Stat label="Highlights" value={totalHighlights.toString()} />
          <Stat label="Leagues" value={Object.keys(byLeague).length.toString()} />
        </dl>
        {health?.last_error && (
          <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
            Last error: <code className="font-mono">{health.last_error}</code>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Today&apos;s slate
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.keys(byLeague).length === 0 && (
            <p className="col-span-full text-sm text-slate-500 dark:text-slate-400">No games today.</p>
          )}
          {Object.entries(byLeague).map(([sport, c]) => (
            <div
              key={sport}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {sport.toUpperCase()}
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {c.total} games
              </div>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {c.live} live · {c.final} final · {c.total - c.live - c.final} upcoming
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

function formatAge(ms: number | null) {
  if (ms == null) return 'never';
  if (ms < 1000) return 'just now';
  if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  return `${Math.round(ms / 3_600_000)}h ago`;
}
