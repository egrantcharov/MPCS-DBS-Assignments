import 'dotenv/config';
import {
  fetchLive,
  fetchSchedule,
  fetchTeams,
  type LiveFeed,
  type ScheduleGame,
} from './mlb.js';
import {
  setHealth,
  upsertGame,
  upsertPlays,
  upsertTeams,
  type GameRow,
  type PlayRow,
  type TeamRow,
} from './db.js';
import { isSwingPlay, leverage, winProbability } from './wp.js';

const SCHEDULE_INTERVAL_MS = 5 * 60 * 1000;
const LIVE_INTERVAL_MS = 15 * 1000;
const ONCE = process.argv.includes('--once');

interface GameIndex {
  game_pk: number;
  status: string;
  game_date: string;
  home_team_id: number;
  away_team_id: number;
  game_start: string | null;
}

const state = {
  schedule: new Map<number, GameIndex>(),
  lastScheduleAt: 0,
  seededTeams: false,
};

function mapStatus(abstract: string): 'Preview' | 'Live' | 'Final' {
  if (abstract === 'Live') return 'Live';
  if (abstract === 'Final') return 'Final';
  return 'Preview';
}

function scheduleToRow(g: ScheduleGame, teamIds: Set<number>): GameRow {
  const home = g.teams.home.team.id;
  const away = g.teams.away.team.id;
  return {
    game_pk: g.gamePk,
    game_date: g.officialDate,
    status: mapStatus(g.status.abstractGameState),
    detailed_state: g.status.detailedState ?? null,
    home_team_id: teamIds.has(home) ? home : null,
    away_team_id: teamIds.has(away) ? away : null,
    home_score: g.teams.home.score ?? 0,
    away_score: g.teams.away.score ?? 0,
    inning: null,
    is_top_inning: null,
    outs: null,
    on_first: false,
    on_second: false,
    on_third: false,
    current_batter: null,
    current_pitcher: null,
    last_play: null,
    home_win_prob: null,
    leverage: null,
    clutch_index: null,
    game_start: g.gameDate ?? null,
  };
}

async function refreshTeams() {
  const teams = await fetchTeams();
  const rows: TeamRow[] = teams.map((t) => ({
    id: t.id,
    name: t.name,
    abbreviation: t.abbreviation,
    location: t.locationName ?? null,
    league: t.league?.name ?? null,
    division: t.division?.name ?? null,
  }));
  await upsertTeams(rows);
  state.seededTeams = true;
  console.log(`[teams] seeded ${rows.length}`);
  return new Set(rows.map((t) => t.id));
}

async function refreshSchedule(teamIds: Set<number>) {
  const today = new Date().toISOString().slice(0, 10);
  const games = await fetchSchedule(today);
  state.schedule.clear();
  for (const g of games) {
    const row = scheduleToRow(g, teamIds);
    await upsertGame(row);
    state.schedule.set(g.gamePk, {
      game_pk: g.gamePk,
      status: row.status,
      game_date: row.game_date,
      home_team_id: row.home_team_id ?? 0,
      away_team_id: row.away_team_id ?? 0,
      game_start: row.game_start,
    });
  }
  state.lastScheduleAt = Date.now();
  await setHealth(true);
  console.log(`[schedule] upserted ${games.length} games for ${today}`);
}

function extractGameRow(pk: number, feed: LiveFeed, prior: GameIndex): GameRow {
  const ls = feed.liveData.linescore;
  const plays = feed.liveData.plays?.allPlays ?? [];
  const last = plays[plays.length - 1];

  const inning = ls?.currentInning ?? last?.about.inning ?? null;
  const isTop = ls?.isTopInning ?? last?.about.isTopInning ?? null;
  const outs = ls?.outs ?? last?.count?.outs ?? null;
  const onFirst = Boolean(ls?.offense?.first ?? last?.matchup?.postOnFirst);
  const onSecond = Boolean(ls?.offense?.second ?? last?.matchup?.postOnSecond);
  const onThird = Boolean(ls?.offense?.third ?? last?.matchup?.postOnThird);

  const homeScore = ls?.teams?.home?.runs ?? last?.result.homeScore ?? 0;
  const awayScore = ls?.teams?.away?.runs ?? last?.result.awayScore ?? 0;

  const status = mapStatus(feed.gameData.status.abstractGameState);

  let wp: number | null = null;
  let lev: number | null = null;
  if (inning != null && isTop != null && outs != null) {
    wp = winProbability({
      homeScore,
      awayScore,
      inning,
      isTopInning: isTop,
      outs,
      onFirst,
      onSecond,
      onThird,
    });
    lev = leverage(wp, inning, isTop);
  }

  return {
    game_pk: pk,
    game_date: prior.game_date,
    status,
    detailed_state: feed.gameData.status.detailedState ?? null,
    home_team_id: prior.home_team_id || feed.gameData.teams.home.id,
    away_team_id: prior.away_team_id || feed.gameData.teams.away.id,
    home_score: homeScore,
    away_score: awayScore,
    inning,
    is_top_inning: isTop,
    outs,
    on_first: onFirst,
    on_second: onSecond,
    on_third: onThird,
    current_batter: ls?.offense?.batter?.fullName ?? null,
    current_pitcher: ls?.defense?.pitcher?.fullName ?? null,
    last_play: last?.result.description ?? null,
    home_win_prob: wp,
    leverage: lev,
    clutch_index: last?.about.captivatingIndex ?? null,
    game_start: prior.game_start,
  };
}

function extractPlayRows(pk: number, feed: LiveFeed): PlayRow[] {
  const plays = feed.liveData.plays?.allPlays ?? [];
  const rows: PlayRow[] = [];
  let priorWp: number | null = null;

  for (const p of plays) {
    if (!p.about.isComplete) continue;

    const inning = p.about.inning;
    const isTop = p.about.isTopInning;
    const outs = p.count?.outs ?? 0;
    const onFirst = Boolean(p.matchup?.postOnFirst);
    const onSecond = Boolean(p.matchup?.postOnSecond);
    const onThird = Boolean(p.matchup?.postOnThird);
    const home = p.result.homeScore ?? 0;
    const away = p.result.awayScore ?? 0;

    const wp = winProbability({
      homeScore: home,
      awayScore: away,
      inning,
      isTopInning: isTop,
      outs,
      onFirst,
      onSecond,
      onThird,
    });
    const delta = priorWp == null ? 0 : wp - priorWp;
    priorWp = wp;

    rows.push({
      game_pk: pk,
      at_bat_index: p.about.atBatIndex,
      inning,
      is_top_inning: isTop,
      event: p.result.event ?? null,
      description: p.result.description ?? null,
      home_score: home,
      away_score: away,
      captivating_index: p.about.captivatingIndex ?? null,
      home_win_prob: wp,
      wp_delta: delta,
      is_swing_play: isSwingPlay(delta),
      played_at: p.about.endTime ?? p.about.startTime ?? null,
    });
  }
  return rows;
}

async function refreshOneLiveGame(pk: number, prior: GameIndex) {
  try {
    const feed = await fetchLive(pk);
    const gameRow = extractGameRow(pk, feed, prior);
    await upsertGame(gameRow);
    const plays = extractPlayRows(pk, feed);
    if (plays.length) await upsertPlays(plays);
    prior.status = gameRow.status;
    const lastPlay = plays[plays.length - 1];
    if (gameRow.status === 'Live') {
      console.log(
        `[live ${pk}] ${gameRow.away_score}-${gameRow.home_score} ${gameRow.inning ?? '?'}${gameRow.is_top_inning ? 'T' : 'B'} · ${plays.length}p · WP=${gameRow.home_win_prob?.toFixed(3) ?? 'n/a'} · CI=${gameRow.clutch_index ?? 'n/a'} · ${lastPlay?.event ?? ''}`,
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[live ${pk}] error:`, msg);
    await setHealth(false, msg);
  }
}

async function refreshLiveGames() {
  const targets = [...state.schedule.values()].filter(
    (g) => g.status === 'Live' || g.status === 'Preview',
  );
  if (targets.length === 0) {
    console.log('[live] no live/preview games — idle');
    return;
  }
  for (const g of targets) {
    if (g.status === 'Preview') {
      const start = g.game_start ? new Date(g.game_start).getTime() : 0;
      if (start > Date.now() + 15 * 60 * 1000) continue;
    }
    await refreshOneLiveGame(g.game_pk, g);
  }
}

async function tick(teamIds: Set<number>) {
  try {
    if (Date.now() - state.lastScheduleAt >= SCHEDULE_INTERVAL_MS) {
      await refreshSchedule(teamIds);
    }
    await refreshLiveGames();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[tick] fatal:', msg);
    await setHealth(false, msg);
  }
}

async function main() {
  console.log('[boot] clutch-index worker starting');
  const teamIds = state.seededTeams ? new Set<number>() : await refreshTeams();
  await refreshSchedule(teamIds);

  if (ONCE) {
    await refreshLiveGames();
    console.log('[boot] --once complete, exiting');
    return;
  }

  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    console.log('[boot] shutdown signal received');
    setTimeout(() => process.exit(0), 100);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  while (!stopping) {
    await tick(teamIds);
    await new Promise((r) => setTimeout(r, LIVE_INTERVAL_MS));
  }
}

main().catch((err) => {
  console.error('[boot] crashed:', err);
  process.exit(1);
});
