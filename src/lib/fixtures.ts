// PASS-2-LIB-FIXTURES
import { createClient } from '@/lib/supabase/server';

export type MatchStatus =
  | 'pending' | 'scheduled' | 'awaiting_result' | 'awaiting_confirmation'
  | 'disputed' | 'completed' | 'walkover';

export interface Match {
  id: string;
  tournament_id: string;
  group_id: string | null;
  matchday: number | null;
  round: number;
  match_number_in_round: number;
  home_participant_id: string | null;
  away_participant_id: string | null;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  scheduled_at: string | null;
  deadline_at: string | null;
  reported_by: string | null;
  reported_at: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
}

/**
 * The pairing pattern used by FIFA WC 2026 group stage.
 * For positions 1, 2, 3, 4 in each group:
 *   MD1: 1v2, 3v4
 *   MD2: 1v3, 2v4
 *   MD3: 1v4, 2v3
 */
export const FIXTURE_PATTERN: Array<{ md: number; home: number; away: number }> = [
  { md: 1, home: 1, away: 2 },
  { md: 1, home: 3, away: 4 },
  { md: 2, home: 1, away: 3 },
  { md: 2, home: 2, away: 4 },
  { md: 3, home: 1, away: 4 },
  { md: 3, home: 2, away: 3 },
];

/**
 * Have group-stage matches been generated for this tournament yet?
 */
export async function fixturesExist(tournamentId: string): Promise<boolean> {
  const supabase = createClient();
  const { count } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId)
    .not('matchday', 'is', null);
  return (count ?? 0) > 0;
}

/**
 * Find the participant currently assigned to country at (group_label, position).
 */
async function getParticipantByCountrySlot(
  tournamentId: string,
  groupLabel: string,
  position: number
): Promise<string | null> {
  const supabase = createClient();
  const { data: country } = await supabase
    .from('countries')
    .select('id')
    .eq('group_label', groupLabel)
    .eq('position', position)
    .maybeSingle();
  if (!country) return null;

  const { data: participant } = await supabase
    .from('tournament_participants')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('country_id', country.id)
    .maybeSingle();
  return participant?.id ?? null;
}

/**
 * For each group (A-L), ensure a stage + group row exists, then generate
 * the 6 fixtures using the FIFA pairing pattern. Returns the count generated.
 *
 * Idempotent: skips groups that already have matches.
 */
export async function generateGroupFixtures(tournamentId: string): Promise<{ created: number; skipped: number }> {
  const supabase = createClient();

  // 1. Ensure a "groups" stage exists
  let { data: stage } = await supabase
    .from('stages')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('stage_type', 'groups')
    .maybeSingle();

  if (!stage) {
    const { data: newStage } = await supabase
      .from('stages')
      .insert({
        tournament_id: tournamentId,
        stage_number: 1,
        stage_type: 'groups',
        status: 'in_progress',
      })
      .select('id')
      .single();
    stage = newStage;
  }
  if (!stage) throw new Error('Could not create groups stage');
  const stageId = stage.id;

  let created = 0;
  let skipped = 0;

  const groupLabels = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  for (let gi = 0; gi < groupLabels.length; gi++) {
    const label = groupLabels[gi];

    // Ensure group row exists
    let { data: group } = await supabase
      .from('groups')
      .select('id')
      .eq('stage_id', stageId)
      .eq('name', `Group ${label}`)
      .maybeSingle();

    if (!group) {
      const { data: newGroup } = await supabase
        .from('groups')
        .insert({
          stage_id: stageId,
          name: `Group ${label}`,
          position: gi + 1,
        })
        .select('id')
        .single();
      group = newGroup;
    }
    if (!group) continue;

    // Get participant ids for positions 1-4 in this group
    const participants: (string | null)[] = [null, null, null, null];
    for (let pos = 1; pos <= 4; pos++) {
      participants[pos - 1] = await getParticipantByCountrySlot(tournamentId, label, pos);
    }

    // Ensure group_members rows exist for each non-null participant
    for (let pos = 1; pos <= 4; pos++) {
      const pid = participants[pos - 1];
      if (!pid) continue;
      const { data: existing } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('participant_id', pid)
        .maybeSingle();
      if (!existing) {
        await supabase.from('group_members').insert({
          group_id: group.id,
          participant_id: pid,
        });
      }
    }

    // Check if fixtures already exist for this group
    const { count: existingCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id);
    if ((existingCount ?? 0) > 0) {
      skipped += FIXTURE_PATTERN.length;
      continue;
    }

    // Generate the 6 matches
    for (let mi = 0; mi < FIXTURE_PATTERN.length; mi++) {
      const fp = FIXTURE_PATTERN[mi];
      const homePid = participants[fp.home - 1];
      const awayPid = participants[fp.away - 1];

      // If either slot is empty (incomplete draw), still create the match,
      // it'll just have null participants until the slot is filled.
      const matchNumberInRound = mi + 1;

      await supabase.from('matches').insert({
        tournament_id: tournamentId,
        stage_id: stageId,
        group_id: group.id,
        round: fp.md,
        matchday: fp.md,
        match_number_in_round: matchNumberInRound,
        home_participant_id: homePid,
        away_participant_id: awayPid,
        status: (homePid && awayPid) ? 'awaiting_result' : 'pending',
      });
      created++;
    }
  }

  return { created, skipped };
}

/**
 * For a given participant, fetch their group fixtures with opponent info.
 */
export async function getParticipantFixtures(participantId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('matches')
    .select(`
      id, matchday, status, home_score, away_score, deadline_at,
      home_participant_id, away_participant_id,
      home:tournament_participants!matches_home_participant_id_fkey(
        id, player_id,
        player:players(id, username, display_name, discord_handle, platform, game_id),
        country:countries(name, group_label)
      ),
      away:tournament_participants!matches_away_participant_id_fkey(
        id, player_id,
        player:players(id, username, display_name, discord_handle, platform, game_id),
        country:countries(name, group_label)
      )
    `)
    .or(`home_participant_id.eq.${participantId},away_participant_id.eq.${participantId}`)
    .not('matchday', 'is', null)
    .order('matchday')
    .order('match_number_in_round');
  return data ?? [];
}

/**
 * Group standings calculator. Given a group_id, computes W/D/L/GF/GA/GD/Pts
 * for each member by walking the matches, then sorts by tiebreaker chain:
 *   1. Points
 *   2. Goal difference
 *   3. Goals for
 *   4. Head-to-head result
 * Ties beyond that are flagged (caller can show admin a "needs tiebreaker match" prompt).
 */
export interface StandingRow {
  participant_id: string;
  player: { username: string; display_name: string } | null;
  country: { name: string; group_label: string } | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  position: number;        // 1-4 after sorting
  needs_tiebreaker: boolean; // true if this row is in an unresolved tie
}

export async function getGroupStandings(groupId: string): Promise<StandingRow[]> {
  const supabase = createClient();

  const { data: members } = await supabase
    .from('group_members')
    .select(`
      participant:tournament_participants(
        id,
        player:players(username, display_name),
        country:countries(name, group_label)
      )
    `)
    .eq('group_id', groupId);

  const { data: matches } = await supabase
    .from('matches')
    .select('home_participant_id, away_participant_id, home_score, away_score, status')
    .eq('group_id', groupId)
    .in('status', ['completed', 'walkover']);

  const rows = new Map<string, StandingRow>();
  for (const m of (members ?? [])) {
    const p: any = (m as any).participant;
    if (!p) continue;
    rows.set(p.id, {
      participant_id: p.id,
      player: p.player ?? null,
      country: p.country ?? null,
      played: 0, wins: 0, draws: 0, losses: 0,
      goals_for: 0, goals_against: 0, goal_diff: 0, points: 0,
      position: 0, needs_tiebreaker: false,
    });
  }

  for (const m of (matches ?? [])) {
    if (m.home_score == null || m.away_score == null) continue;
    if (!m.home_participant_id || !m.away_participant_id) continue;
    const h = rows.get(m.home_participant_id);
    const a = rows.get(m.away_participant_id);
    if (!h || !a) continue;

    h.played++; a.played++;
    h.goals_for += m.home_score; h.goals_against += m.away_score;
    a.goals_for += m.away_score; a.goals_against += m.home_score;

    if (m.home_score > m.away_score) { h.wins++; h.points += 3; a.losses++; }
    else if (m.home_score < m.away_score) { a.wins++; a.points += 3; h.losses++; }
    else { h.draws++; a.draws++; h.points++; a.points++; }
  }

  const arr = Array.from(rows.values()).map(r => ({
    ...r, goal_diff: r.goals_for - r.goals_against,
  }));

  // Sort: points desc, GD desc, GF desc
  // Then for any ties remaining, check head-to-head
  arr.sort((x, y) => {
    if (y.points !== x.points) return y.points - x.points;
    if (y.goal_diff !== x.goal_diff) return y.goal_diff - x.goal_diff;
    if (y.goals_for !== x.goals_for) return y.goals_for - x.goals_for;
    return 0; // tie remains, marked below
  });

  // Apply head-to-head as a tiebreaker between adjacent ties
  for (let i = 0; i < arr.length - 1; i++) {
    if (
      arr[i].points === arr[i + 1].points &&
      arr[i].goal_diff === arr[i + 1].goal_diff &&
      arr[i].goals_for === arr[i + 1].goals_for
    ) {
      const h2h = (matches ?? []).find(m =>
        (m.home_participant_id === arr[i].participant_id && m.away_participant_id === arr[i + 1].participant_id) ||
        (m.home_participant_id === arr[i + 1].participant_id && m.away_participant_id === arr[i].participant_id)
      );
      if (h2h && h2h.home_score != null && h2h.away_score != null && h2h.home_score !== h2h.away_score) {
        const winnerIsI = (h2h.home_participant_id === arr[i].participant_id && h2h.home_score > h2h.away_score) ||
                          (h2h.away_participant_id === arr[i].participant_id && h2h.away_score > h2h.home_score);
        if (!winnerIsI) {
          // Swap them
          [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        }
      } else {
        // Still tied after H2H — flag both
        arr[i].needs_tiebreaker = true;
        arr[i + 1].needs_tiebreaker = true;
      }
    }
  }

  arr.forEach((r, i) => { r.position = i + 1; });
  return arr;
}
