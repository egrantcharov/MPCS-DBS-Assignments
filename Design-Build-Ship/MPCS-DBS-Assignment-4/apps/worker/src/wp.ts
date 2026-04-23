// Home-team win-probability approximation.
//
// Transparent, not MLB-official. Inputs:
//   - score differential (home - away)
//   - inning + half
//   - outs
//   - runners on base (on_first/second/third)
//
// 1. Base WP from score differential scaled by an inning weight that grows
//    through the game. Early-game big leads are less decisive.
// 2. Additive nudge from the 24-state run-expectancy table (Tango).
// 3. Clamped to [0.02, 0.98] so no single play makes it degenerate.

export interface WPInputs {
  homeScore: number;
  awayScore: number;
  inning: number;          // 1-indexed
  isTopInning: boolean;    // true = away batting
  outs: number;            // 0..3
  onFirst: boolean;
  onSecond: boolean;
  onThird: boolean;
}

// 24 base-out states → run expectancy (Tango's 2010-2015 average).
const RUN_EXPECTANCY: Record<string, number> = {
  '000_0': 0.48, '000_1': 0.26, '000_2': 0.10,
  '100_0': 0.85, '100_1': 0.51, '100_2': 0.22,
  '010_0': 1.10, '010_1': 0.66, '010_2': 0.31,
  '001_0': 1.30, '001_1': 0.94, '001_2': 0.37,
  '110_0': 1.44, '110_1': 0.88, '110_2': 0.42,
  '101_0': 1.72, '101_1': 1.13, '101_2': 0.50,
  '011_0': 1.90, '011_1': 1.36, '011_2': 0.56,
  '111_0': 2.25, '111_1': 1.54, '111_2': 0.75,
};

function stateKey(onFirst: boolean, onSecond: boolean, onThird: boolean, outs: number): string {
  const bases = `${onFirst ? 1 : 0}${onSecond ? 1 : 0}${onThird ? 1 : 0}`;
  return `${bases}_${Math.min(Math.max(outs, 0), 2)}`;
}

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function inningWeight(inning: number, isTopInning: boolean): number {
  // Bottom of ninth with home trailing is close to decisive. Extra innings
  // compress further. Returns a multiplier on the score-diff logit.
  const i = Math.max(1, inning);
  const base = 0.35 + 0.08 * i; // 1st ≈ 0.43, 9th ≈ 1.07, 12th ≈ 1.31
  return isTopInning ? base * 0.95 : base;
}

export function winProbability(input: WPInputs): number {
  const diff = input.homeScore - input.awayScore;
  const w = inningWeight(input.inning, input.isTopInning);

  const baseLogit = w * diff * 0.9;

  // Run-expectancy nudge: whoever is batting stands to add this many runs.
  const re = RUN_EXPECTANCY[stateKey(input.onFirst, input.onSecond, input.onThird, input.outs)] ?? 0.5;
  const reSign = input.isTopInning ? -1 : 1; // home batting boosts home WP
  const reLogit = reSign * 0.25 * (re - 0.5);

  const wp = logistic(baseLogit + reLogit);
  return Math.min(0.98, Math.max(0.02, wp));
}

// Leverage: rough Tango-style approximation. High when WP is near 0.5 and
// the inning is late. 1.0 ≈ average leverage, values can exceed 3.0.
export function leverage(wp: number, inning: number, isTopInning: boolean): number {
  const w = inningWeight(inning, isTopInning);
  const swingRoom = 4 * Math.sqrt(wp * (1 - wp)); // max 2 at wp=0.5
  return Math.round(swingRoom * w * 100) / 100;
}

export function isSwingPlay(wpDelta: number): boolean {
  return Math.abs(wpDelta) >= 0.1;
}
