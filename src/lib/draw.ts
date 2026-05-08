// PASS-3-LIB-DRAW (draw_order + 3-candidate picks for quiz winners)
import { createClient } from '@/lib/supabase/server';

export interface Country {
  id: string;
  code: string;
  name: string;
  group_label: string;
  position: number;
}

export interface DrawState {
  tournament_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  started_at: string | null;
  completed_at: string | null;
}

export interface ParticipantWithDraw {
  id: string;
  player_id: string;
  status: string;
  is_quiz_winner: boolean;
  rerolls_used: number;
  drawn_at: string | null;
  registered_at: string;
  country_id: string | null;
  draw_order: number | null;
  country: Country | null;
  player: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string | null;
  } | null;
}

const MAX_REROLLS_FOR_QUIZ_WINNER = 2;
export function maxRerollsForWinner() { return MAX_REROLLS_FOR_QUIZ_WINNER; }

// Quiz winners get this many country choices on their spin
export const QUIZ_WINNER_CHOICES = 3;

export async function listCountries(): Promise<Country[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('countries')
    .select('*')
    .order('group_label')
    .order('position');
  return (data ?? []) as Country[];
}

export async function getDrawState(tournamentId: string): Promise<DrawState> {
  const supabase = createClient();
  const { data } = await supabase
    .from('tournament_draws')
    .select('*')
    .eq('tournament_id', tournamentId)
    .maybeSingle();
  if (data) return data as DrawState;
  return {
    tournament_id: tournamentId,
    status: 'not_started',
    started_at: null,
    completed_at: null,
  };
}

export async function listParticipantsForDraw(tournamentId: string): Promise<ParticipantWithDraw[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('tournament_participants')
    .select(`
      id, player_id, status, is_quiz_winner, rerolls_used, drawn_at, registered_at, country_id, draw_order,
      country:countries(id, code, name, group_label, position),
      player:players(id, username, display_name, avatar_url)
    `)
    .eq('tournament_id', tournamentId);

  const list = ((data ?? []) as unknown) as ParticipantWithDraw[];

  // Sort: draw_order asc (nulls last), then registered_at asc
  list.sort((a, b) => {
    const aHas = a.draw_order != null;
    const bHas = b.draw_order != null;
    if (aHas && bHas) return (a.draw_order as number) - (b.draw_order as number);
    if (aHas) return -1;
    if (bHas) return 1;
    return new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime();
  });

  return list;
}

export async function listAvailableCountries(tournamentId: string): Promise<Country[]> {
  const supabase = createClient();
  const { data: assigned } = await supabase
    .from('tournament_participants')
    .select('country_id')
    .eq('tournament_id', tournamentId)
    .not('country_id', 'is', null);
  const taken = new Set((assigned ?? []).map((a) => a.country_id));
  const all = await listCountries();
  return all.filter((c) => !taken.has(c.id));
}

export async function getCountriesByIds(ids: string[]): Promise<Country[]> {
  if (ids.length === 0) return [];
  const supabase = createClient();
  const { data } = await supabase
    .from('countries')
    .select('*')
    .in('id', ids);
  const list = (data ?? []) as Country[];
  // Preserve input order
  const byId = new Map<string, Country>();
  for (const c of list) byId.set(c.id, c);
  return ids.map((i) => byId.get(i)).filter(Boolean) as Country[];
}

export interface GroupSlot {
  country: Country;
  participant: ParticipantWithDraw | null;
}

export interface GroupView {
  label: string;
  slots: GroupSlot[];
}

export async function buildGroupView(tournamentId: string): Promise<GroupView[]> {
  const countries = await listCountries();
  const participants = await listParticipantsForDraw(tournamentId);
  const byCountry = new Map<string, ParticipantWithDraw>();
  for (const p of participants) {
    if (p.country_id) byCountry.set(p.country_id, p);
  }
  const groups: Record<string, GroupSlot[]> = {};
  for (const c of countries) {
    if (!groups[c.group_label]) groups[c.group_label] = [];
    groups[c.group_label].push({ country: c, participant: byCountry.get(c.id) ?? null });
  }
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, slots]) => ({
      label,
      slots: slots.sort((a, b) => a.country.position - b.country.position),
    }));
}
