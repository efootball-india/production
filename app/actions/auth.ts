'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

function getOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  const headersList = headers();
  const host = headersList.get('host');
  const proto = headersList.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}

/**
 * Convert a username into a synthetic email used internally by Supabase auth.
 * The user never sees this email; they always sign in with their username.
 */
function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@users.eftbl.app`;
}

function isValidUsername(username: string): boolean {
  return /^[A-Za-z0-9_]{3,24}$/.test(username);
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const origin = getOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error) redirect(`/?error=${encodeURIComponent(error.message)}`);
  if (data.url) redirect(data.url);
}

export async function signInWithUsername(formData: FormData) {
  const username = (formData.get('username') as string ?? '').trim();
  const password = formData.get('password') as string;

  if (!username || !password) {
    redirect(`/signin?error=${encodeURIComponent('Username and password required')}`);
  }
  if (!isValidUsername(username)) {
    redirect(`/signin?error=${encodeURIComponent('Invalid username format')}`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (error) {
    redirect(`/signin?error=${encodeURIComponent('Invalid username or password')}`);
  }
  revalidatePath('/', 'layout');
  redirect('/home');
}

export async function signUpWithUsername(formData: FormData) {
  const username = (formData.get('username') as string ?? '').trim();
  const password = formData.get('password') as string;

  if (!username || !password) {
    redirect(`/signup?error=${encodeURIComponent('Username and password required')}`);
  }
  if (!isValidUsername(username)) {
    redirect(`/signup?error=${encodeURIComponent('Username must be 3-24 chars · letters, numbers, underscore')}`);
  }
  if (password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent('Password must be at least 8 characters')}`);
  }

  const supabase = createClient();

  // Pre-check that username isn't taken in players table
  const { data: existing } = await supabase
    .from('players')
    .select('username')
    .eq('username', username)
    .maybeSingle();
  if (existing) {
    redirect(`/signup?error=${encodeURIComponent('That username is already taken')}`);
  }

  const { error } = await supabase.auth.signUp({
    email: usernameToEmail(username),
    password,
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Sign them in immediately (since email confirmation is off)
  await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  revalidatePath('/', 'layout');
  redirect('/onboarding');
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}
