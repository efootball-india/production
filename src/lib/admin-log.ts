import { createClient } from '@/lib/supabase/server';

export type AdminActionType =
  | 'override_score'
  | 'submit_ko_score'
  | 'record_walkover'
  | 'cancel_tournament'
  | 'update_tournament'
  | 'reset_bracket'
  | 'add_players'
  | 'remove_player'
  | 'withdraw_player'
  | 'edit_country'
  | 'change_role';

export async function logAdminAction(params: {
  tournamentId?: string | null;
  actorPlayerId: string;
  actionType: AdminActionType;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createClient();
  await supabase.from('admin_actions').insert({
    tournament_id: params.tournamentId ?? null,
    actor_player_id: params.actorPlayerId,
    action_type: params.actionType,
    target_type: params.targetType ?? null,
    target_id: params.targetId ?? null,
    metadata: params.metadata ?? {},
  });
}
