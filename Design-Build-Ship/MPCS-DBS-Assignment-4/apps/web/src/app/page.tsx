import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import Scoreboard from '@/components/Scoreboard';
import type { Game, Team, UserPrefs } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loadToday() {
  const today = new Date().toISOString().slice(0, 10);
  const [gamesRes, teamsRes] = await Promise.all([
    supabase.from('games').select('*').eq('game_date', today),
    supabase.from('teams').select('*').order('name'),
  ]);
  return {
    games: (gamesRes.data ?? []) as Game[],
    teams: (teamsRes.data ?? []) as Team[],
  };
}

async function loadUserContext() {
  const { userId } = await auth();
  if (!userId) return { userId: null as string | null, favs: [] as number[], prefs: null as UserPrefs | null };
  const [favRes, prefRes] = await Promise.all([
    supabase.from('user_favorites').select('team_id').eq('user_id', userId),
    supabase.from('user_prefs').select('*').eq('user_id', userId).maybeSingle(),
  ]);
  return {
    userId,
    favs: (favRes.data ?? []).map((r: { team_id: number }) => r.team_id),
    prefs: (prefRes.data ?? null) as UserPrefs | null,
  };
}

export default async function HomePage() {
  const [{ games, teams }, ctx] = await Promise.all([loadToday(), loadUserContext()]);
  const threshold = ctx.prefs?.clutch_threshold ?? 40;
  const showOnlyFavs = ctx.prefs?.show_only_favs ?? false;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Clutch Index
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Live MLB win probability, leverage, and the plays that actually matter —
          ranked and updated in real time.
        </p>
        {!ctx.userId && (
          <p className="mt-2 text-sm text-indigo-600">
            Sign in to star your teams and tune your clutch threshold.
          </p>
        )}
      </header>

      <Scoreboard
        initialGames={games}
        teams={teams}
        starredTeamIds={ctx.favs}
        clutchThreshold={Number(threshold)}
        showOnlyFavs={showOnlyFavs}
      />

      <footer className="mt-16 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        Data: <a href="https://statsapi.mlb.com" className="underline">MLB Stats API</a>.
        Win probability is an approximation, not FanGraphs WPA. Clutch Index (CI) is MLB&apos;s captivatingIndex passed through.
      </footer>
    </div>
  );
}
