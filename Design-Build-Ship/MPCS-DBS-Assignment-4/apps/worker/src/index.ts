import 'dotenv/config';
import {
  fetchLive,
  fetchSchedule,
  fetchTeams,
  type LiveFeed,
  type ScheduleGame,
} from './mlb.js';
import {
  NHL_ID_OFFSET,
  fetchScoreNow,
  mapNhlStatus,
  formatPeriodLabel,
  type NhlGame,
} from './nhl.js';
import {
  insertHighlights,
  latestHighlightIndex,
  setHealth,
  upsertGame,
  upsertPlays,
  upsertTeams,
  type GameRow,
  type HighlightRow,
  type PlayRow,
  type TeamRow,
} from './db.js';
import { isSwingPlay, leverage, winProbability } from './wp.js';

const SCHEDULE_INTERVAL_MS = 5 * 60 * 1000;
const LIVE_INTERVAL_MS = 15 * 1000;
const ONCE = process.argv.includes('--once');

interface GameIndex {
  game_pk: number;
  sport: 'mlb' | 'nhl';
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

function mlbStatus(abstract: string): 'Preview' | 'Live' | 'Final' {
  if (abstract === 'Live') return 'Live';
  if (abstract === 'Final') return 'Final';
  return 'Preview';
}

function blankMlbGameRow(g: ScheduleGame, teamIds: Set<number>): GameRow {
  const home = g.teams.home.team.id;
  const away = g.teams.away.team.id;
  return {
    game_pk: g.gamePk,
    sport: 'mlb',
    game_date: g.officialDate,
    status: mlbStatus(g.status.abstractGameState),
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
    period_label: null,
    clock: null,
  };
}

async function refreshMlbTeams(): Promise<Set<number>> {
  const teams = await fetchTeams();
  const rows: TeamRow[] = teams.map((t) => ({
    id: t.id,
    sport: 'mlb',
    name: t.name,
    abbreviation: t.abbreviation,
    location: t.locationName ?? null,
    league: t.league?.name ?? null,
    division: t.division?.name ?? null,
    logo_url: `https://www.mlbstatic.com/team-logos/${t.id}.svg`,
  }));
  await upsertTeams(rows);
  console.log(`[mlb/teams] seeded ${rows.length}`);
  return new Set(rows.map((t) => t.id));
}

async function refreshMlbSchedule(teamIds: Set<number>) {
  const today = new Date().toISOString().slice(0, 10);
  const games = await fetchSchedule(today);
  for (const g of games) {
    const row = blankMlbGameRow(g, teamIds);
    await upsertGame(row);
    state.schedule.set(g.gamePk, {
      game_pk: g.gamePk,
      sport: 'mlb',
      status: row.status,
      game_date: row.game_date,
      home_team_id: row.home_team_id ?? 0,
      away_team_id: row.away_team_id ?? 0,
      game_start: row.game_start,
    });
  }
  console.log(`[mlb/schedule] upserted ${games.length} games for ${today}`);
}

function extractMlbGameRow(pk: number, feed: LiveFeed, prior: GameIndex): GameRow {
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

  const status = mlbStatus(feed.gameData.status.abstractGameState);

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
    sport: 'mlb',
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
    period_label: inning != null ? `${isTop ? 'Top' : 'Bot'} ${inning}` : null,
    clock: null,
  };
}

function extractMlbPlayRows(pk: number, feed: LiveFeed): PlayRow[] {
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
      sport: 'mlb',
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

async function refreshOneMlbGame(pk: number, prior: GameIndex) {
  try {
    const feed = await fetchLive(pk);
    const gameRow = extractMlbGameRow(pk, feed, prior);
    await upsertGame(gameRow);
    const plays = extractMlbPlayRows(pk, feed);
    if (plays.length) await upsertPlays(plays);
    prior.status = gameRow.status;

    // highlight feed — any new swing play or CI>=60 becomes a highlight
    const maxIdx = await latestHighlightIndex('mlb', pk);
    const fresh = plays.filter(
      (p) =>
        p.at_bat_index > maxIdx &&
        (p.is_swing_play || (p.captivating_index ?? 0) >= 60),
    );
    if (fresh.length) {
      const hs: HighlightRow[] = fresh.map((p) => ({
        sport: 'mlb',
        game_pk: pk,
        at_bat_index: p.at_bat_index,
        event: p.event,
        description: p.description,
        captivating_index: p.captivating_index,
        home_win_prob: p.home_win_prob,
        wp_delta: p.wp_delta,
        occurred_at: p.played_at ?? new Date().toISOString(),
      }));
      await insertHighlights(hs);
    }

    if (gameRow.status === 'Live') {
      const lastPlay = plays[plays.length - 1];
      console.log(
        `[mlb ${pk}] ${gameRow.away_score}-${gameRow.home_score} ${gameRow.inning ?? '?'}${gameRow.is_top_inning ? 'T' : 'B'} · WP=${gameRow.home_win_prob?.toFixed(3) ?? 'n/a'} CI=${gameRow.clutch_index ?? 'n/a'} · ${lastPlay?.event ?? ''}`,
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[mlb ${pk}] error:`, msg);
    await setHealth(false, msg);
  }
}

// ---------------- NHL ----------------

function nhlTeamsRow(g: NhlGame): TeamRow[] {
  const rows: TeamRow[] = [];
  for (const t of [g.homeTeam, g.awayTeam]) {
    if (!t?.id) continue;
    rows.push({
      id: t.id + NHL_ID_OFFSET,
      sport: 'nhl',
      name: t.commonName?.default ?? t.name?.default ?? t.abbrev,
      abbreviation: t.abbrev,
      location: t.placeName?.default ?? null,
      league: 'NHL',
      division: null,
      logo_url: t.logo ?? null,
    });
  }
  return rows;
}

function nhlGameRow(g: NhlGame, dateISO: string): GameRow {
  const status = mapNhlStatus(g.gameState);
  const period = g.period ?? g.periodDescriptor?.number ?? null;
  const clock = g.clock?.timeRemaining ?? null;
  const inIntermission = Boolean(g.clock?.inIntermission);

  return {
    game_pk: g.id,
    sport: 'nhl',
    game_date: g.gameDate ?? dateISO,
    status,
    detailed_state: inIntermission ? 'Intermission' : g.gameState,
    home_team_id: g.homeTeam?.id != null ? g.homeTeam.id + NHL_ID_OFFSET : null,
    away_team_id: g.awayTeam?.id != null ? g.awayTeam.id + NHL_ID_OFFSET : null,
    home_score: g.homeTeam?.score ?? 0,
    away_score: g.awayTeam?.score ?? 0,
    inning: period,
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
    game_start: g.startTimeUTC ?? null,
    period_label: formatPeriodLabel(period, g.periodDescriptor),
    clock,
  };
}

async function refreshNhl() {
  try {
    const score = await fetchScoreNow();
    const teamRows = new Map<number, TeamRow>();
    for (const g of score.games) {
      for (const r of nhlTeamsRow(g)) teamRows.set(r.id, r);
    }
    await upsertTeams([...teamRows.values()]);

    for (const g of score.games) {
      const row = nhlGameRow(g, score.currentDate);
      await upsertGame(row);
      state.schedule.set(g.id, {
        game_pk: g.id,
        sport: 'nhl',
        status: row.status,
        game_date: row.game_date,
        home_team_id: row.home_team_id ?? 0,
        away_team_id: row.away_team_id ?? 0,
        game_start: row.game_start,
      });
    }
    const live = score.games.filter((g) => mapNhlStatus(g.gameState) === 'Live').length;
    console.log(
      `[nhl] ${score.games.length} games on ${score.currentDate}, ${live} live, ${teamRows.size} teams`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[nhl] error:', msg);
  }
}

// ---------------- loop ----------------

async function refreshLiveMlbGames() {
  const targets = [...state.schedule.values()].filter(
    (g) => g.sport === 'mlb' && (g.status === 'Live' || g.status === 'Preview'),
  );
  for (const g of targets) {
    if (g.status === 'Preview') {
      const start = g.game_start ? new Date(g.game_start).getTime() : 0;
      if (start > Date.now() + 15 * 60 * 1000) continue;
    }
    await refreshOneMlbGame(g.game_pk, g);
  }
}

async function tick(teamIds: Set<number>) {
  try {
    if (Date.now() - state.lastScheduleAt >= SCHEDULE_INTERVAL_MS) {
      await refreshMlbSchedule(teamIds);
      await refreshNhl();
      state.lastScheduleAt = Date.now();
      await setHealth(true);
    }
    await refreshLiveMlbGames();
    await refreshNhl(); // NHL /score/now is a single call, cheap; refresh each tick
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[tick] fatal:', msg);
    await setHealth(false, msg);
  }
}

async function main() {
  console.log('[boot] clutch-index worker starting (mlb + nhl)');
  const mlbTeamIds = await refreshMlbTeams();
  await refreshMlbSchedule(mlbTeamIds);
  await refreshNhl();
  state.lastScheduleAt = Date.now();
  await setHealth(true);

  if (ONCE) {
    await refreshLiveMlbGames();
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
    await tick(mlbTeamIds);
    await new Promise((r) => setTimeout(r, LIVE_INTERVAL_MS));
  }
}

main().catch((err) => {
  console.error('[boot] crashed:', err);
  process.exit(1);
});
