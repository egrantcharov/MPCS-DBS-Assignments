const BASE = 'https://statsapi.mlb.com';

export interface ScheduleGame {
  gamePk: number;
  gameDate: string;
  officialDate: string;
  status: {
    abstractGameState: 'Preview' | 'Live' | 'Final';
    detailedState: string;
  };
  teams: {
    home: { team: { id: number; name: string }; score?: number };
    away: { team: { id: number; name: string }; score?: number };
  };
}

export interface Team {
  id: number;
  name: string;
  abbreviation: string;
  locationName?: string;
  league?: { name: string };
  division?: { name: string };
}

export interface LiveFeed {
  gamePk: number;
  gameData: {
    status: { abstractGameState: string; detailedState: string };
    teams: {
      home: { id: number };
      away: { id: number };
    };
    probablePitchers?: {
      home?: { fullName: string };
      away?: { fullName: string };
    };
    datetime?: { dateTime?: string };
  };
  liveData: {
    linescore?: {
      currentInning?: number;
      isTopInning?: boolean;
      outs?: number;
      offense?: {
        batter?: { fullName?: string };
        first?: unknown;
        second?: unknown;
        third?: unknown;
      };
      defense?: {
        pitcher?: { fullName?: string };
      };
      teams?: {
        home?: { runs?: number };
        away?: { runs?: number };
      };
    };
    plays?: {
      allPlays?: Array<{
        about: {
          atBatIndex: number;
          inning: number;
          isTopInning: boolean;
          hasOut?: boolean;
          captivatingIndex?: number;
          startTime?: string;
          endTime?: string;
          isComplete?: boolean;
        };
        result: {
          type?: string;
          event?: string;
          description?: string;
          homeScore?: number;
          awayScore?: number;
          rbi?: number;
          isOut?: boolean;
        };
        count?: { outs?: number; balls?: number; strikes?: number };
        matchup?: {
          batter?: { fullName: string };
          pitcher?: { fullName: string };
          postOnFirst?: unknown;
          postOnSecond?: unknown;
          postOnThird?: unknown;
        };
      }>;
    };
  };
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': 'clutch-index-worker/0.1 (mpcs dbs)' },
  });
  if (!res.ok) {
    throw new Error(`MLB API ${path} returned ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchTeams(): Promise<Team[]> {
  const data = await fetchJson<{ teams: Team[] }>('/api/v1/teams?sportId=1');
  return data.teams;
}

export async function fetchSchedule(dateISO: string): Promise<ScheduleGame[]> {
  const data = await fetchJson<{ dates: Array<{ games: ScheduleGame[] }> }>(
    `/api/v1/schedule?sportId=1&date=${dateISO}`,
  );
  return data.dates.flatMap((d) => d.games);
}

export async function fetchLive(gamePk: number): Promise<LiveFeed> {
  return fetchJson<LiveFeed>(`/api/v1.1/game/${gamePk}/feed/live`);
}
