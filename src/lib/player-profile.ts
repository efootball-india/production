import { createClient } from '@/lib/supabase/server';

export type MatchHistoryEntry = {
  matchId: string;
  tournamentId: string;
  tournamentName: string;
  tournamentSlug: string;
  stage: string;
  myScore: number | null;
  oppScore: number | null;
  myPens: number | null;
  oppPens: number | null;
  oppCountry: string | null;
  oppUsername: string | null;
  oppDisplayName: string | null;
  decidedBy: string | null;
  result: 'won' | 'lost' | 'drew';
  status: string;
  confirmedAt: string | null;
};

export type TournamentEntry = {
  tournamentId: string;
  name: string;
  slug: string;
  status: string;
  placement: 'winner' | 'runner_up' | 'semifinalist' | null;
  startsAt: string | null;
};

export type HeadToHeadResult = {
  matches: number;
  myWins: number;
  draws: number;
  oppWins: number;
};

// ─── MATCH HISTORY ──────────────────────────────────────────────────
export async function getMatchHistory(
  playerId: string,
  limit: number = 10
): Promise<MatchHistoryEntry[]> {
  const supabase = createClient();

  // Find this player's participations
  const { data: parts } = await supabase
    .from('tournament_participants')
    .select('id, tournament_id')
    .eq('player_id', playerId);
  const myParticipantIds = new Set((parts ?? []).map((p) => p.id));
  if (myParticipantIds.size === 0) return [];

  // Get all completed/walkover matches where this player participated
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, status, decided_by,
      home_score, away_score, home_pens, away_pens,
      matchday, round, confirmed_at,
      home_participant_id, away_participant_id, winner_participant_id,
      tournament:tournaments(id, name, slug),
      home:tournament_participants!matches_home_participant_id_fkey(
        id, country:countries(name), player:players(username, display_name)
      ),
      away:tournament_participants!matches_away_participant_id_fkey(
        id, country:countries(name), player:players(username, display_name)
      )
    `)
    .in('status', ['completed', 'walkover'])
    .or(
      `home_participant_id.in.(${Array.from(myParticipantIds).join(',')}),away_participant_id.in.(${Array.from(myParticipantIds).join(',')})`
    )
    .order('confirmed_at', { ascending: false })
    .limit(limit);

  const ROUND_LABELS: Record<number, string> = {
    1: 'R32', 2: 'R16', 3: 'QF', 4: 'SF', 5: 'F',
  };

  const entries: MatchHistoryEntry[] = [];
  for (const m of matches ?? []) {
    const isHome = myParticipantIds.has((m as any).home_participant_id);
    const myParticipant: any = isHome ? m.home : m.away;
    const oppParticipant: any = isHome ? m.away : m.home;
    const myScore = isHome ? m.home_score : m.away_score;
    const oppScore = isHome ? m.away_score : m.home_score;
    const myPens = isHome ? m.home_pens : m.away_pens;
    const oppPens = isHome ? m.away_pens : m.home_pens;
    const winnerId = m.winner_participant_id;

    let result: 'won' | 'lost' | 'drew' = 'drew';
    if (winnerId && myParticipant?.id && winnerId === myParticipant.id) result = 'won';
    else if (winnerId && oppParticipant?.id && winnerId === oppParticipant.id) result = 'lost';

    const stage = m.matchday != null
      ? `MD ${m.matchday}`
      : m.round != null
      ? ROUND_LABELS[m.round] ?? `R${m.round}`
      : '';

    const tournament: any = m.tournament;
    if (!tournament) continue;

    entries.push({
      matchId: m.id,
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      tournamentSlug: tournament.slug,
      stage,
      myScore,
      oppScore,
      myPens,
      oppPens,
      oppCountry: oppParticipant?.country?.name ?? null,
      oppUsername: oppParticipant?.player?.username ?? null,
      oppDisplayName: oppParticipant?.player?.display_name ?? null,
      decidedBy: m.decided_by,
      result,
      status: m.status,
      confirmedAt: m.confirmed_at,
    });
  }

  return entries;
}

// ─── TOURNAMENTS LIST ───────────────────────────────────────────────
export async function getTournamentsForPlayer(
  playerId: string
): Promise<TournamentEntry[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('tournament_participants')
    .select(`
      placement, tournament_id,
      tournament:tournaments(id, name, slug, status, starts_at)
    `)
    .eq('player_id', playerId);

  const entries: TournamentEntry[] = [];
  for (const row of data ?? []) {
    const t: any = row.tournament;
    if (!t) continue;
    if (t.status === 'cancelled') continue;
    entries.push({
      tournamentId: t.id,
      name: t.name,
      slug: t.slug,
      status: t.status,
      placement: (row.placement as any) ?? null,
      startsAt: t.starts_at,
    });
  }

  // Sort: champions first, then in_progress, then completed, then by start date
  entries.sort((a, b) => {
    const aWon = a.placement === 'winner' ? 1 : 0;
    const bWon = b.placement === 'winner' ? 1 : 0;
    if (aWon !== bWon) return bWon - aWon;
    if (a.status !== b.status) {
      const order = { in_progress: 0, registration_closed: 1, registration_open: 2, completed: 3 };
      return (order[a.status as keyof typeof order] ?? 4) - (order[b.status as keyof typeof order] ?? 4);
    }
    if (a.startsAt && b.startsAt) return b.startsAt.localeCompare(a.startsAt);
    return 0;
  });

  return entries;
}

// ─── HEAD TO HEAD ───────────────────────────────────────────────────
export async function getHeadToHead(
  playerId: string,
  otherPlayerId: string
): Promise<HeadToHeadResult> {
  const supabase = createClient();

  // Get participations for both players
  const { data: myParts } = await supabase
    .from('tournament_participants')
    .select('id, tournament_id')
    .eq('player_id', playerId);
  const { data: oppParts } = await supabase
    .from('tournament_participants')
    .select('id, tournament_id')
    .eq('player_id', otherPlayerId);

  const myIds = new Set((myParts ?? []).map((p) => p.id));
  const oppIds = new Set((oppParts ?? []).map((p) => p.id));

  if (myIds.size === 0 || oppIds.size === 0) {
    return { matches: 0, myWins: 0, draws: 0, oppWins: 0 };
  }

  const { data: matches } = await supabase
    .from('matches')
    .select('home_participant_id, away_participant_id, winner_participant_id, status')
    .in('status', ['completed', 'walkover']);

  let total = 0, myWins = 0, draws = 0, oppWins = 0;
  for (const m of matches ?? []) {
    const homeId = m.home_participant_id;
    const awayId = m.away_participant_id;
    const meHome = homeId && myIds.has(homeId);
    const meAway = awayId && myIds.has(awayId);
    const oppHome = homeId && oppIds.has(homeId);
    const oppAway = awayId && oppIds.has(awayId);

    const isMatchup =
      (meHome && oppAway) || (meAway && oppHome);
    if (!isMatchup) continue;

    total++;
    const myParticipantId = meHome ? homeId : awayId;
    if (m.winner_participant_id === myParticipantId) myWins++;
    else if (m.winner_participant_id === null) draws++;
    else oppWins++;
  }

  return { matches: total, myWins, draws, oppWins };
}
