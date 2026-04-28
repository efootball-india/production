import { createClient } from '@/lib/supabase/server';

export type TournamentStatus =
  | 'draft' | 'registration_open' | 'registration_closed'
  | 'in_progress' | 'completed' | 'cancelled';

export type TournamentFormat =
  | 'single_elimination' | 'double_elimination' | 'round_robin'
  | 'groups_knockout' | 'swiss' | 'free_for_all';

export interface Tournament {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  max_participants: number | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  settings: Record<string, unknown>;
  winner_id: string | null;
  created_at: string;
}

export interface TournamentWithCount extends Tournament {
  participant_count: number;
}

/**
 * List all tournaments, newest first, with participant counts.
 */
export async function listTournaments(): Promise<TournamentWithCount[]> {
  const supabase = createClient();
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });

  if (!tournaments) return [];

  // Fetch counts in one query — group by tournament_id
  const { data: counts } = await supabase
    .from('tournament_participants')
    .select('tournament_id');

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    countMap.set(row.tournament_id, (countMap.get(row.tournament_id) ?? 0) + 1);
  }

  return tournaments.map((t: Tournament) => ({
    ...t,
    participant_count: countMap.get(t.id) ?? 0,
  }));
}

/**
 * Fetch one tournament by slug, with participants joined to player records.
 * Returns null if not found.
 */
export async function getTournamentBySlug(slug: string) {
  const supabase = createClient();
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!tournament) return null;

  const { data: participants } = await supabase
    .from('tournament_participants')
    .select(`
      id,
      status,
      registered_at,
      seed,
      player:players (
        id,
        username,
        display_name,
        platform,
        region
      )
    `)
    .eq('tournament_id', tournament.id)
    .order('registered_at', { ascending: true });

  return {
    tournament: tournament as Tournament,
    participants: participants ?? [],
  };
}

/**
 * Has the current user already registered for a tournament?
 */
export async function isCurrentUserRegistered(tournamentId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('tournament_participants')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('player_id', user.id)
    .maybeSingle();

  return Boolean(data);
}

/**
 * Generate a URL-safe slug from a tournament name.
 * 'Summer Cup S4' -> 'summer-cup-s4'
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const FORMAT_LABELS: Record<TournamentFormat, string> = {
  groups_knockout:     'Groups + Knockout (FIFA WC)',
  single_elimination:  'Single elimination',
  double_elimination:  'Double elimination',
  round_robin:         'Round robin',
  swiss:               'Swiss',
  free_for_all:        'Free for all',
};

export const STATUS_LABELS: Record<TournamentStatus, string> = {
  draft:                'Draft',
  registration_open:    'Registration open',
  registration_closed:  'Registration closed',
  in_progress:          'In progress',
  completed:            'Completed',
  cancelled:            'Cancelled',
};
