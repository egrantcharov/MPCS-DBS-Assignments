'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Highlight, Team } from '@/lib/types';

const OPT_IN_KEY = 'clutch-notifications-enabled';

// Mounted on the signed-in dashboard. Silent no-op if the user hasn't opted
// in and granted permission, otherwise fires browser notifications for
// highlight rows involving one of their starred teams.
export default function ClutchNotifier({
  starredTeamIds,
  teams,
  starredGamePks,
}: {
  starredTeamIds: number[];
  teams: Team[];
  starredGamePks: number[];
}) {
  const seen = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
    const optedIn = window.localStorage.getItem(OPT_IN_KEY) === '1';
    if (!optedIn || Notification.permission !== 'granted') return;
    if (starredTeamIds.length === 0) return;

    const starredGames = new Set(starredGamePks);
    const teamNames = new Map(teams.map((t) => [t.id, t.abbreviation]));
    void teamNames;

    const channel = supabase
      .channel('clutch-notify')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'highlights' },
        (payload) => {
          const h = payload.new as Highlight;
          if (seen.current.has(h.id)) return;
          if (!starredGames.has(h.game_pk)) return;
          seen.current.add(h.id);
          try {
            new Notification(`Clutch moment · ${h.event ?? 'Swing play'}`, {
              body: h.description ?? '',
              icon: '/favicon.ico',
              tag: `clutch-${h.game_pk}-${h.at_bat_index}`,
            });
          } catch {
            // ignore — some browsers deny notifications silently
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [starredTeamIds, starredGamePks, teams]);

  return null;
}
