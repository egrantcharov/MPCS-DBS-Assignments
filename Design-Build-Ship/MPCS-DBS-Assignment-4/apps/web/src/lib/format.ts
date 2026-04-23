export function formatWp(wp: number | null | undefined) {
  if (wp == null) return '—';
  return `${Math.round(wp * 100)}%`;
}

export function formatInning(inning: number | null, isTop: boolean | null) {
  if (inning == null) return '—';
  const ord = inningOrdinal(inning);
  if (isTop == null) return ord;
  return `${isTop ? 'Top' : 'Bot'} ${ord}`;
}

export function inningOrdinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formatClock(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatStatus(status: string, detailed: string | null) {
  if (status === 'Final') return 'Final';
  if (status === 'Live') return detailed ?? 'Live';
  if (detailed && detailed !== 'Scheduled') return detailed;
  return status;
}
