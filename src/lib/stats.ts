// PASS-9-LIB-STATS
import { createClient } from '@/lib/supabase/server';

export type PlayerStats = {
  wins: number;
  draws: number;
  losses: number;
};

export async function getPlayerStats(playerId: string): Promise<PlayerStats> {
  const supabase = createClient();

  const { data: participations } = await supabase
    .from('tournament_participants')
    .select('id')
    .eq('player_id', playerId);

  if (!participations || participations.length === 0) {
    return { wins: 0, draws: 0, losses: 0 };
  }

  const participantIds = participations.map((p) => p.id);

  const { data: homeMatches } = await supabase
    .from('matches')
    .select('home_participant_id, away_participant_id, winner_participant_id')
    .eq('status', 'completed')
    .in('home_participant_id', participantIds);

  const { data: awayMatches } = await supabase
    .from('matches')
    .select('home_participant_id, away_participant_id, winner_participant_id')
    .eq('status', 'completed')
    .in('away_participant_id', participantIds);

  const allMatches = [...(homeMatches ?? []), ...(awayMatches ?? [])];

  const seen = new Set<string>();
  const uniqueMatches = allMatches.filter((m) => {
    const key = `${m.home_participant_id}-${m.away_participant_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let wins = 0;
  let draws = 0;
  let losses = 0;

  for (const m of uniqueMatches) {
    if (!m.winner_participant_id) {
      draws++;
    } else if (participantIds.includes(m.winner_participant_id)) {
      wins++;
    } else {
      losses++;
    }
  }

  return { wins, draws, losses };
}
