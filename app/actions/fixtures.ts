// PASS-2-ACTIONS-FIXTURES
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { generateGroupFixtures } from '@/lib/fixtures';

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');
  const { data: me } = await supabase
    .from('players')
    .select('role').eq('id', user.id).maybeSingle();
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) redirect('/');
  return { supabase, user };
}

async function requireMod() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');
  const { data: me } = await supabase
    .from('players')
    .select('role').eq('id', user.id).maybeSingle();
  if (!me || !['moderator', 'admin', 'super_admin'].includes(me.role)) redirect('/');
  return { supabase, user };
}

/**
 * Generate the 72 group-stage matches for a tournament. Idempotent.
 */
export async function generateFixtures(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = formData.get('slug') as string;
  if (!slug) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id').eq('slug', slug).maybeSingle();
  if (!tournament) redirect('/');

  await generateGroupFixtures(tournament.id);

  revalidatePath(`/tournaments/${slug}`);
  redirect(`/tournaments/${slug}?fixtures_generated=1`);
}

/**
 * Set or update the matchday deadlines for a tournament.
 */
export async function setMatchdayDeadlines(formData: FormData) {
  const { supabase } = await requireAdmin();
  const slug = formData.get('slug') as string;
  if (!slug) redirect('/');

  const md1 = (formData.get('md1') as string ?? '').trim();
  const md2 = (formData.get('md2') as string ?? '').trim();
  const md3 = (formData.get('md3') as string ?? '').trim();

  const deadlines: Record<string, string | null> = {};
  if (md1) deadlines['1'] = new Date(md1).toISOString();
  if (md2) deadlines['2'] = new Date(md2).toISOString();
  if (md3) deadlines['3'] = new Date(md3).toISOString();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id').eq('slug', slug).maybeSingle();
  if (!tournament) redirect('/');

  await supabase
    .from('tournaments')
    .update({ matchday_deadlines: deadlines })
    .eq('id', tournament.id);

  // Also update matches to set their deadline_at
  for (const md of [1, 2, 3]) {
    const iso = deadlines[String(md)];
    if (iso) {
      await supabase
        .from('matches')
        .update({ deadline_at: iso })
        .eq('tournament_id', tournament.id)
        .eq('matchday', md);
    }
  }

  revalidatePath(`/tournaments/${slug}`);
  redirect(`/tournaments/${slug}?deadlines_set=1`);
}

/**
 * A player submits a score for one of their matches.
 * If both players have submitted and they agree, the match auto-completes.
 * If they disagree, status becomes 'disputed' for mod review.
 */
export async function submitScore(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const matchId = formData.get('match_id') as string;
  const slug = formData.get('slug') as string;
  const homeScoreRaw = (formData.get('home_score') as string ?? '').trim();
  const awayScoreRaw = (formData.get('away_score') as string ?? '').trim();
  const notes = (formData.get('notes') as string ?? '').trim() || null;

  const homeScore = parseInt(homeScoreRaw, 10);
  const awayScore = parseInt(awayScoreRaw, 10);

  if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
    redirect(`/play/${slug}?error=${encodeURIComponent('Invalid score')}`);
  }

  // Verify user is a participant in this match
  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, home_participant_id, away_participant_id, status,
      home:tournament_participants!matches_home_participant_id_fkey(player_id),
      away:tournament_participants!matches_away_participant_id_fkey(player_id)
    `)
    .eq('id', matchId)
    .maybeSingle();

  if (!match) redirect(`/play/${slug}?error=${encodeURIComponent('Match not found')}`);

  const homePlayerId = (match.home as any)?.player_id;
  const awayPlayerId = (match.away as any)?.player_id;
  if (user.id !== homePlayerId && user.id !== awayPlayerId) {
    redirect(`/play/${slug}?error=${encodeURIComponent('Not your match')}`);
  }

  // Upsert this submission
  await supabase.from('score_submissions').upsert({
    match_id: matchId,
    submitted_by: user.id,
    home_score: homeScore,
    away_score: awayScore,
    notes,
  }, { onConflict: 'match_id,submitted_by' });

  // Check if both players have now submitted
  const { data: subs } = await supabase
    .from('score_submissions')
    .select('submitted_by, home_score, away_score')
    .eq('match_id', matchId);

  if (subs && subs.length === 2) {
    const homeSub = subs.find(s => s.submitted_by === homePlayerId);
    const awaySub = subs.find(s => s.submitted_by === awayPlayerId);

    if (homeSub && awaySub) {
      const agree = homeSub.home_score === awaySub.home_score &&
                    homeSub.away_score === awaySub.away_score;

      if (agree) {
        // Both players agree → auto-complete the match
        const winnerId = homeSub.home_score > homeSub.away_score
          ? match.home_participant_id
          : homeSub.home_score < homeSub.away_score
          ? match.away_participant_id
          : null;

        await supabase
          .from('matches')
          .update({
            home_score: homeSub.home_score,
            away_score: homeSub.away_score,
            status: 'completed',
            winner_participant_id: winnerId,
            confirmed_at: new Date().toISOString(),
          })
          .eq('id', matchId);
      } else {
        // Disagreement → flag for mod review
        await supabase
          .from('matches')
          .update({ status: 'disputed' })
          .eq('id', matchId);
      }
    }
  } else {
    // Only one submission so far
    await supabase
      .from('matches')
      .update({
        status: 'awaiting_confirmation',
        reported_by: user.id,
        reported_at: new Date().toISOString(),
      })
      .eq('id', matchId);
  }

  revalidatePath(`/play/${slug}`);
  redirect(`/play/${slug}?submitted=${matchId}`);
}

/**
 * Mod-only: override the score for a match. Bypasses the dual-submission check.
 */
export async function overrideMatchScore(formData: FormData) {
  const { supabase } = await requireMod();
  const matchId = formData.get('match_id') as string;
  const slug = formData.get('slug') as string;
  const homeScoreRaw = (formData.get('home_score') as string ?? '').trim();
  const awayScoreRaw = (formData.get('away_score') as string ?? '').trim();

  const homeScore = parseInt(homeScoreRaw, 10);
  const awayScore = parseInt(awayScoreRaw, 10);

  if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
    redirect(`/admin/tournaments/${slug}/queue?error=${encodeURIComponent('Invalid score')}`);
  }

  const { data: match } = await supabase
    .from('matches')
    .select('home_participant_id, away_participant_id')
    .eq('id', matchId)
    .maybeSingle();
  if (!match) redirect(`/admin/tournaments/${slug}/queue`);

  const winnerId = homeScore > awayScore
    ? match.home_participant_id
    : homeScore < awayScore
    ? match.away_participant_id
    : null;

  await supabase
    .from('matches')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: 'completed',
      winner_participant_id: winnerId,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', matchId);

  revalidatePath(`/admin/tournaments/${slug}/queue`);
  redirect(`/admin/tournaments/${slug}/queue?overridden=${matchId}`);
}
