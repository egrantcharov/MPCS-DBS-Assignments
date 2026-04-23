import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Scoreboard from '@/components/Scoreboard';
import type { Game, Team, UserPrefs } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const today = new Date().toISOString().slice(0, 10);
  const [gamesRes, teamsRes, favsRes, prefsRes] = await Promise.all([
    supabase.from('games').select('*').eq('game_date', today),
    supabase.from('teams').select('*').order('name'),
    supabase.from('user_favorites').select('team_id').eq('user_id', userId),
    supabase.from('user_prefs').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  const games = (gamesRes.data ?? []) as Game[];
  const teams = (teamsRes.data ?? []) as Team[];
  const favs = (favsRes.data ?? []).map((r: { team_id: number }) => r.team_id);
  const prefs = (prefsRes.data ?? null) as UserPrefs | null;
  const threshold = prefs?.clutch_threshold ?? 40;
  const showOnlyFavs = prefs?.show_only_favs ?? false;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Your dashboard</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {favs.length === 0
              ? 'You have no starred teams yet — pick some in Settings to personalize this page.'
              : `Tracking ${favs.length} team${favs.length === 1 ? '' : 's'} · clutch threshold ≥ ${Number(threshold).toFixed(0)}${showOnlyFavs ? ' · starred only' : ''}.`}
          </p>
        </div>
        <Link
          href="/settings"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Edit preferences
        </Link>
      </header>

      <Scoreboard
        initialGames={games}
        teams={teams}
        starredTeamIds={favs}
        clutchThreshold={Number(threshold)}
        showOnlyFavs={showOnlyFavs}
      />
    </div>
  );
}
