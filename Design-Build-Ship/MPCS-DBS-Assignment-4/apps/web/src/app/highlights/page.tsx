import { supabase } from '@/lib/supabase';
import HighlightsFeed from '@/components/HighlightsFeed';
import type { Highlight, Team } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HighlightsPage() {
  const [hRes, teamsRes] = await Promise.all([
    supabase
      .from('highlights')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(50),
    supabase.from('teams').select('*'),
  ]);
  const highlights = (hRes.data ?? []) as Highlight[];
  const teams = (teamsRes.data ?? []) as Team[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Highlights</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Swing-plays and high-captivating-index moments across every live game, pushed
          in real time as they happen. New rows ping directly from Supabase Realtime —
          no refresh needed.
        </p>
      </header>
      <HighlightsFeed initial={highlights} teams={teams} limit={50} title="" />
    </div>
  );
}
