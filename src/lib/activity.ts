import { createClient } from '@/lib/supabase/server';

export type ActivityEntry = {
  id: string;
  actionType: string;
  actorUsername: string;
  actorDisplayName: string | null;
  actorAvatarUrl: string | null;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  // Resolved target info (best-effort)
  targetMatchInfo?: {
    homeName: string | null;
    awayName: string | null;
    matchday: number | null;
    round: number | null;
  };
  targetParticipantInfo?: {
    username: string | null;
    displayName: string | null;
  };
  targetPlayerInfo?: {
    username: string | null;
    displayName: string | null;
  };
};

export async function getActivityForTournament(
  tournamentId: string,
  limit: number = 50
): Promise<ActivityEntry[]> {
  const supabase = createClient();

  const { data: actions } = await supabase
    .from('admin_actions')
    .select(`
      id, action_type, actor_player_id, target_type, target_id, metadata, created_at,
      actor:players!admin_actions_actor_player_id_fkey(username, display_name, avatar_url)
    `)
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!actions || actions.length === 0) return [];

  // Collect all target IDs for batch lookups
  const matchIds: string[] = [];
  const participantIds: string[] = [];
  const playerIds: string[] = [];

  for (const a of actions) {
    if (!a.target_id) continue;
    if (a.target_type === 'match') matchIds.push(a.target_id);
    else if (a.target_type === 'participant') participantIds.push(a.target_id);
    else if (a.target_type === 'player') playerIds.push(a.target_id);
  }

  const matchInfo = new Map<string, ActivityEntry['targetMatchInfo']>();
  if (matchIds.length > 0) {
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        id, matchday, round,
        home:tournament_participants!matches_home_participant_id_fkey(player:players(username, display_name), country:countries(name)),
        away:tournament_participants!matches_away_participant_id_fkey(player:players(username, display_name), country:countries(name))
      `)
      .in('id', matchIds);
    for (const m of matches ?? []) {
      const homeP: any = m.home;
      const awayP: any = m.away;
      const homeName = homeP?.country?.name ?? homeP?.player?.display_name ?? homeP?.player?.username ?? null;
      const awayName = awayP?.country?.name ?? awayP?.player?.display_name ?? awayP?.player?.username ?? null;
      matchInfo.set(m.id, {
        homeName,
        awayName,
        matchday: m.matchday,
        round: m.round,
      });
    }
  }

  const participantInfo = new Map<string, ActivityEntry['targetParticipantInfo']>();
  if (participantIds.length > 0) {
    const { data: parts } = await supabase
      .from('tournament_participants')
      .select('id, player:players(username, display_name)')
      .in('id', participantIds);
    for (const p of parts ?? []) {
      const player: any = p.player;
      participantInfo.set(p.id, {
        username: player?.username ?? null,
        displayName: player?.display_name ?? null,
      });
    }
  }

  const playerInfo = new Map<string, ActivityEntry['targetPlayerInfo']>();
  if (playerIds.length > 0) {
    const { data: players } = await supabase
      .from('players')
      .select('id, username, display_name')
      .in('id', playerIds);
    for (const p of players ?? []) {
      playerInfo.set(p.id, {
        username: p.username,
        displayName: p.display_name,
      });
    }
  }

  return actions.map((a: any) => ({
    id: a.id,
    actionType: a.action_type,
    actorUsername: a.actor?.username ?? '?',
    actorDisplayName: a.actor?.display_name ?? null,
    actorAvatarUrl: a.actor?.avatar_url ?? null,
    targetType: a.target_type,
    targetId: a.target_id,
    metadata: a.metadata ?? {},
    createdAt: a.created_at,
    targetMatchInfo: a.target_id && a.target_type === 'match' ? matchInfo.get(a.target_id) : undefined,
    targetParticipantInfo: a.target_id && a.target_type === 'participant' ? participantInfo.get(a.target_id) : undefined,
    targetPlayerInfo: a.target_id && a.target_type === 'player' ? playerInfo.get(a.target_id) : undefined,
  }));
}

export function describeActivity(entry: ActivityEntry): string {
  const actor = entry.actorDisplayName ?? `@${entry.actorUsername}`;
  const meta = entry.metadata;

  const matchLabel = (info: ActivityEntry['targetMatchInfo']) => {
    if (!info) return 'a match';
    const stage = info.matchday != null
      ? `MD${info.matchday}`
      : info.round != null
      ? roundShort(info.round)
      : '';
    const teams = info.homeName && info.awayName
      ? `${info.homeName} vs ${info.awayName}`
      : 'match';
    return stage ? `${stage} · ${teams}` : teams;
  };

  const participantLabel = (info: ActivityEntry['targetParticipantInfo']) => {
    if (!info) return 'a player';
    return info.displayName ?? `@${info.username ?? 'unknown'}`;
  };

  const playerLabel = (info: ActivityEntry['targetPlayerInfo']) => {
    if (!info) return 'a player';
    return info.displayName ?? `@${info.username ?? 'unknown'}`;
  };

  switch (entry.actionType) {
    case 'override_score': {
      const score = `${meta.home_score ?? '?'}-${meta.away_score ?? '?'}`;
      const fastPath = meta.fast_path ? ' (fast-path submission)' : '';
      return `${actor} overrode the score to ${score} in ${matchLabel(entry.targetMatchInfo)}${fastPath}`;
    }
    case 'submit_ko_score': {
      const score = `${meta.home_score ?? '?'}-${meta.away_score ?? '?'}`;
      const dec = meta.decided_by && meta.decided_by !== 'regulation' ? ` · ${meta.decided_by.toUpperCase()}` : '';
      return `${actor} submitted KO score ${score}${dec} in ${matchLabel(entry.targetMatchInfo)}`;
    }
    case 'record_walkover': {
      const winner = meta.winner_side === 'home' ? 'home' : 'away';
      return `${actor} recorded a walkover (${winner} side won) in ${matchLabel(entry.targetMatchInfo)}`;
    }
    case 'cancel_tournament':
      return `${actor} cancelled the tournament`;
    case 'update_tournament':
      return `${actor} updated tournament settings (${meta.name ?? 'name unchanged'})`;
    case 'reset_bracket':
      return `${actor} reset the knockout bracket`;
    case 'add_players': {
      const count = meta.count ?? 0;
      return `${actor} added ${count} player${count === 1 ? '' : 's'} to the tournament`;
    }
    case 'remove_player':
      return `${actor} removed ${participantLabel(entry.targetParticipantInfo)} from the tournament`;
    case 'withdraw_player':
      return `${actor} withdrew ${participantLabel(entry.targetParticipantInfo)} from the tournament`;
    case 'edit_country':
      return `${actor} changed ${participantLabel(entry.targetParticipantInfo)}'s country`;
    case 'change_role':
      return `${actor} changed ${playerLabel(entry.targetPlayerInfo)}'s role to ${(meta.new_role ?? '?').toUpperCase()}`;
    default:
      return `${actor} performed action: ${entry.actionType}`;
  }
}

function roundShort(round: number): string {
  if (round === 1) return 'R32';
  if (round === 2) return 'R16';
  if (round === 3) return 'QF';
  if (round === 4) return 'SF';
  if (round === 5) return 'F';
  return `R${round}`;
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  // Otherwise show date
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
