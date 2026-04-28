// PASS-1-ACTIONS-DRAW
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { listAvailableCountries, maxRerollsForWinner } from '@/lib/draw';

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');
  const { data: me } = await supabase
    .from('players')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) {
    redirect('/');
  }
  return { supabase, user };
}

export async function toggleQuizWinner(formData: FormData) {
  const { supabase } = await requireAdmin();
  const participantId = formData.get('participant_id') as string;
  const slug = formData.get('slug') as string;
  if (!participantId || !slug) redirect('/');

  const { data: current } = await supabase
    .from('tournament_participants')
    .select('is_quiz_winner')
    .eq('id', participantId)
    .maybeSingle();

  await supabase
    .from('tournament_participants')
    .update({ is_quiz_winner: !current?.is_quiz_winner })
    .eq('id', participantId);

  revalidatePath(`/admin/tournaments/${slug}/draw`);
  redirect(`/admin/tournaments/${slug}/draw`);
}

export async function startDraw(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = formData.get('slug') as string;
  if (!slug) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, status')
    .eq('slug', slug)
    .maybeSingle();
  if (!tournament) redirect('/');

  if (tournament.status === 'registration_open') {
    await supabase
      .from('tournaments')
      .update({ status: 'registration_closed' })
      .eq('id', tournament.id);
  }

  await supabase.from('tournament_draws').upsert({
    tournament_id: tournament.id,
    status: 'in_progress',
    started_at: new Date().toISOString(),
    completed_at: null,
  });

  revalidatePath(`/admin/tournaments/${slug}/draw`);
  redirect(`/admin/tournaments/${slug}/draw`);
}

export async function spinForParticipant(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = formData.get('slug') as string;
  const participantId = formData.get('participant_id') as string;
  if (!slug || !participantId) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!tournament) redirect('/');

  const { data: p } = await supabase
    .from('tournament_participants')
    .select('id, is_quiz_winner, country_id, rerolls_used')
    .eq('id', participantId)
    .maybeSingle();
  if (!p) redirect(`/admin/tournaments/${slug}/draw`);

  if (p.country_id && !p.is_quiz_winner) {
    redirect(`/admin/tournaments/${slug}/draw?error=${encodeURIComponent('Already drawn')}`);
  }
  if (p.country_id && p.is_quiz_winner && p.rerolls_used >= maxRerollsForWinner()) {
    redirect(`/admin/tournaments/${slug}/draw?error=${encodeURIComponent('Out of rerolls')}`);
  }

  const available = await listAvailableCountries(tournament.id);
  let pool = available;
  if (p.country_id) {
    const { data: cur } = await supabase
      .from('countries')
      .select('id, code, name, group_label, position')
      .eq('id', p.country_id)
      .maybeSingle();
    if (cur) pool = [...available, cur];
  }

  if (pool.length === 0) {
    redirect(`/admin/tournaments/${slug}/draw?error=${encodeURIComponent('No countries left in pool')}`);
  }

  const idx = Math.floor(Math.random() * pool.length);
  const picked = pool[idx];

  const updates: Record<string, unknown> = {
    country_id: picked.id,
    drawn_at: new Date().toISOString(),
  };
  if (p.country_id) {
    updates.rerolls_used = (p.rerolls_used ?? 0) + 1;
  }

  await supabase
    .from('tournament_participants')
    .update(updates)
    .eq('id', participantId);

  revalidatePath(`/admin/tournaments/${slug}/draw`);
  redirect(`/admin/tournaments/${slug}/draw?revealed=${picked.code}&for=${participantId}`);
}

export async function acceptDraw(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = formData.get('slug') as string;
  const participantId = formData.get('participant_id') as string;
  if (!slug || !participantId) redirect('/');

  await supabase
    .from('tournament_participants')
    .update({ rerolls_used: maxRerollsForWinner() })
    .eq('id', participantId);

  revalidatePath(`/admin/tournaments/${slug}/draw`);
  redirect(`/admin/tournaments/${slug}/draw`);
}

export async function completeDraw(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = formData.get('slug') as string;
  if (!slug) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!tournament) redirect('/');

  const { count: undrawn } = await supabase
    .from('tournament_participants')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id)
    .is('country_id', null)
    .eq('status', 'registered');

  if ((undrawn ?? 0) > 0) {
    redirect(`/admin/tournaments/${slug}/draw?error=${encodeURIComponent('Some players not yet drawn')}`);
  }

  await supabase.from('tournament_draws').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
  }).eq('tournament_id', tournament.id);

  await supabase.from('tournaments').update({
    status: 'in_progress',
  }).eq('id', tournament.id);

  revalidatePath(`/admin/tournaments/${slug}/draw`);
  redirect(`/tournaments/${slug}`);
}

export async function resetDraw(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = formData.get('slug') as string;
  if (!slug) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!tournament) redirect('/');

  const { count: scoredMatches } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id)
    .not('home_score', 'is', null);

  if ((scoredMatches ?? 0) > 0) {
    redirect(`/admin/tournaments/${slug}/draw?error=${encodeURIComponent('Cannot reset: matches already played')}`);
  }

  await supabase
    .from('tournament_participants')
    .update({ country_id: null, drawn_at: null, rerolls_used: 0 })
    .eq('tournament_id', tournament.id);

  await supabase.from('tournament_draws').upsert({
    tournament_id: tournament.id,
    status: 'not_started',
    started_at: null,
    completed_at: null,
  });

  revalidatePath(`/admin/tournaments/${slug}/draw`);
  redirect(`/admin/tournaments/${slug}/draw`);
}
