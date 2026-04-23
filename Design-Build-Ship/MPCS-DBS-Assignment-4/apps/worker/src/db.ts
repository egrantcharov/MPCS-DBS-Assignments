import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error('Worker missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

export const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export interface GameRow {
  game_pk: number;
  game_date: string;
  status: string;
  detailed_state: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  home_score: number;
  away_score: number;
  inning: number | null;
  is_top_inning: boolean | null;
  outs: number | null;
  on_first: boolean;
  on_second: boolean;
  on_third: boolean;
  current_batter: string | null;
  current_pitcher: string | null;
  last_play: string | null;
  home_win_prob: number | null;
  leverage: number | null;
  clutch_index: number | null;
  game_start: string | null;
}

export interface PlayRow {
  game_pk: number;
  at_bat_index: number;
  inning: number | null;
  is_top_inning: boolean | null;
  event: string | null;
  description: string | null;
  home_score: number | null;
  away_score: number | null;
  captivating_index: number | null;
  home_win_prob: number | null;
  wp_delta: number | null;
  is_swing_play: boolean;
  played_at: string | null;
}

export interface TeamRow {
  id: number;
  abbreviation: string;
  name: string;
  location: string | null;
  league: string | null;
  division: string | null;
}

export async function upsertTeams(teams: TeamRow[]) {
  if (!teams.length) return;
  const { error } = await supabase.from('teams').upsert(teams, { onConflict: 'id' });
  if (error) throw new Error(`upsertTeams: ${error.message}`);
}

export async function upsertGame(game: GameRow) {
  const row = { ...game, updated_at: new Date().toISOString() };
  const { error } = await supabase.from('games').upsert(row, { onConflict: 'game_pk' });
  if (error) throw new Error(`upsertGame: ${error.message}`);
}

export async function upsertPlays(plays: PlayRow[]) {
  if (!plays.length) return;
  const { error } = await supabase.from('plays').upsert(plays, {
    onConflict: 'game_pk,at_bat_index',
  });
  if (error) throw new Error(`upsertPlays: ${error.message}`);
}

export async function listActiveGamePks(today: string): Promise<number[]> {
  const { data, error } = await supabase
    .from('games')
    .select('game_pk,status')
    .eq('game_date', today);
  if (error) throw new Error(`listActiveGamePks: ${error.message}`);
  return (data ?? [])
    .filter((g) => g.status === 'Live' || g.status === 'Preview')
    .map((g) => g.game_pk as number);
}

export async function setHealth(ok: boolean, message?: string) {
  const { error } = await supabase
    .from('worker_health')
    .update({
      last_poll_at: new Date().toISOString(),
      last_error: ok ? null : message ?? 'unknown',
      error_count: ok
        ? 0
        : ((
            await supabase.from('worker_health').select('error_count').eq('id', 1).single()
          ).data?.error_count ?? 0) + 1,
    })
    .eq('id', 1);
  if (error) console.warn('setHealth:', error.message);
}
