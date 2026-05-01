// PASS-3-ACTIONS-KNOCKOUT
'use server';

import { logAdminAction } from '@/lib/admin-log';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { generateBracket as libGenerateBracket, groupStageComplete } from '@/lib/knockout';

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');
  const { data: me } = await supabase
    .from('players').select('role').eq('id', user.id).maybeSingle();
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) redirect('/');
  return { supabase, user };
}

async function requireMod() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');
  const { data: me } = await supabase
    .from('players').select('role').eq('id', user.id).maybeSingle();
  if (!me || !['moderator', 'admin', 'super_admin'].includes(me.role)) redirect('/');
  return { supabase, user };
}

export async function generateKnockoutBracket(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = formData.get('slug') as string;
  if (!slug) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments').select('id').eq('slug', slug).maybeSingle();
  if (!tournament) redirect('/');

  const groupCheck = await groupStageComplete(tournament.id);
  if (!groupCheck.complete) {
    redirect(`/admin/tournaments/${slug}/knockout?error=${encodeURIComponent(`${groupCheck.pending} group matches pending`)}`);
  }

  const result = await libGenerateBracket(tournament.id);
  if (!result.ok) {
    redirect(`/admin/tournaments/${slug}/knockout?error=${encodeURIComponent(result.reason)}`);
  }

  revalidatePath(`/tournaments/${slug}/bracket`);
  revalidatePath(`/admin/tournaments/${slug}/knockout`);
  redirect(`/tournaments/${slug}/bracket?generated=1`);
}

export async function manualTiebreakAdvance(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = formData.get('slug') as string;
  const participantId = formData.get('participant_id') as string;
  const sourceGroup = formData.get('source_group') as string;
  const sourcePosition = parseInt(formData.get('source_position') as string, 10);
  if (!slug || !participantId || !sourceGroup || !sourcePosition) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments').select('id').eq('slug', slug).maybeSingle();
  if (!tournament) redirect('/');

  redirect(`/admin/tournaments/${slug}/knockout?info=${encodeURIComponent('Adjust match scores to break ties, then re-run bracket generation')}`);
}

export async function submitKnockoutScore(formData: FormData) {
  const { supabase } = await requireMod();
  const matchId = formData.get('match_id') as string;
  const slug = formData.get('slug') as string;
  if (!matchId || !slug) redirect('/');

  const homeScore = parseInt((formData.get('home_score') as string ?? '').trim(), 10);
  const awayScore = parseInt((formData.get('away_score') as string ?? '').trim(), 10);
  const homePensRaw = (formData.get('home_pens') as string ?? '').trim();
  const awayPensRaw = (formData.get('away_pens') as string ?? '').trim();
  const wentToPens = (formData.get('went_to_pens') as string ?? '') === 'on';
  const wentToET = (formData.get('went_to_et') as string ?? '') === 'on';

  if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
    redirect(`/tournaments/${slug}/bracket?error=${encodeURIComponent('Invalid score')}`);
  }

  let winnerParticipantId: string | null = null;
  let homePens: number | null = null;
  let awayPens: number | null = null;
  let decidedBy: string | null = null;

  const { data: match } = await supabase
    .from('matches')
    .select('home_participant_id, away_participant_id, round, match_number_in_round, stage_id, tournament_id')
    .eq('id', matchId)
    .maybeSingle();
  if (!match) redirect(`/tournaments/${slug}/bracket?error=match_not_found`);

  if (homeScore !== awayScore) {
    winnerParticipantId = homeScore > awayScore ? match.home_participant_id : match.away_participant_id;
    decidedBy = wentToET ? 'extra_time' : 'regulation';
  } else if (wentToPens) {
    homePens = parseInt(homePensRaw, 10);
    awayPens = parseInt(awayPensRaw, 10);
    if (isNaN(homePens) || isNaN(awayPens) || homePens === awayPens) {
      redirect(`/tournaments/${slug}/bracket?error=${encodeURIComponent('Invalid penalty shootout')}`);
    }
    winnerParticipantId = homePens > awayPens ? match.home_participant_id : match.away_participant_id;
    decidedBy = 'penalties';
  } else {
    redirect(`/tournaments/${slug}/bracket?error=${encodeURIComponent('Tied score must go to penalties')}`);
  }

  await supabase.from('matches').update({
    home_score: homeScore,
    away_score: awayScore,
    home_pens: homePens,
    away_pens: awayPens,
    decided_by: decidedBy,
    status: 'completed',
    winner_participant_id: winnerParticipantId,
    confirmed_at: new Date().toISOString(),
  }).eq('id', matchId);

  await advanceWinner(matchId, winnerParticipantId!);

  if (match.round === 5) {
    await supabase.from('tournaments').update({
      champion_participant_id: winnerParticipantId,
      champion_declared_at: new Date().toISOString(),
      status: 'completed',
    }).eq('id', match.tournament_id);
  }

  revalidatePath(`/tournaments/${slug}/bracket`);
  redirect(`/tournaments/${slug}/bracket?completed=${matchId}`);
}

async function advanceWinner(fromMatchId: string, winnerParticipantId: string): Promise<void> {
  const supabase = createClient();
  const { data: feeder } = await supabase
    .from('match_feeders')
    .select('target_match_id, target_slot')
    .eq('source_match_id', fromMatchId)
    .eq('source_role', 'winner')
    .maybeSingle();
  if (!feeder) return;

  const updates: Record<string, unknown> = {};
  if (feeder.target_slot === 'home') updates.home_participant_id = winnerParticipantId;
  else updates.away_participant_id = winnerParticipantId;

  await supabase.from('matches').update(updates).eq('id', feeder.target_match_id);

  const { data: target } = await supabase
    .from('matches')
    .select('home_participant_id, away_participant_id')
    .eq('id', feeder.target_match_id)
    .maybeSingle();
  if (target?.home_participant_id && target?.away_participant_id) {
    await supabase.from('matches').update({ status: 'awaiting_result' }).eq('id', feeder.target_match_id);
  }
}

export async function resetKnockoutBracket(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = formData.get('slug') as string;
  if (!slug) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments').select('id').eq('slug', slug).maybeSingle();
  if (!tournament) redirect('/');

  const { data: stage } = await supabase
    .from('stages').select('id')
    .eq('tournament_id', tournament.id)
    .eq('stage_type', 'single_elimination')
    .maybeSingle();
  if (!stage) redirect(`/admin/tournaments/${slug}/knockout`);

  const { count: scored } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('stage_id', stage.id)
    .not('home_score', 'is', null);

  if ((scored ?? 0) > 0) {
    redirect(`/admin/tournaments/${slug}/knockout?error=${encodeURIComponent('Cannot reset: KO matches already played')}`);
  }

  const { data: koMatches } = await supabase
    .from('matches').select('id').eq('stage_id', stage.id);
  const matchIds = (koMatches ?? []).map(m => m.id);
  if (matchIds.length > 0) {
    await supabase.from('match_feeders').delete().in('target_match_id', matchIds);
    await supabase.from('match_feeders').delete().in('source_match_id', matchIds);
    await supabase.from('matches').delete().in('id', matchIds);
  }
  await supabase.from('knockout_seeds').delete().eq('tournament_id', tournament.id);
  await supabase.from('stages').delete().eq('id', stage.id);

  await logAdminAction({
    tournamentId: tournament.id,
    actorPlayerId: user.id,
    actionType: 'reset_bracket',
    targetType: 'tournament',
    targetId: tournament.id,
  });
  await supabase.from('tournaments').update({
    champion_participant_id: null,
    champion_declared_at: null,
  }).eq('id', tournament.id);

  revalidatePath(`/tournaments/${slug}/bracket`);
  revalidatePath(`/admin/tournaments/${slug}/knockout`);
  redirect(`/admin/tournaments/${slug}/knockout?reset=1`);
}
