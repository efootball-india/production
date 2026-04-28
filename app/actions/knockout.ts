// PASS-3-ACTIONS-KNOCKOUT
'use server';

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

/**
 * Admin-triggered: build the knockout bracket.
 * - Verifies group stage is complete
 * - Computes seeds (group winners, runners-up, best 8 thirds)
 * - Creates R32 matches with real participants, R16/QF/SF/F as placeholders
 * - Creates feeder rows for advancement
 */
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

/**
 * Manually nominate which participant advances when a group tiebreaker is unresolvable.
 * The override is recorded by swapping the standings positions in the live calculation
 * — but since standings are computed live, we instead pre-assign the seed slot here.
 *
 * For simplicity, this admin action: takes a group label and a participant_id,
 * and explicitly creates / updates a knockout_seed for the corresponding seed_number.
 *
 * Used when standings show 'TIE' and admin needs to break it manually.
 */
export async function manualTiebreakAdvance(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = formData.get('slug') as string;
  const participantId = formData.get('participant_id') as string;
  const sourceGroup = formData.get('source_group') as string; // 'A'..'L'
  const sourcePosition = parseInt(formData.get('source_position') as string, 10); // 1, 2, or 3
  if (!slug || !participantId || !sourceGroup || !sourcePosition) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments').select('id').eq('slug', slug).maybeSingle();
  if (!tournament) redirect('/');

  // We don't store manual overrides separately; admin uses this only AFTER
  // they've manually adjusted match scores so standings naturally produce
  // the correct ordering. So this action is mostly a placeholder — it just
  // redirects to the knockout page with a note.
  redirect(`/admin/tournaments/${slug}/knockout?info=${encodeURIComponent('Adjust match scores to break ties, then re-run bracket generation')}`);
}

/**
 * Submit / override a KO match score with optional penalty shootout.
 * Mods/admins always settle the match immediately.
 */
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

  // Determine winner
  let winnerParticipantId: string | null = null;
  let homePens: number | null = null;
  let awayPens: number | null = null;
  let decidedBy: string | null = null;

  // Get match for participant ids
  const { data: match } = await supabase
    .from('matches')
    .select('home_participant_id, away_participant_id, round, match_number_in_round, stage_id, tournament_id')
    .eq('id', matchId)
    .maybeSingle();
  if (!match) redirect(`/tournaments/${slug}/bracket?error=match_not_found`);

  if (homeScore !== awayScore) {
    // Decisive in regulation/extra time
    winnerParticipantId = homeScore > awayScore ? match.home_participant_id : match.away_participant_id;
    decidedBy = wentToET ? 'extra_time' : 'regulation';
  } else if (wentToPens) {
    // Tied after ET, decided on penalties
    homePens = parseInt(homePensRaw, 10);
    awayPens = parseInt(awayPensRaw, 10);
    if (isNaN(homePens) || isNaN(awayPens) || homePens === awayPens) {
      redirect(`/tournaments/${slug}/bracket?error=${encodeURIComponent('Invalid penalty shootout')}`);
    }
    winnerParticipantId = homePens > awayPens ? match.home_participant_id : match.away_participant_id;
    decidedBy = 'penalties';
  } else {
    // Tied scoreline but no pens specified — error
    redirect(`/tournaments/${slug}/bracket?error=${encodeURIComponent('Tied score must go to penalties')}`);
  }

  // Update match
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

  // Advance winner to next round via match_feeders
  await advanceWinner(matchId, winnerParticipantId!);

  // If this was the Final, declare champion
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

/**
 * Find the next-round match this winner feeds into, and place them in the right slot.
 */
async function advanceWinner(fromMatchId: string, winnerParticipantId: string): Promise<void> {
  const supabase = createClient();
  const { data: feeder } = await supabase
    .from('match_feeders')
    .select('match_id, target_slot')
    .eq('feeder_match_id', fromMatchId)
    .eq('feeder_type', 'winner')
    .maybeSingle();
  if (!feeder) return; // No next round (e.g. Final)

  // Update the target match's home or away participant
  const updates: Record<string, unknown> = {};
  if (feeder.target_slot === 'home') updates.home_participant_id = winnerParticipantId;
  else updates.away_participant_id = winnerParticipantId;

  await supabase.from('matches').update(updates).eq('id', feeder.match_id);

  // If both slots are now filled, flip status to awaiting_result
  const { data: target } = await supabase
    .from('matches')
    .select('home_participant_id, away_participant_id')
    .eq('id', feeder.match_id)
    .maybeSingle();
  if (target?.home_participant_id && target?.away_participant_id) {
    await supabase.from('matches').update({ status: 'awaiting_result' }).eq('id', feeder.match_id);
  }
}

/**
 * Reset the knockout bracket. Allowed only if no KO matches have scores.
 */
export async function resetKnockoutBracket(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = formData.get('slug') as string;
  if (!slug) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments').select('id').eq('slug', slug).maybeSingle();
  if (!tournament) redirect('/');

  // Check no scored KO matches
  const { data: stage } = await supabase
    .from('stages').select('id')
    .eq('tournament_id', tournament.id)
    .eq('stage_type', 'knockout')
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

  // Delete in correct order: feeders, matches, seeds, stage
  const { data: koMatches } = await supabase
    .from('matches').select('id').eq('stage_id', stage.id);
  const matchIds = (koMatches ?? []).map(m => m.id);
  if (matchIds.length > 0) {
    await supabase.from('match_feeders').delete().in('match_id', matchIds);
    await supabase.from('match_feeders').delete().in('feeder_match_id', matchIds);
    await supabase.from('matches').delete().in('id', matchIds);
  }
  await supabase.from('knockout_seeds').delete().eq('tournament_id', tournament.id);
  await supabase.from('stages').delete().eq('id', stage.id);

  // Clear champion if any
  await supabase.from('tournaments').update({
    champion_participant_id: null,
    champion_declared_at: null,
  }).eq('id', tournament.id);

  revalidatePath(`/tournaments/${slug}/bracket`);
  revalidatePath(`/admin/tournaments/${slug}/knockout`);
  redirect(`/admin/tournaments/${slug}/knockout?reset=1`);
}
