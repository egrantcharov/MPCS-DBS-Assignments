import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Team, UserPrefs } from '@/lib/types';
import SettingsEditor from './SettingsEditor';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/');

  const [teamsRes, favsRes, prefsRes] = await Promise.all([
    supabase.from('teams').select('*').order('name'),
    supabase.from('user_favorites').select('team_id').eq('user_id', userId),
    supabase.from('user_prefs').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  const teams = (teamsRes.data ?? []) as Team[];
  const favs = (favsRes.data ?? []).map((r: { team_id: number }) => r.team_id);
  const prefs = (prefsRes.data ?? null) as UserPrefs | null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Star your favorite teams and decide which plays surface on your dashboard.
      </p>

      <SettingsEditor
        userId={userId}
        teams={teams}
        initialFavs={favs}
        initialPrefs={prefs}
      />
    </div>
  );
}
