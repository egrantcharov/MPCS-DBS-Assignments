'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { WorkerHealth } from '@/lib/types';

const STALE_MS = 90_000;

export default function WorkerStatusChip() {
  const [health, setHealth] = useState<WorkerHealth | null>(null);
  const [now, setNow] = useState<number>(() => 0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    let alive = true;
    (async () => {
      const { data } = await supabase.from('worker_health').select('*').eq('id', 1).maybeSingle();
      if (alive && data) setHealth(data as WorkerHealth);
    })();

    const channel = supabase
      .channel('worker-health')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'worker_health', filter: 'id=eq.1' },
        (payload) => {
          if (payload.new) setHealth(payload.new as WorkerHealth);
        },
      )
      .subscribe();

    const tick = setInterval(() => setNow(Date.now()), 10_000);
    return () => {
      alive = false;
      supabase.removeChannel(channel);
      clearInterval(tick);
    };
  }, []);

  const last = health?.last_poll_at ? new Date(health.last_poll_at).getTime() : null;
  const age = last != null ? now - last : null;
  const online = age != null && age < STALE_MS && (health?.error_count ?? 0) < 3;

  const label = online
    ? 'Worker live'
    : age == null
      ? 'Worker unknown'
      : age < 60_000 * 5
        ? 'Worker delayed'
        : 'Worker offline';
  const dot = online ? 'bg-emerald-500' : age != null && age < 60_000 * 5 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <Link
      href="/status"
      className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 sm:inline-flex"
      title={health?.last_poll_at ? `Last poll ${formatAge(age)}` : 'Waiting for first poll'}
    >
      <span className={`h-2 w-2 rounded-full ${dot} ${online ? 'live-dot' : ''}`} />
      {label}
    </Link>
  );
}

function formatAge(ms: number | null) {
  if (ms == null) return '';
  if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`;
  if (ms < 3600_000) return `${Math.round(ms / 60_000)}m ago`;
  return `${Math.round(ms / 3600_000)}h ago`;
}
