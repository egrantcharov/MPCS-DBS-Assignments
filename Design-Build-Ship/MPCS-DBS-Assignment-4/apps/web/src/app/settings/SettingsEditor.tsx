'use client';

import { useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import type { Team, UserPrefs } from '@/lib/types';
import TeamChip from '@/components/TeamChip';

export default function SettingsEditor({
  userId,
  teams,
  initialFavs,
  initialPrefs,
}: {
  userId: string;
  teams: Team[];
  initialFavs: number[];
  initialPrefs: UserPrefs | null;
}) {
  const [favs, setFavs] = useState<Set<number>>(new Set(initialFavs));
  const [threshold, setThreshold] = useState<number>(
    initialPrefs?.clutch_threshold != null ? Number(initialPrefs.clutch_threshold) : 40,
  );
  const [showOnlyFavs, setShowOnlyFavs] = useState<boolean>(
    initialPrefs?.show_only_favs ?? false,
  );
  const [saving, startSaving] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  async function toggleFav(teamId: number) {
    const next = new Set(favs);
    const isStarred = next.has(teamId);
    if (isStarred) {
      next.delete(teamId);
    } else {
      next.add(teamId);
    }
    setFavs(next);

    const mutation = isStarred
      ? supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('team_id', teamId)
      : supabase
          .from('user_favorites')
          .upsert({ user_id: userId, team_id: teamId });

    const { error } = await mutation;
    if (error) {
      console.error('toggleFav', error);
      setMessage(`Save failed: ${error.message}`);
    }
  }

  function savePrefs() {
    setMessage(null);
    startSaving(async () => {
      const { error } = await supabase.from('user_prefs').upsert(
        {
          user_id: userId,
          clutch_threshold: threshold,
          show_only_favs: showOnlyFavs,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      if (error) {
        setMessage(`Save failed: ${error.message}`);
      } else {
        setMessage('Saved.');
      }
    });
  }

  return (
    <div className="mt-8 space-y-10">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Starred teams
        </h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Their games appear pinned on the scoreboard and dashboard.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {teams.map((t) => {
            const on = favs.has(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleFav(t.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                  on
                    ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950/40'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                }`}
              >
                <TeamChip teamId={t.id} abbreviation={t.abbreviation} size="sm" />
                <span className="truncate text-sm text-slate-800 dark:text-slate-200">
                  {t.name}
                </span>
                {on && <span className="ml-auto text-xs text-indigo-600">★</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Clutch surfacing
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Any live game whose current Clutch Index (CI, MLB&apos;s captivatingIndex) is at or
          above this threshold shows on the front page. Lower = more games, higher = only the tense ones.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="flex-1 accent-indigo-600"
          />
          <span className="w-12 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {threshold}
          </span>
        </div>

        <label className="mt-6 flex items-center gap-3">
          <input
            type="checkbox"
            checked={showOnlyFavs}
            onChange={(e) => setShowOnlyFavs(e.target.checked)}
            className="h-4 w-4 rounded accent-indigo-600"
          />
          <span className="text-sm text-slate-800 dark:text-slate-200">
            Only show games involving my starred teams
          </span>
        </label>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={savePrefs}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
          {message && (
            <span className="text-sm text-slate-500 dark:text-slate-400">{message}</span>
          )}
        </div>
      </section>
    </div>
  );
}
