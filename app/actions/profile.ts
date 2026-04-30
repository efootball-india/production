'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { hashSecurityAnswer, SECURITY_QUESTIONS, type Platform } from '@/lib/player';

const VALID_PLATFORMS: Platform[] = [
  'ps5', 'ps4', 'xbox_series', 'xbox_one',
  'pc_steam', 'pc_epic', 'mobile_ios', 'mobile_android',
];

async function saveProfile(formData: FormData, requireSecurityQuestion: boolean): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in' };

  const username = (formData.get('username') as string ?? '').trim();
  const display_name = (formData.get('display_name') as string ?? '').trim() || username;
  const platform = (formData.get('platform') as string ?? '').trim();
  const game_id = (formData.get('game_id') as string ?? '').trim() || null;
  const region_raw = (formData.get('region') as string ?? '').trim().toUpperCase();
  const region = region_raw || null;
  const security_question = (formData.get('security_question') as string ?? '').trim();
  const security_answer = (formData.get('security_answer') as string ?? '').trim();

  if (!username) return { ok: false, error: 'Username is required' };
  if (username.length < 3 || username.length > 24) return { ok: false, error: 'Username must be 3-24 characters' };
  if (!/^[A-Za-z0-9_]+$/.test(username)) return { ok: false, error: 'Username: letters, numbers, underscore only' };
  if (platform && !VALID_PLATFORMS.includes(platform as Platform)) return { ok: false, error: 'Invalid platform' };
  if (region && !/^[A-Z]{2}$/.test(region)) return { ok: false, error: 'Country must be a 2-letter code' };

  if (requireSecurityQuestion) {
    if (!security_question) return { ok: false, error: 'Security question is required' };
    if (!SECURITY_QUESTIONS.includes(security_question)) return { ok: false, error: 'Invalid security question' };
    if (!security_answer || security_answer.length < 2) return { ok: false, error: 'Security answer is required (min 2 chars)' };
  }

  const updates: Record<string, unknown> = {
    id: user.id,
    username,
    display_name,
    platform: (platform || null) as Platform | null,
    region,
    game_id,
  };

  // Only set the security question/answer if provided (so updateProfile can leave them alone)
  if (security_question && security_answer) {
    updates.security_question = security_question;
    updates.security_answer_hash = hashSecurityAnswer(security_answer);
  }

  const { error } = await supabase.from('players').upsert(updates);
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'That username is already taken' };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function completeOnboarding(formData: FormData) {
  const result = await saveProfile(formData, true);
  if (!result.ok) redirect(`/onboarding?error=${encodeURIComponent(result.error ?? 'Error')}`);
  revalidatePath('/', 'layout');
  redirect('/profile?welcome=1');
}

export async function updateProfile(formData: FormData) {
  const result = await saveProfile(formData, false);
  if (!result.ok) redirect(`/profile/edit?error=${encodeURIComponent(result.error ?? 'Error')}`);
  revalidatePath('/', 'layout');
  redirect('/profile?saved=1');
}
