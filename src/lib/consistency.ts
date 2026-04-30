import { createClient } from '@/lib/supabase/server';

// ─── TIER THRESHOLDS ────────────────────────────────────────────────
export type Tier = 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'unranked';

export const TIER_THRESHOLDS: Array<{ tier: Tier; min: number; label: string }> = [
  { tier: 'diamond', min: 1500, label: 'DIAMOND' },
  { tier: 'platinum', min: 1000, label: 'PLATINUM' },
  { tier: 'gold', min: 600, label: 'GOLD' },
  { tier: 'silver', min: 300, label: 'SILVER' },
  { tier: 'bronze', min: 100, label: 'BRONZE' },
  { tier: 'unranked', min: 0, label: 'UNRANKED' },
];

export function tierForPoints(points: number): Tier {
  for (const t of TIER_THRESHOLDS) {
    if (points >= t.min) return t.tier;
  }
  return 'unranked';
}

export function pointsToNextTier(points: number): { next: Tier | null; needed: number } {
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points < TIER_THRESHOLDS[i].min) {
      return { next: TIER_THRESHOLDS[i].tier, needed: TIER_THRESHOLDS[i].min - points };
    }
  }
  return { next: null, needed: 0 };
}

// ─── POINT VALUES ──────────────────────────────────────────────────
export const POINTS = {
  WIN: 50,
  DRAW: 25,
  LOSS: 10,
  WALKOVER_WIN: 50,
  WALKOVER_LOSS: 0,
  TOURNAMENT_WINNER: 150,
  TOURNAMENT_RUNNER_UP: 100,
  TOURNAMENT_SEMIFINALIST: 75,
};

// ─── SEASON WINDOW ─────────────────────────────────────────────────
/**
 * Returns the [start, end] dates of the season containing the given date.
 * Seasons run May 1 → April 30.
 */
export function seasonWindow(forDate: Date = new Date()): { start: Date; end: Date; label: string } {
  const year = forDate.getFullYear();
  const month = forDate.getMonth(); // 0-indexed
  const seasonStartYear = month >= 4 ? year : year - 1; // May = month 4
  const start = new Date(Date.UTC(seasonStartYear, 4, 1, 0, 0, 0));
  const end = new Date(Date.UTC(seasonStartYear + 1, 3, 30, 23, 59, 59));
  const label = `${String(seasonStartYear).slice(2)}-${String(seasonStartYear + 1).slice(2)}`;
  return { start, end, label };
}

// ─── RANKING TYPES ─────────────────────────────────────────────────
export type ConsistencyEntry = {
  playerId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  rank: number;
  points: number;
  tier: Tier;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  tournamentsPlayed: number;
  championships: number;
};

// ─── MAIN COMPUTATION ──────────────────────────────────────────────
export async function getConsistencyRanking(): Promise<ConsistencyEntry[]> {
  const supabase = createClient();
  const { start, end } = seasonWindow();

  // Get all players
  const { data: players } = await supabase
    .from('players')
    .select('id, username, display_name, avatar_url');
  if (!players) return [];

  // Get all completed/walkover matches in the season
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, status, decided_by,
      home_score, away_score,
      home_participant_id, away_participant_id, winner_participant_id,
      tournament_id, confirmed_at,
      tournaments!inner(status)
    `)
    .in('status', ['completed', 'walkover'])
    .gte('confirmed_at', start.toISOString())
    .lte('confirmed_at', end.toISOString())
    .neq('tournaments.status', 'cancelled');

  // Get participant → player_id map for these matches
  const participantIds = new Set<string>();
  for (const m of matches ?? []) {
    if (m.home_participant_id) participantIds.add(m.home_participant_id);
    if (m.away_participant_id) participantIds.add(m.away_participant_id);
  }

  const { data: participants } = participantIds.size > 0
    ? await supabase
        .from('tournament_participants')
        .select('id, player_id, tournament_id, placement')
        .in('id', Array.from(participantIds))
    : { data: [] };

  const participantToPlayer = new Map<string, string>();
  const participantToTournament = new Map<string, string>();
  const participantPlacement = new Map<string, string | null>();
  for (const p of participants ?? []) {
    participantToPlayer.set(p.id, p.player_id);
    participantToTournament.set(p.id, p.tournament_id);
    participantPlacement.set(p.id, p.placement);
  }

  // Initialize per-player tally
  type Tally = {
    points: number;
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    tournaments: Set<string>;
    championships: number;
  };
  const tallies = new Map<string, Tally>();
  for (const p of players) {
    tallies.set(p.id, {
      points: 0,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      tournaments: new Set<string>(),
      championships: 0,
    });
  }

  // Process matches
  for (const m of matches ?? []) {
    const homePlayer = m.home_participant_id ? participantToPlayer.get(m.home_participant_id) : null;
    const awayPlayer = m.away_participant_id ? participantToPlayer.get(m.away_participant_id) : null;
    const isWalkover = m.status === 'walkover' || m.decided_by === 'walkover';
    const tournamentId = m.tournament_id;

    if (homePlayer) {
      const t = tallies.get(homePlayer)!;
      t.matches++;
      t.tournaments.add(tournamentId);
      const won = m.winner_participant_id === m.home_participant_id;
      const drew = m.winner_participant_id === null;

      if (won) {
        t.wins++;
        t.points += isWalkover ? POINTS.WALKOVER_WIN : POINTS.WIN;
      } else if (drew) {
        t.draws++;
        t.points += POINTS.DRAW;
      } else {
        t.losses++;
        t.points += isWalkover ? POINTS.WALKOVER_LOSS : POINTS.LOSS;
      }
    }

    if (awayPlayer) {
      const t = tallies.get(awayPlayer)!;
      t.matches++;
      t.tournaments.add(tournamentId);
      const won = m.winner_participant_id === m.away_participant_id;
      const drew = m.winner_participant_id === null;

      if (won) {
        t.wins++;
        t.points += isWalkover ? POINTS.WALKOVER_WIN : POINTS.WIN;
      } else if (drew) {
        t.draws++;
        t.points += POINTS.DRAW;
      } else {
        t.losses++;
        t.points += isWalkover ? POINTS.WALKOVER_LOSS : POINTS.LOSS;
      }
    }
  }

  // Add tournament bonuses by walking participant placements
  for (const p of participants ?? []) {
    if (!p.placement || !p.player_id) continue;
    const t = tallies.get(p.player_id);
    if (!t) continue;
    if (p.placement === 'winner') {
      t.points += POINTS.TOURNAMENT_WINNER;
      t.championships++;
    } else if (p.placement === 'runner_up') {
      t.points += POINTS.TOURNAMENT_RUNNER_UP;
    } else if (p.placement === 'semifinalist') {
      t.points += POINTS.TOURNAMENT_SEMIFINALIST;
    }
  }

  // Build entries, sort, and rank
  const entries: ConsistencyEntry[] = players.map((p) => {
    const t = tallies.get(p.id)!;
    return {
      playerId: p.id,
      username: p.username,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
      rank: 0, // assigned after sort
      points: t.points,
      tier: tierForPoints(t.points),
      matches: t.matches,
      wins: t.wins,
      draws: t.draws,
      losses: t.losses,
      tournamentsPlayed: t.tournaments.size,
      championships: t.championships,
    };
  });

  // Sort by points DESC, then matches DESC (tiebreaker: more active player ranks higher)
  entries.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.matches - a.matches;
  });

  // Assign ranks (with tied-rank handling: same points = same rank)
  let lastPoints = -1;
  let lastRank = 0;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.points !== lastPoints) {
      lastRank = i + 1;
      lastPoints = e.points;
    }
    e.rank = lastRank;
  }

  return entries;
}

// ─── HELPER: Single player lookup ──────────────────────────────────
export async function getPlayerConsistency(playerId: string): Promise<ConsistencyEntry | null> {
  const all = await getConsistencyRanking();
  return all.find((e) => e.playerId === playerId) ?? null;
}
