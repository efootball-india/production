// PASS-2-ACTIONS-DRAW (draw order + quiz-winner pick-1-of-3)
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  listAvailableCountries,
  maxRerollsForWinner,
  listParticipantsForDraw,
  QUIZ_WINNER_CHOICES,
} from '@/lib/draw';

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

// ─────────────────────────────────────────────────────────────────────
// Setup-phase actions
// ─────────────────────────────────────────────────────────────────────

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

// Helper: write draw_order = 1..N to participants in array order
async function persistOrder(ordered: { id: string }[]) {
  const supabase = createClient();
  await Promise.all(
    ordered.map((p, i) =>
      supabase
        .from('tournament_participants')
        .update({ draw_order: i + 1 })
        .eq('id', p.id)
    )
  );
}

export async function moveParticipantUp(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = formData.get('slug') as string;
  const participantId = formData.get('participant_id') as string;
  if (!slug || !participantId) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments').select('id').eq('slug', slug).maybeSingle();
  if (!tournament) redirect('/');

  const list = await listParticipantsForDraw(tournament.id);
  const active = list.filter((p) => p.status === 'registered');
  const idx = active.findIndex((p) => p.id === participantId);
  if (idx > 0) {
    [active[idx - 1], active[idx]] = [active[idx], active[idx - 1]];
    await persistOrder(active);
  }

  revalidatePath(`/admin/tournaments/${slug}/draw`);
  redirect(`/admin/tournaments/${slug}/draw`);
}

export async function moveParticipantDown(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = formData.get('slug') as string;
  const participantId = formData.get('participant_id') as string;
  if (!slug || !participantId) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments').select('id').eq('slug', slug).maybeSingle();
  if (!tournament) redirect('/');

  const list = await listParticipantsForDraw(tournament.id);
  const active = list.filter((p) => p.status === 'registered');
  const idx = active.findIndex((p) => p.id === participantId);
  if (idx >= 0 && idx < active.length - 1) {
    [active[idx], active[idx + 1]] = [active[idx + 1], active[idx]];
    await persistOrder(active);
  }

  revalidatePath(`/admin/tournaments/${slug}/draw`);
  redirect(`/admin/tournaments/${slug}/draw`);
}

export async function shuffleDrawOrder(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = formData.get('slug') as string;
  if (!slug) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments').select('id').eq('slug', slug).maybeSingle();
  if (!tournament) redirect('/');

  const list = await listParticipantsForDraw(tournament.id);
  const active = list.filter((p) => p.status === 'registered');
  // Fisher-Yates
  for (let i = active.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [active[i], active[j]] = [active[j], active[i]];
  }
  await persistOrder(active);

  revalidatePath(`/admin/tournaments/${slug}/draw`);
  redirect(`/admin/tournaments/${slug}/draw`);
}

export async function resetDrawOrder(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = formData.get('slug') as string;
  if (!slug) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments').select('id').eq('slug', slug).maybeSingle();
  if (!tournament) redirect('/');

  await supabase
    .from('tournament_participants')
    .update({ draw_order: null })
    .eq('tournament_id', tournament.id);

  revalidatePath(`/admin/tournaments/${slug}/draw`);
  redirect(`/admin/tournaments/${slug}/draw`);
}

export async function startDraw(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = formData.get('slug') as string;
  if (!slug) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments').select('id, status').eq('slug', slug).maybeSingle();
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

// ─────────────────────────────────────────────────────────────────────
// In-progress: spin
// ─────────────────────────────────────────────────────────────────────

export async function spinForParticipant(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = formData.get('slug') as string;
  const participantId = formData.get('participant_id') as string;
  if (!slug || !participantId) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments').select('id').eq('slug', slug).maybeSingle();
  if (!tournament) redirect('/');

  const { data: p } = await supabase
    .from('tournament_participants')
    .select('id, is_quiz_winner, country_id')
    .eq('id', participantId)
    .maybeSingle();
  if (!p) redirect(`/admin/tournaments/${slug}/draw`);

  if (p.country_id) {
    redirect(`/admin/tournaments/${slug}/draw?error=${encodeURIComponent('Already drawn')}`);
  }

  const available = await listAvailableCountries(tournament.id);
  if (available.length === 0) {
    redirect(`/admin/tournaments/${slug}/draw?error=${encodeURIComponent('No countries left in pool')}`);
  }

  // Quiz winner: pick N candidates, redirect to candidate-pick screen
  if (p.is_quiz_winner) {
    const n = Math.min(QUIZ_WINNER_CHOICES, available.length);
    const pool = [...available];
    // Fisher-Yates partial shuffle to pick n distinct items
    for (let i = pool.length - 1; i > pool.length - 1 - n; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i],
