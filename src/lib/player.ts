import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { createHash } from 'crypto';

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
  security_question: string | null;
  security_answer_hash: string | null;
  created_at: string;
  updated_at: string;
}

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

export function isProfileComplete(player: Player): boolean {
  return Boolean(player.username && player.display_name && player.platform);
}

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

/**
 * Predefined security questions. Users pick one when signing up via
 * username/password. If they forget their password, they answer this
 * question to reset.
 */
export const SECURITY_QUESTIONS: string[] = [
  'What is your favorite real-life football club?',
  'Who is your eFootball go-to striker?',
  'What was your first FIFA or PES game?',
  'What console do you play eFootball on?',
  'What is your favorite international team?',
  'Who is your all-time favorite footballer?',
];

/**
 * Hash a security answer for storage / comparison.
 * Lowercased and trimmed before hashing for forgiving matching.
 */
export function hashSecurityAnswer(answer: string): string {
  const normalized = answer.trim().toLowerCase();
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Verify a plaintext answer matches a stored hash.
 */
export function verifySecurityAnswer(plain: string, storedHash: string): boolean {
  if (!storedHash) return false;
  return hashSecurityAnswer(plain) === storedHash;
}
