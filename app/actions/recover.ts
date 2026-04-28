'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { verifySecurityAnswer } from '@/lib/player';

/**
 * Step 1: Look up the user's security question by username.
 * Doesn't reveal whether the username exists (always redirects to step 2).
 */
export async function lookupSecurityQuestion(formData: FormData) {
  const username = (formData.get('username') as string ?? '').trim();
  if (!username) {
    redirect(`/forgot-password?error=${encodeURIComponent('Username required')}`);
  }
  redirect(`/forgot-password?username=${encodeURIComponent(username)}`);
}

/**
 * Step 2: User has typed an answer. If it matches the stored hash, set a
 * short-lived reset token (we use a synthetic password reset via direct update).
 * On success, redirect to step 3 (set new password).
 */
export async function verifyAnswerAndContinue(formData: FormData) {
  const username = (formData.get('username') as string ?? '').trim();
  const answer = (formData.get('answer') as string ?? '').trim();

  if (!username || !answer) {
    redirect(`/forgot-password?username=${encodeURIComponent(username)}&error=${encodeURIComponent('Answer required')}`);
  }

  const supabase = createClient();
  const { data: player } = await supabase
    .from('players')
    .select('id, security_question, security_answer_hash')
    .eq('username', username)
    .maybeSingle();

  if (!player || !player.security_answer_hash) {
    // Don't reveal whether the user exists; just say "incorrect"
    redirect(`/forgot-password?username=${encodeURIComponent(username)}&error=${encodeURIComponent('Incorrect answer')}`);
  }

  const ok = verifySecurityAnswer(answer, player.security_answer_hash);
  if (!ok) {
    redirect(`/forgot-password?username=${encodeURIComponent(username)}&error=${encodeURIComponent('Incorrect answer')}`);
  }

  // Move to step 3: set new password
  redirect(`/forgot-password?username=${encodeURIComponent(username)}&verified=1`);
}

/**
 * Step 3: User has typed a new password. Update it via the auth admin API.
 *
 * Note: this requires the SERVICE_ROLE key to bypass auth.users RLS.
 * We use Supabase admin client only for password reset.
 */
export async function setNewPassword(formData: FormData) {
  const username = (formData.get('username') as string ?? '').trim();
  const answer = (formData.get('answer') as string ?? '').trim();
  const password = formData.get('password') as string;
  const password2 = formData.get('password2') as string;

  if (!username || !answer || !password) {
    redirect(`/forgot-password?error=${encodeURIComponent('All fields required')}`);
  }
  if (password.length < 8) {
    redirect(`/forgot-password?username=${encodeURIComponent(username)}&verified=1&error=${encodeURIComponent('Password must be 8+ chars')}`);
  }
  if (password !== password2) {
    redirect(`/forgot-password?username=${encodeURIComponent(username)}&verified=1&error=${encodeURIComponent('Passwords do not match')}`);
  }

  // Re-verify answer (defense in depth: don't trust the URL flag alone)
  const supabase = createClient();
  const { data: player } = await supabase
    .from('players')
    .select('id, security_answer_hash')
    .eq('username', username)
    .maybeSingle();

  if (!player || !player.security_answer_hash || !verifySecurityAnswer(answer, player.security_answer_hash)) {
    redirect(`/forgot-password?error=${encodeURIComponent('Verification failed; start over')}`);
  }

  // Update password using the admin API. Requires SUPABASE_SERVICE_ROLE_KEY env var.
  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await adminClient.auth.admin.updateUserById(player.id, {
    password,
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/signin?reset=1`);
}
