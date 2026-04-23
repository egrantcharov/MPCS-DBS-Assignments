'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Play } from '@/lib/types';

export default function WinProbChart({
  plays,
  homeAbbr,
  awayAbbr,
}: {
  plays: Play[];
  homeAbbr: string;
  awayAbbr: string;
}) {
  const data = useMemo(
    () =>
      plays
        .filter((p) => p.home_win_prob != null)
        .map((p) => ({
          at: p.at_bat_index,
          inning: p.inning,
          half: p.is_top_inning ? 'T' : 'B',
          wp: Math.round((p.home_win_prob ?? 0) * 1000) / 10,
          event: p.event ?? '',
          description: p.description ?? '',
          isSwing: p.is_swing_play,
        })),
    [plays],
  );

  if (data.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Win probability chart appears once the game has play data.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="wpFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
          <XAxis
            dataKey="at"
            stroke="#64748b"
            fontSize={11}
            tickFormatter={(v) => {
              const p = data.find((d) => d.at === v);
              return p ? `${p.half}${p.inning}` : '';
            }}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            stroke="#64748b"
            fontSize={11}
            tickFormatter={(v) => `${v}%`}
          />
          <ReferenceLine y={50} stroke="#94a3b8" strokeDasharray="4 4" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              border: 'none',
              borderRadius: 8,
              color: '#f8fafc',
              fontSize: 12,
            }}
            formatter={(v) => {
              const num = typeof v === 'number' ? v : Number(v ?? 0);
              return [`${homeAbbr} ${num.toFixed(1)}% · ${awayAbbr} ${(100 - num).toFixed(1)}%`, 'Win prob'];
            }}
            labelFormatter={(_l, payload) => {
              const p = payload?.[0]?.payload;
              if (!p) return '';
              return `${p.half}${p.inning} · ${p.event}`;
            }}
          />
          <Area
            type="monotone"
            dataKey="wp"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#wpFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
