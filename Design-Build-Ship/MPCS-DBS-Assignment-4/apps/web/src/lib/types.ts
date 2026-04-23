export type Sport = 'mlb' | 'nhl';

export interface Team {
  id: number;
  sport: Sport;
  abbreviation: string;
  name: string;
  location: string | null;
  league: string | null;
  division: string | null;
  logo_url: string | null;
}

export interface Game {
  game_pk: number;
  sport: Sport;
  game_date: string;
  status: 'Preview' | 'Live' | 'Final';
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
  updated_at: string | null;
}

export interface Play {
  game_pk: number;
  sport: Sport;
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

export interface Highlight {
  id: number;
  sport: Sport;
  game_pk: number;
  at_bat_index: number | null;
  event: string | null;
  description: string | null;
  captivating_index: number | null;
  home_win_prob: number | null;
  wp_delta: number | null;
  occurred_at: string;
}

export interface UserPrefs {
  user_id: string;
  show_only_favs: boolean;
  clutch_threshold: number;
  updated_at: string;
}

export interface WorkerHealth {
  id: number;
  last_poll_at: string | null;
  last_error: string | null;
  error_count: number;
}

export const SPORT_LABELS: Record<Sport, string> = {
  mlb: 'MLB',
  nhl: 'NHL',
};
