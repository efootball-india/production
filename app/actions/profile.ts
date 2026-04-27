'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Platform } from '@/lib/player';

const VALID_PLATFORMS: Platform[] = [
  'ps5', 'ps4',
  'xbox_series', 'xbox_one',
  'pc_steam', 'pc_epic',
  'mobile_ios', 'mobile_android',
];

interface SaveProfileResult {
  ok: boolean;
  error?: string;
}

/**
 * Validate and upsert the current user's player profile.
 * Used by both /onboarding (initial) and /profile/edit (updates).
 *
 * Validation is intentionally strict — these fields drive whether a player
 * can register for a tournament, so we reject ambiguous data here rather
 * than letting it through and failing later.
 */
async function saveProfile(formData: FormData): Promise<SaveProfileResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in' };

  const username        = (formData.get('username') as string ?? '').trim();
  const display_name    = (formData.get('display_name') as string ?? '').trim() || username;
  const platform        = (formData.get('platform') as string ?? '').trim();
  const game_id         = (formData.get('game_id') as string ?? '').trim();
  const discord_handle  = (formData.get('discord_handle') as string ?? '').trim();
  const region_raw      = (formData.get('region') as string ?? '').trim().toUpperCase();
  const region          = region_raw || null;
  const bio             = (formData.get('bio') as string ?? '').trim() || null;

  // ----- Validation -----

  if (!username) {
    return { ok: false, error: 'Username is required' };
  }
  if (username.length < 3 || username.length > 24) {
    return { ok: false, error: 'Username must be 3–24 characters' };
  }
  if (!/^[A-Za-z0-9_]+$/.test(username)) {
    return { ok: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  if (display_name.length > 48) {
    return { ok: false, error: 'Display name is too long (max 48)' };
  }
  if (platform && !VALID_PLATFORMS.includes(platform as Platform)) {
    return { ok: false, error: 'Invalid platform' };
  }
  if (game_id && (game_id.length < 4 || game_id.length > 32)) {
    return { ok: false, error: 'Game ID must be 4–32 characters' };
  }
  if (discord_handle && (discord_handle.length < 2 || discord_handle.length > 32 || /\s/.test(discord_handle))) {
    return { ok: false, error: 'Discord handle must be 2–32 characters with no spaces' };
  }
  if (region && !/^[A-Z]{2}$/.test(region)) {
    return { ok: false, error: 'Region must be a 2-letter country code (e.g. IN, BR)' };
  }
  if (bio && bio.length > 280) {
    return { ok: false, error: 'Bio is too long (max 280)' };
  }

  // ----- Upsert -----

  const { error } = await supabase.from('players').upsert({
    id: user.id,
    username,
    display_name,
    platform: (platform || null) as Platform | null,
    game_id: game_id || null,
    discord_handle: discord_handle || null,
    region,
    bio,
  });

  if (error) {
    // Most common: username unique violation
    if (error.code === '23505') {
      return { ok: false, error: 'That username is already taken' };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/**
 * Onboarding flow: save profile, then send to home.
 */
export async function completeOnboarding(formData: FormData) {
  const result = await saveProfile(formData);
  if (!result.ok) {
    redirect(`/onboarding?error=${encodeURIComponent(result.error ?? 'Unknown error')}`);
  }
  revalidatePath('/', 'layout');
  redirect('/home');
}

/**
 * Profile edit flow: save profile, return to /profile (or wherever they came from).
 */
export async function updateProfile(formData: FormData) {
  const result = await saveProfile(formData);
  if (!result.ok) {
    redirect(`/profile/edit?error=${encodeURIComponent(result.error ?? 'Unknown error')}`);
  }
  revalidatePath('/', 'layout');
  redirect('/profile?saved=1');
}
