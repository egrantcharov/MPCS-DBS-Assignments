import { supabase } from '@/lib/supabase';
import StatusClient from './StatusClient';
import type { WorkerHealth } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StatusPage() {
  const [healthRes, gamesRes, playsRes, hlRes, teamsRes] = await Promise.all([
    supabase.from('worker_health').select('*').eq('id', 1).maybeSingle(),
    supabase
      .from('games')
      .select('sport,status')
      .eq('game_date', new Date().toISOString().slice(0, 10)),
    supabase.from('plays').select('game_pk', { count: 'exact', head: true }),
    supabase.from('highlights').select('id', { count: 'exact', head: true }),
    supabase.from('teams').select('sport', { count: 'exact', head: true }),
  ]);

  const health = (healthRes.data ?? null) as WorkerHealth | null;
  const games = (gamesRes.data ?? []) as Array<{ sport: string; status: string }>;
  const byLeague: Record<string, { total: number; live: number; final: number }> = {};
  for (const g of games) {
    const k = g.sport;
    byLeague[k] ??= { total: 0, live: 0, final: 0 };
    byLeague[k].total += 1;
    if (g.status === 'Live') byLeague[k].live += 1;
    if (g.status === 'Final') byLeague[k].final += 1;
  }

  return (
    <StatusClient
      initialHealth={health}
      byLeague={byLeague}
      totalPlays={playsRes.count ?? 0}
      totalHighlights={hlRes.count ?? 0}
      totalTeams={teamsRes.count ?? 0}
    />
  );
}
