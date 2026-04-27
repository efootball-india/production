import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type Platform =
  | 'ps5' | 'ps4'
  | 'xbox_series' | 'xbox_one'
  | 'pc_steam' | 'pc_epic'
  | 'mobile_ios' | 'mobile_android';

export type PlayerRole = 'player' | 'moderator' | 'admin' | 'super_admin';

export interface Player {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  platform: Platform | null;
  region: string | null;
  timezone: string | null;
  game_id: string | null;
  discord_handle: string | null;
  role: PlayerRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch the current authenticated user's player record.
 * Returns null if not signed in or if the player row doesn't exist yet
 * (e.g. user signed up but didn't complete onboarding).
 */
export async function getCurrentPlayer(): Promise<Player | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('players')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return (data as Player) ?? null;
}

/**
 * Require an authenticated user with a player record. Used at the top
 * of pages that should never be reached without auth.
 *
 * - Not signed in → /signin
 * - Signed in but no player row → /onboarding
 * - Signed in with player row but profile incomplete → /profile/edit
 */
export async function requireCompleteProfile(): Promise<Player> {
  const player = await getCurrentPlayer();
  if (!player) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/signin');
    redirect('/onboarding');
  }
  if (!isProfileComplete(player)) {
    redirect('/profile/edit?incomplete=1');
  }
  return player;
}

/**
 * A profile is "complete enough to register for tournaments" when it has
 * the fields opponents need to actually find each other and play:
 *   - username (always present once row exists)
 *   - display_name (always present)
 *   - platform (so opponents know what console)
 *   - game_id (so opponents can add them in-game)
 *   - discord_handle (so opponents can coordinate scheduling)
 */
export function isProfileComplete(player: Player): boolean {
  return Boolean(
    player.username &&
    player.display_name &&
    player.platform &&
    player.game_id &&
    player.discord_handle
  );
}

/**
 * Human-friendly platform labels for UI.
 */
export const PLATFORM_LABELS: Record<Platform, string> = {
  ps5: 'PlayStation 5',
  ps4: 'PlayStation 4',
  xbox_series: 'Xbox Series X/S',
  xbox_one: 'Xbox One',
  pc_steam: 'PC · Steam',
  pc_epic: 'PC · Epic Games',
  mobile_ios: 'Mobile · iOS',
  mobile_android: 'Mobile · Android',
};

export const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: 'ps5',            label: 'PlayStation 5' },
  { value: 'ps4',            label: 'PlayStation 4' },
  { value: 'xbox_series',    label: 'Xbox Series X/S' },
  { value: 'xbox_one',       label: 'Xbox One' },
  { value: 'pc_steam',       label: 'PC · Steam' },
  { value: 'pc_epic',        label: 'PC · Epic Games' },
  { value: 'mobile_android', label: 'Mobile · Android' },
  { value: 'mobile_ios',     label: 'Mobile · iOS' },
];
