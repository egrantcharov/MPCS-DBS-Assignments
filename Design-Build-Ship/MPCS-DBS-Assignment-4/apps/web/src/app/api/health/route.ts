import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const [h, g, p] = await Promise.all([
    supabase.from('worker_health').select('*').eq('id', 1).maybeSingle(),
    supabase.from('games').select('sport,status').eq('game_date', today),
    supabase.from('plays').select('game_pk', { count: 'exact', head: true }),
  ]);
  const health = h.data ?? null;
  const games = (g.data ?? []) as Array<{ sport: string; status: string }>;
  const byLeague: Record<string, { total: number; live: number; final: number }> = {};
  for (const row of games) {
    byLeague[row.sport] ??= { total: 0, live: 0, final: 0 };
    byLeague[row.sport].total += 1;
    if (row.status === 'Live') byLeague[row.sport].live += 1;
    if (row.status === 'Final') byLeague[row.sport].final += 1;
  }
  return NextResponse.json(
    {
      worker: health,
      games_today: byLeague,
      total_plays: p.count ?? 0,
      as_of: new Date().toISOString(),
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
