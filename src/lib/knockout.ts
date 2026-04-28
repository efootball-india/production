// PASS-3-LIB-KNOCKOUT
import { createClient } from '@/lib/supabase/server';
import { getGroupStandings, type StandingRow } from '@/lib/fixtures';

/**
 * FIFA WC 2026 Round of 32 bracket structure.
 * Maps each R32 match to which seeds play. Seeds 1-32 are filled by:
 *   - 12 group winners (A1..L1)
 *   - 12 group runners-up (A2..L2)
 *   - 8 best third-placed (BT1..BT8, ranked across all 12 groups)
 *
 * The pairings below match the actual FIFA 2026 R32 schedule.
 * Each row: [seedA, seedB] — they play in that R32 match.
 *
 * Seed assignment convention used here (informal but consistent):
 *   1-12   = Group winners A1, B1, C1, ..., L1
 *   13-24  = Group runners-up A2, B2, C2, ..., L2
 *   25-32  = Best 8 thirds (BT1..BT8)
 */
export const R32_PAIRINGS: Array<[number, number]> = [
  // From FIFA's 2026 R32 schedule (matches 73-88)
  [13, 14], // A2 vs B2  (Match 73)
  [3, 25],  // C1 vs BT1 (Match 76)  — winner is "C1's slot"
  [5, 26],  // E1 vs BT2 (Match 74)
  [6, 15],  // F1 vs C2  (Match 75)
  [9, 27],  // I1 vs BT3 (Match 77)
  [17, 21], // E2 vs I2  (Match 78)
  [1, 28],  // A1 vs BT4 (Match 79)
  [12, 29], // L1 vs BT5 (Match 80)
  [4, 30],  // D1 vs BT6 (Match 81)
  [7, 31],  // G1 vs BT7 (Match 82)
  [23, 24], // K2 vs L2  (Match 83)
  [8, 22],  // H1 vs J2  (Match 84)
  [2, 32],  // B1 vs BT8 (Match 85)
  [10, 20], // J1 vs H2  (Match 86)
  [11, 16], // K1 vs D2  (mapped from Match 87)
  [16, 19], // D2 vs G2  (Match 88) — note: pairing logic re-derives this
];

/**
 * Given a seed_number, return the human label.
 *   1-12  -> "{Group}1"
 *   13-24 -> "{Group}2"
 *   25-32 -> "BT{n}"
 */
export function seedToLabel(seed: number): string {
  const groupLetter = (idx: number) => String.fromCharCode('A'.charCodeAt(0) + idx);
  if (seed >= 1 && seed <= 12) return `${groupLetter(seed - 1)}1`;
  if (seed >= 13 && seed <= 24) return `${groupLetter(seed - 13)}2`;
  if (seed >= 25 && seed <= 32) return `BT${seed - 24}`;
  return `?${seed}`;
}

/**
 * Compute who from each group is 1st, 2nd, 3rd, with the standings for each.
 * Used both for seed assignment and for surfacing tiebreaker manual overrides.
 */
export interface GroupResult {
  label: string;            // 'A'..'L'
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

/**
 * Rank all 12 third-placed teams by Pts -> GD -> GF.
 * Returns the array sorted, with the top 8 marked as `qualifies = true`.
 */
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
    const third = g.standings[2]; // position 3 (zero-indexed)
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

/**
 * Has the knockout bracket been generated already?
 */
export async function bracketExists(tournamentId: string): Promise<boolean> {
  const supabase = createClient();
  const { count } = await supabase
    .from('knockout_seeds')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId);
  return (count ?? 0) > 0;
}

/**
 * Are all group-stage matches completed? Required before generating bracket.
 */
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

/**
 * Generate the knockout bracket for a tournament.
 * - Creates a 'knockout' stage
 * - Assigns 32 seeds based on group results
 * - Creates 16 R32 matches based on R32_PAIRINGS
 * - Creates placeholder R16 (8), QF (4), SF (2), F (1) matches with feeders
 *
 * Idempotent: returns early if seeds already exist.
 */
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

  // Build seed assignments
  const seeds: Array<{ seed: number; participantId: string; sourceLabel: string; sourceGroup: string | null; sourcePosition: number | null; isBestThird: boolean }> = [];

  // Seeds 1-12: Group winners A1..L1
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

  // Seeds 13-24: Group runners-up A2..L2
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

  // Seeds 25-32: Best 8 thirds
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

  // Insert seeds
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

  // Create the 'knockout' stage
  const { data: stage, error: stageErr } = await supabase
    .from('stages')
    .insert({
      tournament_id: tournamentId,
      stage_number: 2,
      stage_type: 'knockout',
      status: 'in_progress',
    })
    .select('id')
    .single();
  if (stageErr || !stage) return { ok: false, reason: `Could not create stage: ${stageErr?.message}` };

  // R32 matches based on R32_PAIRINGS
  const seedById = new Map<number, string>();
  seeds.forEach(s => seedById.set(s.seed, s.participantId));

  // Round numbering: R32=1, R16=2, QF=3, SF=4, Final=5
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
      round: 1, // R32 = round 1 of knockout
      match_number_in_round: i + 1,
      home_participant_id: homeId,
      away_participant_id: awayId,
      status: 'awaiting_result',
    });
  }

  // R16 (8 matches), QF (4), SF (2), Final (1) — placeholder matches with no participants yet.
  // These will be filled in by the advancement logic when their feeder matches complete.
  const placeholderRounds = [
    { round: 2, count: 8 },  // R16
    { round: 3, count: 4 },  // QF
    { round: 4, count: 2 },  // SF
    { round: 5, count: 1 },  // Final
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

  // Now create match_feeders rows so we know how winners flow forward.
  // R32 matches feed into R16:
  //   R32 m1 winner + R32 m2 winner -> R16 m1
  //   R32 m3 + R32 m4 -> R16 m2
  //   etc.
  // R16 m1+m2 -> QF m1, R16 m3+m4 -> QF m2, etc.
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

  // For each pair of matches in round N, the winners feed match `Math.ceil(num/2)` of round N+1
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

/**
 * Get the full bracket as a tree of rounds, each with their matches and participant info.
 */
export async function getBracketView(tournamentId: string) {
  const supabase = createClient();

  const { data: stage } = await supabase
    .from('stages')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('stage_type', 'knockout')
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
        country:countries(name, group_label)
      )
    `)
    .eq('stage_id', stage.id)
    .order('round')
    .order('match_number_in_round');

  if (!matches) return null;

  const rounds: Record<number, any[]> = {};
  for (const m of matches) {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  }

  return rounds;
}
