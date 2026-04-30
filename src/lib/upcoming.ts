// PASS-24-LIB-UPCOMING
import { createClient } from '@/lib/supabase/server';

export type PlayerMatch = {
  id: string;
  tournamentId: string;
  tournamentName: string;
  tournamentSlug: string;
  matchday: number | null;
  round: number | null;
  status: string;
  iAmHome: boolean;
  myScore: number | null;
  oppScore: number | null;
  myPens: number | null;
  oppPens: number | null;
  decidedBy: string | null;
  winnerIsMe: boolean | null;
  oppCountry: string | null;
  oppUsername: string | null;
  confirmedAt: string | null;
};

const ROUND_LABELS: Record<number, string> = {
  1: 'R32',
  2: 'R16',
  3: 'QF',
  4: 'SF',
  5: 'FINAL',
};

export function roundLabel(round: number | null): string | null {
  if (!round) return null;
  return ROUND_LABELS[round] ?? `R${round}`;
}

export type PlayerMatchesResult = {
  upcoming: PlayerMatch[];
  played: PlayerMatch[];
};

export async function getMatchesForPlayer(userId: string): Promise<PlayerMatchesResult> {
  const supabase = createClient();

 const { data: participations } = await supabase
    .from('tournament_participants')
    .select('id')
    .eq('player_id', userId);

  if (!participations || participations.length === 0) {
    return { upcoming: [], played: [] };
  }

  const myIds = participations.map((p) => p.id);
  const myIdSet = new Set(myIds);
  const idList = myIds.join(',');

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, tournament_id, matchday, round, status,
      home_participant_id, away_participant_id,
      home_score, away_score, home_pens, away_pens,
      decided_by, winner_participant_id, confirmed_at,
      tournament:tournaments(name, slug)
    `)
    .or(`home_participant_id.in.(${idList}),away_participant_id.in.(${idList})`);

  if (!matches || matches.length === 0) {
    return { upcoming: [], played: [] };
  }

  const allPartIds = new Set<string>();
  for (const m of matches) {
    const home = (m as any).home_participant_id;
    const away = (m as any).away_participant_id;
    if (home) allPartIds.add(home);
    if (away) allPartIds.add(away);
  }

  const { data: parts } = await supabase
    .from('tournament_participants')
    .select(`
      id,
      country:countries(name),
      player:players(username, display_name)
    `)
    .in('id', Array.from(allPartIds));

  const partMap = new Map<string, any>();
  for (const p of (parts ?? [])) {
    partMap.set((p as any).id, p);
  }

  const enriched: PlayerMatch[] = matches.map((m: any) => {
    const iAmHome = myIdSet.has(m.home_participant_id);
    const oppId = iAmHome ? m.away_participant_id : m.home_participant_id;
    const oppPart = oppId ? partMap.get(oppId) : null;

    const winnerIsMe =
      m.winner_participant_id == null
        ? null
        : myIdSet.has(m.winner_participant_id);

    return {
      id: m.id,
      tournamentId: m.tournament_id,
      tournamentName: m.tournament?.name ?? 'Tournament',
      tournamentSlug: m.tournament?.slug ?? '',
      matchday: m.matchday ?? null,
      round: m.round ?? null,
      status: m.status,
      iAmHome,
      myScore: iAmHome ? m.home_score : m.away_score,
      oppScore: iAmHome ? m.away_score : m.home_score,
      myPens: iAmHome ? m.home_pens : m.away_pens,
      oppPens: iAmHome ? m.away_pens : m.home_pens,
      decidedBy: m.decided_by,
      winnerIsMe,
      oppCountry: oppPart?.country?.name ?? null,
      oppUsername: oppPart?.player?.username ?? null,
      confirmedAt: m.confirmed_at ?? null,
    };
  });

  const upcoming: PlayerMatch[] = [];
  const played: PlayerMatch[] = [];
  for (const e of enriched) {
    if (e.status === 'completed') {
      played.push(e);
    } else {
      upcoming.push(e);
    }
  }

  upcoming.sort((a, b) => {
    const aIsKO = a.round != null;
    const bIsKO = b.round != null;
    if (aIsKO !== bIsKO) return aIsKO ? 1 : -1;
    if (aIsKO) return (a.round ?? 0) - (b.round ?? 0);
    return (a.matchday ?? 0) - (b.matchday ?? 0);
  });

  played.sort((a, b) => {
    const aTime = a.confirmedAt ? new Date(a.confirmedAt).getTime() : 0;
    const bTime = b.confirmedAt ? new Date(b.confirmedAt).getTime() : 0;
    return bTime - aTime;
  });

  return { upcoming, played };
}
