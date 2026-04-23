import { teamColor } from '@/lib/team-colors';

export default function TeamChip({
  teamId,
  abbreviation,
  size = 'md',
}: {
  teamId: number | null | undefined;
  abbreviation: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const c = teamColor(teamId);
  const cls =
    size === 'sm'
      ? 'h-6 w-10 text-[11px]'
      : size === 'lg'
        ? 'h-10 w-16 text-base'
        : 'h-8 w-12 text-sm';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md font-semibold tracking-wide ${cls}`}
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {abbreviation}
    </span>
  );
}
