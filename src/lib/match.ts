// PASS-5-LIB-MATCH
import { createClient } from '@/lib/supabase/server';

/**
 * Find the slug of the most recent in-progress tournament the user
 * is registered in. Powers the "Play" and "Bracket" tabs in the
 * bottom nav. Returns null if the user has no active tournaments.
 */
export async function getActiveTournamentSlug(userId: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tournament_participants')
    .select('tournaments(slug, status)')
    .eq('player_id', userId)
    .eq('status', 'registered');

  if (error || !data) return null;

  for (const row of data) {
    const t = (row as any).tournaments;
    if (t?.status === 'in_progress' && t?.slug) {
      return t.slug as string;
    }
  }
  return null;
}
