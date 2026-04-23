import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Game, Play, Team } from '@/lib/types';
import GameDetailLive from './GameDetailLive';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GamePage({
  params,
}: {
  params: Promise<{ gamePk: string }>;
}) {
  const { gamePk } = await params;
  const pk = Number(gamePk);
  if (!Number.isFinite(pk)) notFound();

  const [gameRes, teamsRes, playsRes] = await Promise.all([
    supabase.from('games').select('*').eq('game_pk', pk).maybeSingle(),
    supabase.from('teams').select('*').order('id'),
    supabase
      .from('plays')
      .select('*')
      .eq('game_pk', pk)
      .order('at_bat_index', { ascending: true }),
  ]);
  const game = gameRes.data as Game | null;
  if (!game) notFound();
  const teams = (teamsRes.data ?? []) as Team[];
  const plays = (playsRes.data ?? []) as Play[];

  return <GameDetailLive initialGame={game} initialPlays={plays} teams={teams} />;
}
