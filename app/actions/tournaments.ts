'use server';

import { logAdminAction } from '@/lib/admin-log';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { slugify, type TournamentFormat } from '@/lib/tournaments';

const VALID_FORMATS: TournamentFormat[] = [
  'groups_knockout', 'single_elimination', 'double_elimination',
  'round_robin', 'swiss', 'free_for_all',
];

export async function createTournament(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const name = (formData.get('name') as string ?? '').trim();
  const description = (formData.get('description') as string ?? '').trim() || null;
  const format = (formData.get('format') as string ?? 'groups_knockout').trim();
  const max_raw = (formData.get('max_participants') as string ?? '').trim();
  const slug_raw = (formData.get('slug') as string ?? '').trim();
  const reg_close = (formData.get('registration_closes_at') as string ?? '').trim();
  const starts_at = (formData.get('starts_at') as string ?? '').trim();
  const rules = (formData.get('rules') as string ?? '').trim() || null;

  if (!name || name.length < 3 || name.length > 80) {
    redirect('/admin/tournaments/new?error=' + encodeURIComponent('Name must be 3-80 characters'));
  }
  if (!VALID_FORMATS.includes(format as TournamentFormat)) {
    redirect('/admin/tournaments/new?error=' + encodeURIComponent('Invalid format'));
  }

  const max_participants = max_raw ? parseInt(max_raw, 10) : null;
  if (max_participants !== null && (isNaN(max_participants) || max_participants < 2 || max_participants > 256)) {
    redirect('/admin/tournaments/new?error=' + encodeURIComponent('Capacity must be 2-256'));
  }

  const slug = slug_raw ? slugify(slug_raw) : slugify(name);
  if (slug.length < 3) {
    redirect('/admin/tournaments/new?error=' + encodeURIComponent('Slug too short'));
  }

  const regCloseIso = reg_close ? new Date(reg_close).toISOString() : null;
  const startsAtIso = starts_at ? new Date(starts_at).toISOString() : null;

  const { data, error } = await supabase
    .from('tournaments')
 .insert({
      slug,
      name,
      description,
      format,
      status: 'registration_open',
      max_participants,
      registration_closes_at: regCloseIso,
      starts_at: startsAtIso,
      created_by: user.id,
      rules,
    })
    .select('slug')
    .single();

  if (error) {
    if (error.code === '23505') {
      redirect('/admin/tournaments/new?error=' + encodeURIComponent('A tournament with that slug already exists'));
    }
    redirect('/admin/tournaments/new?error=' + encodeURIComponent(error.message));
  }

  revalidatePath('/tournaments');
  revalidatePath('/home');
  redirect(`/tournaments/${data.slug}`);
}

export async function registerForTournament(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const slug = formData.get('slug') as string;
  if (!slug) redirect('/home');

  const { data: player } = await supabase
    .from('players')
    .select('username, display_name, platform')
    .eq('id', user.id)
    .maybeSingle();

  if (!player) redirect('/onboarding');
  if (!player.platform) {
    redirect(`/profile/edit?error=${encodeURIComponent('Set your platform before registering')}`);
  }

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, status, max_participants, registration_closes_at')
    .eq('slug', slug)
    .maybeSingle();

  if (!tournament) redirect('/tournaments');
  if (tournament.status !== 'registration_open') {
    redirect(`/tournaments/${slug}?error=${encodeURIComponent('Registration is closed')}`);
  }
  if (tournament.registration_closes_at && new Date(tournament.registration_closes_at) < new Date()) {
    redirect(`/tournaments/${slug}?error=${encodeURIComponent('Registration deadline has passed')}`);
  }

  if (tournament.max_participants) {
    const { count } = await supabase
      .from('tournament_participants')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournament.id);
    if ((count ?? 0) >= tournament.max_participants) {
      redirect(`/tournaments/${slug}?error=${encodeURIComponent('Tournament is full')}`);
    }
  }

  const { error } = await supabase.from('tournament_participants').insert({
    tournament_id: tournament.id,
    player_id: user.id,
    status: 'registered',
  });

  if (error) {
    if (error.code === '23505') {
      redirect(`/tournaments/${slug}?error=${encodeURIComponent('You are already registered')}`);
    }
    redirect(`/tournaments/${slug}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/tournaments/${slug}`);
  redirect(`/tournaments/${slug}?registered=1`);
}

export async function withdrawFromTournament(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const slug = formData.get('slug') as string;
  const tournamentId = formData.get('tournament_id') as string;
  if (!slug || !tournamentId) redirect('/home');

  const { error } = await supabase
    .from('tournament_participants')
    .update({ status: 'withdrawn' })
    .eq('tournament_id', tournamentId)
    .eq('player_id', user.id)
    .eq('status', 'registered');

  if (error) {
    redirect(`/tournaments/${slug}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/tournaments/${slug}`);
  redirect(`/tournaments/${slug}?withdrawn=1`);
}

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');
  const { data: me } = await supabase
    .from('players').select('role').eq('id', user.id).maybeSingle();
  if (!me || (me.role !== 'admin' && me.role !== 'super_admin')) redirect('/');
  return { supabase, user };
}

export async function updateTournament(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const slug = formData.get('slug') as string;
  if (!slug) redirect('/');

  const { data: existing } = await supabase
    .from('tournaments')
    .select('id, name, max_participants')
    .eq('slug', slug)
    .maybeSingle();
  if (!existing) redirect('/admin/tournaments');

  const name = (formData.get('name') as string ?? '').trim();
  const description = (formData.get('description') as string ?? '').trim() || null;
  const banner_image_url = (formData.get('banner_image_url') as string ?? '').trim() || null;
  const max_raw = (formData.get('max_participants') as string ?? '').trim();
  const reg_close = (formData.get('registration_closes_at') as string ?? '').trim();
  const starts_at = (formData.get('starts_at') as string ?? '').trim();
  const rules = (formData.get('rules') as string ?? '').trim() || null;

  if (!name || name.length < 3 || name.length > 80) {
    redirect(`/admin/tournaments/${slug}/manage?error=${encodeURIComponent('Name must be 3-80 characters')}`);
  }

  const max_participants = max_raw ? parseInt(max_raw, 10) : null;
  if (max_participants !== null && (isNaN(max_participants) || max_participants < 2 || max_participants > 256)) {
    redirect(`/admin/tournaments/${slug}/manage?error=${encodeURIComponent('Capacity must be 2-256')}`);
  }

  // Block max < currently registered
  if (max_participants !== null) {
    const { count } = await supabase
      .from('tournament_participants')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', existing.id)
      .eq('status', 'registered');
    if ((count ?? 0) > max_participants) {
      redirect(`/admin/tournaments/${slug}/manage?error=${encodeURIComponent(`Cannot reduce capacity below current registered count (${count})`)}`);
    }
  }

  const regCloseIso = reg_close ? new Date(reg_close).toISOString() : null;
  const startsAtIso = starts_at ? new Date(starts_at).toISOString() : null;

  const { error } = await supabase
    .from('tournaments')
    .update({
      name,
      description,
      banner_image_url,
      max_participants,
      registration_closes_at: regCloseIso,
      starts_at: startsAtIso,
      rules,
    })
    .eq('id', existing.id);

  if (error) {
    redirect(`/admin/tournaments/${slug}/manage?error=${encodeURIComponent(error.message)}`);
  }

  await logAdminAction({
    tournamentId: existing.id,
    actorPlayerId: user.id,
    actionType: 'update_tournament',
    targetType: 'tournament',
    targetId: existing.id,
    metadata: { name, max_participants, has_rules: !!rules },
  });

  revalidatePath(`/tournaments/${slug}`);
  revalidatePath(`/admin/tournaments/${slug}/manage`);
  redirect(`/admin/tournaments/${slug}/manage?saved=1`);
}

export async function cancelTournament(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const slug = formData.get('slug') as string;
  if (!slug) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments').select('id, name').eq('slug', slug).maybeSingle();
  if (!tournament) redirect('/admin/tournaments');

  await supabase
    .from('tournaments')
    .update({ status: 'cancelled' })
    .eq('id', tournament.id);

  await logAdminAction({
    tournamentId: tournament.id,
    actorPlayerId: user.id,
    actionType: 'cancel_tournament',
    targetType: 'tournament',
    targetId: tournament.id,
    metadata: { name: tournament.name },
  });

  revalidatePath(`/tournaments/${slug}`);
  revalidatePath(`/admin/tournaments/${slug}/manage`);
  redirect(`/admin/tournaments/${slug}/manage?cancelled=1`);
}

export async function addPlayersToTournament(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const slug = formData.get('slug') as string;
  if (!slug) redirect('/');

  const playerIds = formData.getAll('player_ids') as string[];
  if (playerIds.length === 0) {
    redirect(`/admin/tournaments/${slug}/manage?tab=players&error=${encodeURIComponent('No players selected')}`);
  }

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, max_participants, status')
    .eq('slug', slug)
    .maybeSingle();
  if (!tournament) redirect('/admin/tournaments');

  // Capacity check
  if (tournament.max_participants) {
    const { count } = await supabase
      .from('tournament_participants')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournament.id)
      .eq('status', 'registered');
    if ((count ?? 0) + playerIds.length > tournament.max_participants) {
      redirect(`/admin/tournaments/${slug}/manage?tab=players&error=${encodeURIComponent(`Adding ${playerIds.length} would exceed capacity`)}`);
    }
  }

  // Insert (skip duplicates silently — Postgres will reject them, we filter first)
  const { data: existing } = await supabase
    .from('tournament_participants')
    .select('player_id')
    .eq('tournament_id', tournament.id)
    .in('player_id', playerIds);
  const existingIds = new Set((existing ?? []).map((p) => p.player_id));
  const newIds = playerIds.filter((id) => !existingIds.has(id));

  if (newIds.length === 0) {
    redirect(`/admin/tournaments/${slug}/manage?tab=players&error=${encodeURIComponent('All selected players are already registered')}`);
  }

  const rows = newIds.map((pid) => ({
    tournament_id: tournament.id,
    player_id: pid,
    status: 'registered',
  }));

  const { error } = await supabase.from('tournament_participants').insert(rows);
  if (error) {
    redirect(`/admin/tournaments/${slug}/manage?tab=players&error=${encodeURIComponent(error.message)}`);
  }

  await logAdminAction({
    tournamentId: tournament.id,
    actorPlayerId: user.id,
    actionType: 'add_players',
    targetType: 'tournament',
    targetId: tournament.id,
    metadata: { count: newIds.length, player_ids: newIds },
  });

  revalidatePath(`/tournaments/${slug}`);
  revalidatePath(`/admin/tournaments/${slug}/manage`);
  redirect(`/admin/tournaments/${slug}/manage?tab=players&added=${newIds.length}`);
}

export async function removePlayerFromTournament(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const slug = formData.get('slug') as string;
  const participantId = formData.get('participant_id') as string;
  if (!slug || !participantId) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments').select('id').eq('slug', slug).maybeSingle();
  if (!tournament) redirect('/admin/tournaments');

  // Auto-walkover all pending matches
  await cascadeWalkoverForParticipant(supabase, tournament.id, participantId);

  // Delete the participant row entirely (admin "remove" not "withdraw")
  await supabase
    .from('tournament_participants')
    .delete()
    .eq('id', participantId);

  await logAdminAction({
    tournamentId: tournament.id,
    actorPlayerId: user.id,
    actionType: 'remove_player',
    targetType: 'participant',
    targetId: participantId,
  });

  revalidatePath(`/tournaments/${slug}`);
  revalidatePath(`/admin/tournaments/${slug}/manage`);
  redirect(`/admin/tournaments/${slug}/manage?tab=players&removed=1`);
}

export async function withdrawPlayer(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const slug = formData.get('slug') as string;
  const participantId = formData.get('participant_id') as string;
  if (!slug || !participantId) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments').select('id').eq('slug', slug).maybeSingle();
  if (!tournament) redirect('/admin/tournaments');

  // Auto-walkover pending matches
  await cascadeWalkoverForParticipant(supabase, tournament.id, participantId);

  // Mark participant as withdrawn (preserves history)
  await supabase
    .from('tournament_participants')
    .update({ status: 'withdrawn' })
    .eq('id', participantId);

  await logAdminAction({
    tournamentId: tournament.id,
    actorPlayerId: user.id,
    actionType: 'withdraw_player',
    targetType: 'participant',
    targetId: participantId,
  });

  revalidatePath(`/tournaments/${slug}`);
  revalidatePath(`/admin/tournaments/${slug}/manage`);
  redirect(`/admin/tournaments/${slug}/manage?tab=players&withdrew=1`);
}

export async function editParticipantCountry(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const slug = formData.get('slug') as string;
  const participantId = formData.get('participant_id') as string;
  const countryId = (formData.get('country_id') as string ?? '').trim() || null;
  if (!slug || !participantId) redirect('/');

  const { data: tournament } = await supabase
    .from('tournaments').select('id').eq('slug', slug).maybeSingle();
  if (!tournament) redirect('/admin/tournaments');

  // Block if any group match has been played for this participant
  const { count: playedCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id)
    .not('matchday', 'is', null)
    .or(`home_participant_id.eq.${participantId},away_participant_id.eq.${participantId}`)
    .in('status', ['completed', 'walkover']);

  if ((playedCount ?? 0) > 0) {
    redirect(`/admin/tournaments/${slug}/manage?tab=players&error=${encodeURIComponent('Cannot change country: matches already played')}`);
  }

  await supabase
    .from('tournament_participants')
    .update({ country_id: countryId })
    .eq('id', participantId);

  await logAdminAction({
    tournamentId: tournament.id,
    actorPlayerId: user.id,
    actionType: 'edit_country',
    targetType: 'participant',
    targetId: participantId,
    metadata: { country_id: countryId },
  });

  revalidatePath(`/tournaments/${slug}`);
  revalidatePath(`/admin/tournaments/${slug}/manage`);
  redirect(`/admin/tournaments/${slug}/manage?tab=players&country_changed=1`);
}

export async function changePlayerRole(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const slug = formData.get('slug') as string;
  const playerId = formData.get('player_id') as string;
  const newRole = formData.get('role') as string;

  if (!playerId || !['player', 'moderator', 'admin'].includes(newRole)) {
    redirect(`/admin/tournaments/${slug}/manage?tab=players&error=${encodeURIComponent('Invalid role')}`);
  }

  // Don't allow demoting yourself
  if (playerId === user.id) {
    redirect(`/admin/tournaments/${slug}/manage?tab=players&error=${encodeURIComponent('Cannot change your own role')}`);
  }

  await supabase
    .from('players')
    .update({ role: newRole })
    .eq('id', playerId);

  await logAdminAction({
    tournamentId: null,
    actorPlayerId: user.id,
    actionType: 'change_role',
    targetType: 'player',
    targetId: playerId,
    metadata: { new_role: newRole },
  });

  if (slug) {
    revalidatePath(`/admin/tournaments/${slug}/manage`);
    redirect(`/admin/tournaments/${slug}/manage?tab=players&role_changed=1`);
  } else {
    redirect('/');
  }
}

/**
 * Helper: when a player is removed/withdrawn mid-tournament,
 * auto-walkover all their pending matches with the opponent winning 3-0.
 */
async function cascadeWalkoverForParticipant(
  supabase: ReturnType<typeof createClient>,
  tournamentId: string,
  participantId: string
): Promise<void> {
  const { data: pendingMatches } = await supabase
    .from('matches')
    .select('id, home_participant_id, away_participant_id, round, status')
    .eq('tournament_id', tournamentId)
    .or(`home_participant_id.eq.${participantId},away_participant_id.eq.${participantId}`)
    .in('status', ['awaiting_result', 'awaiting_confirmation', 'scheduled', 'pending']);

  for (const m of pendingMatches ?? []) {
    const isHome = m.home_participant_id === participantId;
    const opponentId = isHome ? m.away_participant_id : m.home_participant_id;
    if (!opponentId) continue; // Opponent not assigned yet — leave the match

    const homeScore = isHome ? 0 : 3;
    const awayScore = isHome ? 3 : 0;

    await supabase
      .from('matches')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        decided_by: 'walkover',
        status: 'walkover',
        winner_participant_id: opponentId,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', m.id);

    // For KO matches, advance the opponent forward
    if (m.round) {
      const { data: feeder } = await supabase
        .from('match_feeders')
        .select('target_match_id, target_slot')
        .eq('source_match_id', m.id)
        .eq('source_role', 'winner')
        .maybeSingle();
      if (feeder) {
        const updates: Record<string, unknown> = {};
        if (feeder.target_slot === 'home') updates.home_participant_id = opponentId;
        else updates.away_participant_id = opponentId;
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
    }
  }
}
