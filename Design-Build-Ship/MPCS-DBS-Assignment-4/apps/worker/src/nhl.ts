// NHL Web API client. Free, no key. Similar cadence to MLB.
// Base: https://api-web.nhle.com/v1

const BASE = 'https://api-web.nhle.com/v1';
const UA = 'clutch-index-worker/0.2 (mpcs dbs)';

// NHL teams have numeric IDs 1..55 (with gaps). We offset them by +10000
// when writing to our DB so they don't collide with MLB team IDs.
export const NHL_ID_OFFSET = 10000;

export interface NhlTeam {
  id: number;
  abbrev: string;
  name?: { default: string };
  placeName?: { default: string };
  commonName?: { default: string };
  logo?: string;
  score?: number;
  record?: string;
}

export interface NhlGame {
  id: number;
  gameDate: string;
  startTimeUTC: string;
  gameState: 'FUT' | 'PRE' | 'LIVE' | 'CRIT' | 'OFF' | 'FINAL';
  period?: number | null;
  periodDescriptor?: { number?: number; periodType?: string };
  clock?: { timeRemaining?: string; inIntermission?: boolean };
  homeTeam: NhlTeam;
  awayTeam: NhlTeam;
  venue?: { default: string };
  situation?: {
    homeTeam?: { strength?: number };
    awayTeam?: { strength?: number };
  };
}

export interface NhlScoreNow {
  prevDate: string;
  currentDate: string;
  games: NhlGame[];
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`NHL API ${path} returned ${res.status}`);
  return (await res.json()) as T;
}

// Returns every game from today's slate with current scores/state.
export async function fetchScoreNow(): Promise<NhlScoreNow> {
  return fetchJson<NhlScoreNow>('/score/now');
}

// Aggregate team directory from the score feed — avoids a separate
// teams endpoint that would need league+season parameters.
export async function fetchTeamsFromScore(): Promise<NhlTeam[]> {
  const s = await fetchScoreNow();
  const byId = new Map<number, NhlTeam>();
  for (const g of s.games) {
    if (g.homeTeam?.id && !byId.has(g.homeTeam.id)) byId.set(g.homeTeam.id, g.homeTeam);
    if (g.awayTeam?.id && !byId.has(g.awayTeam.id)) byId.set(g.awayTeam.id, g.awayTeam);
  }
  return [...byId.values()];
}

export function mapNhlStatus(state: string): 'Preview' | 'Live' | 'Final' {
  if (state === 'LIVE' || state === 'CRIT') return 'Live';
  if (state === 'OFF' || state === 'FINAL') return 'Final';
  return 'Preview';
}

export function formatPeriodLabel(period: number | null | undefined, descriptor?: { periodType?: string }): string | null {
  if (period == null) return null;
  const type = descriptor?.periodType;
  if (type === 'SO') return 'Shootout';
  if (type === 'OT') return period > 4 ? `OT ${period - 3}` : 'OT';
  const ord = ['', '1st', '2nd', '3rd'][period] ?? `${period}th`;
  return `${ord} period`;
}
