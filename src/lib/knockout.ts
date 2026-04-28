async function createFeeders(tournamentId: string, stageId: string): Promise<void> {
  const supabase = createClient();
  const { data: matches } = await supabase
    .from('matches')
    .select('id, round, match_number_in_round')
    .eq('stage_id', stageId)
    .order('round')
    .order('match_number_in_round');

  if (!matches) return;

  const byRoundAndNum = new Map<string, string>();
  for (const m of matches) {
    byRoundAndNum.set(`${m.round}-${m.match_number_in_round}`, m.id);
  }

  const transitions = [
    { fromRound: 1, toRound: 2 },
    { fromRound: 2, toRound: 3 },
    { fromRound: 3, toRound: 4 },
    { fromRound: 4, toRound: 5 },
  ];
  for (const t of transitions) {
    const fromMatches = matches.filter(m => m.round === t.fromRound);
    for (const fm of fromMatches) {
      const targetNum = Math.ceil(fm.match_number_in_round / 2);
      const targetId = byRoundAndNum.get(`${t.toRound}-${targetNum}`);
      if (!targetId) continue;
      const slot = (fm.match_number_in_round % 2 === 1) ? 'home' : 'away';
      await supabase.from('match_feeders').insert({
        match_id: targetId,
        feeder_match_id: fm.id,
        feeder_type: 'winner',
        target_slot: slot,
      });
    }
  }
}

export async function getBracketView(tournamentId: string) {
  const supabase = createClient();

  const { data: stage } = await supabase
    .from('stages')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('stage_type', 'single_elimination')
    .maybeSingle();

  if (!stage) return null;

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, round, match_number_in_round, status,
      home_score, away_score, home_pens, away_pens, decided_by,
      winner_participant_id,
      home:tournament_participants!matches_home_participant_id_fkey(
        id, player:players(username, display_name),
        country:countries(name, group_label)
      ),
      away:tournament_participants!matches_away_participant_id_fkey(
        id, player:players(username, display_name),
        country:countries(name, group_label)
      )
    `)
    .eq('stage_id', stage.id)
    .order('round')
    .order('match_number_in_round');

  if (!matches) return null;

  const rounds: Record<number, any[]> = {};
  for (const m of matches) {
    if (!rounds[m.round]) rounds[m.round] = [];
    rounds[m.round].push(m);
  }

  return rounds;
}
