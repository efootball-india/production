// PASS-3-LIB-KNOCKOUT
import { createClient } from '@/lib/supabase/server';
import { getGroupStandings, type StandingRow } from '@/lib/fixtures';

export const R32_PAIRINGS: Array<[number, number]> = [
  [13, 14],
  [3, 25],
  [5, 26],
  [6, 15],
  [9, 27],
  [17, 21],
  [1, 28],
  [12, 29],
  [4, 30],
  [7, 31],
  [23, 24],
  [8, 22],
  [2, 32],
  [10, 20],
  [11, 16],
  [16, 19],
];

export function seedToLabel(seed: number): string {
  const groupLetter = (idx: number) => String.fromCharCode('A'.charCodeAt(0) + idx);
  if (seed >= 1 && seed <= 12) return `${groupLetter(seed - 1)}1`;
  if (seed >= 13 && seed <= 24) return `${groupLetter(seed - 13)}2`;
  if (seed >= 25 && seed <= 32) return `BT${seed - 24}`;
  return `?${seed}`;
}

export interface GroupResult {
  label: string;
  groupId: string;
  standings: StandingRow[];
  hasUnresolvedTie: boolean;
}

export async function getAllGroupResults(tournamentId: string): Promise<GroupResult[]> {
  const supabase = createClient();

  const { data: stage } = await supabase
    .from('stages')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('stage_type', 'groups')
    .maybeSingle();
  if (!stage) return [];

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name')
    .eq('stage_id', stage.id)
    .order('position');

  const results: GroupResult[] = [];
  for (const g of (groups ?? [])) {
    const standings = await getGroupStandings(g.id);
    const label = g.name.replace('Group ', '');
    const hasUnresolvedTie = standings.some(s => s.needs_tiebreaker);
    results.push({ label, groupId: g.id, standings, hasUnresolvedTie });
  }
  return results;
}

export interface BestThirdRow {
  group_label: string;
  participant_id: string;
  player_username: string;
  country_name: string;
  points: number;
  goal_diff: number;
  goals_for: number;
  rank: number;
  qualifies: boolean;
}

export function computeBestThirds(groupResults: GroupResult[]): BestThirdRow[] {
  const thirds: BestThirdRow[] = [];
  for (const g of groupResults) {
    const third = g.standings[2];
    if (!third) continue;
    thirds.push({
      group_label: g.label,
      participant_id: third.participant_id,
      player_username: third.player?.username ?? '?',
      country_name: third.country?.name ?? '?',
      points: third.points,
      goal_diff: third.goal_diff,
      goals_for: third.goals_for,
      rank: 0,
      qualifies: false,
    });
  }
  thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_diff !== a.goal_diff) return b.goal_diff - a.goal_diff;
    return b.goals_for - a.goals_for;
  });
  thirds.forEach((t, i) => {
    t.rank = i + 1;
    t.qualifies = i < 8;
  });
  return thirds;
}

export async function bracketExists(tournamentId: string): Promise<boolean> {
  const supabase = createClient();
  const { count } = await supabase
    .from('knockout_seeds')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId);
  return (count ?? 0) > 0;
}

export async function groupStageComplete(tournamentId: string): Promise<{ complete: boolean; pending: number }> {
  const supabase = createClient();
  const { count: pending } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)
    .not('matchday', 'is', null)
    .neq('status', 'completed');
  return { complete: (pending ?? 0) === 0, pending: pending ?? 0 };
}

export async function generateBracket(tournamentId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const supabase = createClient();

  if (await bracketExists(tournamentId)) {
    return { ok: false, reason: 'Bracket already generated' };
  }

  const groupResults = await getAllGroupResults(tournamentId);
  if (groupResults.length !== 12) {
    return { ok: false, reason: `Expected 12 groups, got ${groupResults.length}` };
  }
  if (groupResults.some(g => g.hasUnresolvedTie)) {
    return { ok: false, reason: 'Resolve all group tiebreakers before generating bracket' };
  }

  const seeds: Array<{ seed: number; participantId: string; sourceLabel: string; sourceGroup: string | null; sourcePosition: number | null; isBestThird: boolean }> = [];

  for (let i = 0; i < 12; i++) {
    const g = groupResults[i];
    const winner = g.standings[0];
    if (!winner) return { ok: false, reason: `Group ${g.label} has no winner` };
    seeds.push({
      seed: i + 1,
      participantId: winner.participant_id,
      sourceLabel: `${g.label}1`,
      sourceGroup: g.label,
      sourcePosition: 1,
      isBestThird: false,
    });
  }

  for (let i = 0; i < 12; i++) {
    const g = groupResults[i];
    const second = g.standings[1];
    if (!second) return { ok: false, reason: `Group ${g.label} has no runner-up` };
    seeds.push({
      seed: i + 13,
      participantId: second.participant_id,
      sourceLabel: `${g.label}2`,
      sourceGroup: g.label,
      sourcePosition: 2,
      isBestThird: false,
    });
  }

  const bestThirds = computeBestThirds(groupResults).filter(t => t.qualifies);
  if (bestThirds.length !== 8) {
    return { ok: false, reason: `Expected 8 qualifying thirds, got ${bestThirds.length}` };
  }
  bestThirds.forEach((bt, i) => {
    seeds.push({
      seed: 25 + i,
      participantId: bt.participant_id,
      sourceLabel: `BT${i + 1}`,
      sourceGroup: bt.group_label,
      sourcePosition: 3,
      isBestThird: true,
    });
  });

  const seedRows = seeds.map(s => ({
    tournament_id: tournamentId,
    seed_number: s.seed,
    participant_id: s.participantId,
    source_label: s.sourceLabel,
    source_group: s.sourceGroup,
    source_position: s.sourcePosition,
    is_best_third: s.isBestThird,
  }));
  const { error: seedErr } = await supabase.from('knockout_seeds').insert(seedRows);
  if (seedErr) return { ok: false, reason: `Could not insert seeds: ${seedErr.message}` };

  const { data: stage, error: stageErr } = await supabase
    .from('stages')
    .insert({
      tournament_id: tournamentId,
      stage_number: 2,
      stage_type: 'single_elimination',
      status: 'in_progress',
    })
    .select('id')
    .single();
  if (stageErr || !stage) return { ok: false, reason: `Could not create stage: ${stageErr?.message}` };

  const seedById = new Map<number, string>();
  seeds.forEach(s => seedById.set(s.seed, s.participantId));

  for (let i = 0; i < R32_PAIRINGS.length; i++) {
    const [seedA, seedB] = R32_PAIRINGS[i];
    const homeId = seedById.get(seedA);
    const awayId = seedById.get(seedB);
    if (!homeId || !awayId) {
      return { ok: false, reason: `Missing participant for seed ${seedA} or ${seedB}` };
    }
    await supabase.from('matches').insert({
      tournament_id: tournamentId,
      stage_id: stage.id,
      round: 1,
      match_number_in_round: i + 1,
      home_participant_id: homeId,
      away_participant_id: awayId,
      status: 'awaiting_result',
    });
  }

  const placeholderRounds = [
    { round: 2, count: 8 },
    { round: 3, count: 4 },
    { round: 4, count: 2 },
    { round: 5, count: 1 },
  ];
  for (const r of placeholderRounds) {
    for (let i = 0; i < r.count; i++) {
      await supabase.from('matches').insert({
        tournament_id: tournamentId,
        stage_id: stage.id,
        round: r.round,
        match_number_in_round: i + 1,
        status: 'pending',
      });
    }
  }

  await createFeeders(tournamentId, stage.id);

  return { ok: true };
}

async function createFeeders(tournamentId: string, stageId: string): Promise<void> {
  const supabase = createClient();
  const { data: matches } = await supabase
    .from('matches')
    .select('id, round, match_number_in_round')
    .eq('stage_id', stageId)
    .order('round')
    .order('match_number_in_round');

  if (!matches) return;

  const byRoundAndNum = new Map<string, string>();
  for (const m of matches) {
    byRoundAndNum.set(`${m.round}-${m.match_number_in_round}`, m.id);
  }

  const transitions = [
    { fromRound: 1, toRound: 2 },
    { fromRound: 2, toRound: 3 },
    { fromRound: 3, toRound: 4 },
    { fromRound: 4, toRound: 5 },
  ];
  for (const t of transitions) {
    const fromMatches = matches.filter(m => m.round === t.fromRound);
    for (const fm of fromMatches) {
      const targetNum = Math.ceil(fm.match_number_in_round / 2);
      const targetId = byRoundAndNum.get(`${t.toRound}-${targetNum}`);
      if (!targetId) continue;
      const slot = (fm.match_number_in_round % 2 === 1) ? 'home' : 'away';
      await supabase.from('match_feeders').insert({
        match_id: targetId,
        feeder_match_id: fm.id,
        feeder_type: 'winner',
        target_slot: slot,
      });
    }
  }
}

export async function getBracketView(tournamentId: string) {
  const supabase = createClient();

  const { data: stage } = await supabase
    .from('stages')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('stage_type', 'single_elimination')
    .maybeSingle();

  if (!stage) return null;

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, round, match_number_in_round, status,
      home_score, away_score, home_pens, away_pens, decided_by,
      winner_participant_id,
      home:tournament_participants!matches_home_participant_id_fkey(
        id, player:players(username, display_name),
        country:countries(name, group_label)
      ),
      away:tournament_participants!matches_away_participant_id_fkey(
        id, player:players(username, display_name),
        c
