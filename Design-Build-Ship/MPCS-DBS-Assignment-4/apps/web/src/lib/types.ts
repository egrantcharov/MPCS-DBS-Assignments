export interface Team {
  id: number;
  abbreviation: string;
  name: string;
  location: string | null;
  league: string | null;
  division: string | null;
}

export interface Game {
  game_pk: number;
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
  updated_at: string | null;
}

export interface Play {
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

export interface UserPrefs {
  user_id: string;
  show_only_favs: boolean;
  clutch_threshold: number;
  updated_at: string;
}
