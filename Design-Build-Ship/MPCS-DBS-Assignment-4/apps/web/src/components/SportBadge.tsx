import type { Sport } from '@/lib/types';

const STYLES: Record<Sport, { bg: string; fg: string; label: string }> = {
  mlb: { bg: 'bg-blue-900', fg: 'text-white', label: 'MLB' },
  nhl: { bg: 'bg-stone-800', fg: 'text-white', label: 'NHL' },
};

export default function SportBadge({ sport, size = 'sm' }: { sport: Sport; size?: 'sm' | 'md' }) {
  const s = STYLES[sport];
  const cls = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  return (
    <span className={`inline-flex items-center rounded font-semibold tracking-wide ${s.bg} ${s.fg} ${cls}`}>
      {s.label}
    </span>
  );
}
