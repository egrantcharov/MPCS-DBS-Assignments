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
  sport: string;
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
  period_label: string | null;
  clock: string | null;
}

export interface PlayRow {
  game_pk: number;
  sport: string;
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
  sport: string;
  abbreviation: string;
  name: string;
  location: string | null;
  league: string | null;
  division: string | null;
  logo_url: string | null;
}

export interface HighlightRow {
  sport: string;
  game_pk: number;
  at_bat_index: number | null;
  event: string | null;
  description: string | null;
  captivating_index: number | null;
  home_win_prob: number | null;
  wp_delta: number | null;
  occurred_at: string;
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

export async function insertHighlights(rows: HighlightRow[]) {
  if (!rows.length) return;
  const { error } = await supabase.from('highlights').insert(rows);
  if (error) console.warn('insertHighlights:', error.message);
}

export async function latestHighlightIndex(sport: string, gamePk: number): Promise<number> {
  const { data, error } = await supabase
    .from('highlights')
    .select('at_bat_index')
    .eq('sport', sport)
    .eq('game_pk', gamePk)
    .order('at_bat_index', { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return -1;
  return (data[0]?.at_bat_index as number | null) ?? -1;
}

export async function setHealth(ok: boolean, message?: string) {
  const { data } = await supabase.from('worker_health').select('error_count').eq('id', 1).single();
  const nextErr = ok ? 0 : (data?.error_count ?? 0) + 1;
  const { error } = await supabase
    .from('worker_health')
    .update({
      last_poll_at: new Date().toISOString(),
      last_error: ok ? null : message ?? 'unknown',
      error_count: nextErr,
    })
    .eq('id', 1);
  if (error) console.warn('setHealth:', error.message);
}
