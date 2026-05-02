// PASS-3-ACTIONS-FIXTURES (with admin logging)
'use server';

import { logAdminAction } from '@/lib/admin-log';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { generateGroupFixtures } from '@/lib/fixtures';
import { generateBracket as libGenerateBracket, groupStageComplete, bracketExists } from '@/lib/knockout';

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

async function tryAutoGenerateBracket(tournamentId: string): Promise<void> {
  if (await bracketExists(tournamentId)) return;
  const groupCheck = await groupStageComplete(tournamentId);
  if (!groupCheck.complete) return;
  await libGenerateBracket(tournamentId);
}

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
 * - Regular players: needs both players to submit and agree to auto-complete.
 * - Mods/admins: their submission is authoritative; match completes immediately.
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

  const { data: me } = await supabase
    .from('players')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const isPrivileged = me && ['moderator', 'admin', 'super_admin'].includes(me.role);

  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, tournament_id, home_participant_id, away_participant_id, status,
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

  if (isPrivileged) {
    const winnerId = homeScore > awayScore
      ? match.home_participant_id
      : homeScore < awayScore
      ? match.away_participant_id
      : null;

    await supabase.from('score_submissions').upsert({
      match_id: matchId,
      submitted_by: user.id,
      home_score: homeScore,
      away_score: awayScore,
      notes,
    }, { onConflict: 'match_id,submitted_by' });

    await supabase
      .from('matches')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: 'completed',
        winner_participant_id: winnerId,
        confirmed_by: user.id,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', matchId);

    await logAdminAction({
      tournamentId: match.tournament_id,
      actorPlayerId: user.id,
      actionType: 'override_score',
      targetType: 'match',
      targetId: matchId,
      metadata: { home_score: homeScore, away_score: awayScore, fast_path: true },
    });

    await tryAutoGenerateBracket(match.tournament_id);

    revalidatePath(`/play/${slug}`);
    redirect(`/play/${slug}?completed=${matchId}`);
  }

  await supabase.from('score_submissions').upsert({
    match_id: matchId,
    submitted_by: user.id,
    home_score: homeScore,
    away_score: awayScore,
    notes,
  }, { onConflict: 'match_id,submitted_by' });

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

        await tryAutoGenerateBracket(match.tournament_id);
      } else {
        await supabase
          .from('matches')
          .update({ status: 'disputed' })
          .eq('id', matchId);
      }
    }
  } else {
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

export async function overrideMatchScore(formData: FormData) {
  const { supabase, user } = await requireMod();
  const matchId = formData.get('match_id') as string;
  const slug = formData.get('slug') as string;
  const returnTo = (formData.get('return_to') as string ?? '').trim() || null;
  const homeScoreRaw = (formData.get('home_score') as string ?? '').trim();
  const awayScoreRaw = (formData.get('away_score') as string ?? '').trim();

  const homeScore = parseInt(homeScoreRaw, 10);
  const awayScore = parseInt(awayScoreRaw, 10);

  const fallback = `/admin/tournaments/${slug}/queue`;
  const target = returnTo ?? fallback;

  if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
    redirect(`${target}?error=${encodeURIComponent('Invalid score')}`);
  }

  const { data: match } = await supabase
    .from('matches')
    .select('tournament_id, home_participant_id, away_participant_id')
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

  await logAdminAction({
    tournamentId: match.tournament_id,
    actorPlayerId: user.id,
    actionType: 'override_score',
    targetType: 'match',
    targetId: matchId,
    metadata: { home_score: homeScore, away_score: awayScore },
  });

  await tryAutoGenerateBracket(match.tournament_id);

  revalidatePath(target);
  if (returnTo) {
    redirect(`${returnTo}?ok=score_updated`);
  }
  redirect(`/admin/tournaments/${slug}/queue?overridden=${matchId}`);
}

export async function recordWalkover(formData: FormData) {
  const { supabase, user } = await requireMod();
  const matchId = formData.get('match_id') as string;
  const slug = formData.get('slug') as string;
  const returnTo = (formData.get('return_to') as string ?? '').trim() || null;
  const winnerSide = formData.get('winner_side') as string;
  const isKnockout = (formData.get('is_knockout') as string ?? '') === '1';

  if (!matchId || !slug || !['home', 'away'].includes(winnerSide)) {
    const target = returnTo ?? `/tournaments/${slug}`;
    redirect(`${target}?error=${encodeURIComponent('Invalid walkover data')}`);
  }

  const { data: match } = await supabase
    .from('matches')
    .select('tournament_id, home_participant_id, away_participant_id, round')
    .eq('id', matchId)
    .maybeSingle();
  if (!match) redirect(`/tournaments/${slug}?error=${encodeURIComponent('Match not found')}`);

  const winnerId = winnerSide === 'home'
    ? match.home_participant_id
    : match.away_participant_id;

  const homeScore = winnerSide === 'home' ? 3 : 0;
  const awayScore = winnerSide === 'home' ? 0 : 3;

  await supabase
    .from('matches')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      home_pens: null,
      away_pens: null,
      decided_by: 'walkover',
      status: 'walkover',
      winner_participant_id: winnerId,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', matchId);

  if (isKnockout && match.round) {
    const { data: feeder } = await supabase
      .from('match_feeders')
      .select('target_match_id, target_slot')
      .eq('source_match_id', matchId)
      .eq('source_role', 'winner')
      .maybeSingle();

    if (feeder) {
      const updates: Record<string, unknown> = {};
      if (feeder.target_slot === 'home') updates.home_participant_id = winnerId;
      else updates.away_participant_id = winnerId;
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

    if (match.round === 5) {
      await supabase.from('tournaments').update({
        champion_participant_id: winnerId,
        champion_declared_at: new Date().toISOString(),
        status: 'completed',
      }).eq('id', match.tournament_id);
    }
  } else {
    await tryAutoGenerateBracket(match.tournament_id);
  }

 await logAdminAction({
    tournamentId: match.tournament_id,
    actorPlayerId: user.id,
    actionType: 'record_walkover',
    targetType: 'match',
    targetId: matchId,
    metadata: { winner_side: winnerSide, is_knockout: isKnockout },
  });

  revalidatePath(`/tournaments/${slug}`);
  revalidatePath(`/tournaments/${slug}/bracket`);
  if (returnTo) {
    redirect(`${returnTo}?ok=walkover_recorded`);
  }
  redirect(`/tournaments/${slug}?walkover=${matchId}`);
}
