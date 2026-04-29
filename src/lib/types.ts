// PASS-23-LIB-MATCH
import { createClient } from '@/lib/supabase/server';

/**
 * Find the slug of the most "current" tournament the user is in.
 * Priority: in_progress > registration_closed > registration_open.
 * Returns null only if the user has no registered participation at all.
 *
 * Powers the "Play" and "Bracket" tabs in the bottom nav and the
 * "My matches" link in the header. Each destination handles each
 * tournament status appropriately:
 *   - /play/[slug] shows fixtures or "Waiting for draw"
 *   - /tournaments/[slug]/bracket shows the bracket or "Not generated yet"
 */
export async function getActiveTournamentSlug(userId: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('tournament_participants')
    .select('tournaments(slug, status)')
    .eq('player_id', userId)
    .eq('status', 'registered');

  if (!data || data.length === 0) return null;

  const tournaments = data
    .map((r: any) => r.tournaments)
    .filter((t: any) => t && t.slug);

  const priority = ['in_progress', 'registration_closed', 'registration_open'];
  for (const status of priority) {
    const found = tournaments.find((t: any) => t.status === status);
    if (found) return found.slug as string;
  }

  return null;
}
