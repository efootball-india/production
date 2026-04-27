'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

function getOrigin() {
  // Prefer the explicit env var, fall back to request headers
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  const headersList = headers();
  const host = headersList.get('host');
  const proto = headersList.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const origin = getOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/signin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/', 'layout');
  redirect('/home');
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = createClient();
  const origin = getOrigin();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/verify');
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function completeOnboarding(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const username = (formData.get('username') as string)?.trim();
  const display_name = (formData.get('display_name') as string)?.trim() || username;
  const region = (formData.get('region') as string) || null;
  const platform = (formData.get('platform') as string) || null;

  if (!username || username.length < 3 || username.length > 24) {
    redirect('/onboarding?error=Username must be 3-24 characters');
  }

  const { error } = await supabase.from('players').upsert({
    id: user.id,
    username,
    display_name,
    region,
    platform: platform as 'ps5' | 'ps4' | 'xbox' | 'pc' | 'mobile' | null,
  });

  if (error) {
    // Most common error: username already taken
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/', 'layout');
  redirect('/home');
}
