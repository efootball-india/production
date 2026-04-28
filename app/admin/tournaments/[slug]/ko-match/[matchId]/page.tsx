// PASS-3-PAGE-KO-MATCH
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentPlayer } from '@/lib/player';
import { submitKnockoutScore } from '../../../../../actions/knockout';

const ROUND_LABELS: Record<number, string> = {
  1: 'Round of 32',
  2: 'Round of 16',
  3: 'Quarter-final',
  4: 'Semi-final',
  5: 'Final',
};

export default async function KoMatchPage({
  params,
  searchParams,
}: {
  params: { slug: string; matchId: string };
  searchParams: { error?: string };
}) {
  const player = await getCurrentPlayer();
  if (!player) redirect('/signin');
  if (!['moderator', 'admin', 'super_admin'].includes(player.role)) redirect('/');

  const supabase = createClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, slug')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tournament) notFound();

  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, round, match_number_in_round, status,
      home_score, away_score, home_pens, away_pens, decided_by,
      home:tournament_participants!matches_home_participant_id_fkey(
        id, player:players(username, display_name),
        country:countries(name, group_label)
      ),
      away:tournament_participants!matches_away_participant_id_fkey(
        id, player:players(username, display_name),
        country:countries(name, group_label)
      )
    `)
    .eq('id', params.matchId)
    .eq('tournament_id', tournament.id)
    .maybeSingle();

  if (!match) notFound();

  const home: any = match.home;
  const away: any = match.away;

  if (!home || !away) {
    return (
      <main style={{ minHeight: '100vh', maxWidth: 520, margin: '0 auto', padding: '24px 20px' }}>
        <Link href={`/tournaments/${tournament.slug}/bracket`} style={{ color: 'var(--text-2)', fontSize: 13 }}>← Bracket</Link>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginTop: 12 }}>Match not ready</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>
          This match doesn&apos;t have both participants yet. Both feeder matches must complete first.
        </p>
      </main>
    );
  }

  const homeName = home.country?.name ?? '?';
  const awayName = away.country?.name ?? '?';
  const homeUser = home.player?.username ?? '?';
  const awayUser = away.player?.username ?? '?';

  const completed = match.status === 'completed';

  return (
    <main style={{ minHeight: '100vh', maxWidth: 520, margin: '0 auto', padding: '24px 20px 60px' }}>
      <Link href={`/tournaments/${tournament.slug}/bracket`} style={{ color: 'var(--text-2)', fontSize: 13 }}>← Bracket</Link>

      <div style={{ marginTop: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.05em', marginBottom: 4 }}>
          {ROUND_LABELS[match.round]?.toUpperCase()} · MATCH {match.match_number_in_round}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>
          {completed ? 'Edit result' : 'Enter result'}
        </h1>
      </div>

      {searchParams.error && (
        <div style={{ padding: '10px 14px', background: 'rgba(255,92,92,0.08)', border: '1px solid rgba(255,92,92,0.3)', color: '#ff5c5c', fontSize: 13, marginBottom: 16 }}>
          {searchParams.error}
        </div>
      )}

      {completed && (
        <div style={{ padding: '10px 14px', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', fontSize: 12, color: 'var(--text-2)', marginBottom: 16 }}>
          Currently recorded: <strong>{match.home_score}–{match.away_score}</strong>
          {match.decided_by === 'penalties' && match.home_pens != null && match.away_pens != null && (
            <> ({match.home_pens}–{match.away_pens} on pens)</>
          )}
          {match.decided_by === 'extra_time' && <> (a.e.t.)</>}
        </div>
      )}

      <form action={submitKnockoutScore} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <input type="hidden" name="match_id" value={match.id} />
        <input type="hidden" name="slug" value={tournament.slug} />

        {/* Score */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>
              {homeName} <span style={{ opacity: 0.5 }}>· {homeUser}</span>
            </label>
            <input
              type="number" name="home_score" min={0} max={50} required
              defaultValue={match.home_score ?? ''}
              className="auth-input" style={{ fontSize: 18, textAlign: 'center', width: '100%' }}
            />
          </div>
          <div style={{ paddingBottom: 12, fontSize: 14, color: 'var(--text-3)' }}>–</div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4, textAlign: 'right' }}>
              {awayName} <span style={{ opacity: 0.5 }}>· {awayUser}</span>
            </label>
            <input
              type="number" name="away_score" min={0} max={50} required
              defaultValue={match.away_score ?? ''}
              className="auth-input" style={{ fontSize: 18, textAlign: 'center', width: '100%' }}
            />
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
          Score is the aggregate after regulation + extra time. If tied, fill in penalty shootout below.
        </div>

        {/* ET checkbox */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
          <input
            type="checkbox" name="went_to_et"
            defaultChecked={match.decided_by === 'extra_time' || match.decided_by === 'penalties'}
          />
          <span>Match went to extra time</span>
        </label>

        {/* Penalty shootout */}
        <fieldset style={{ border: '1px solid var(--border)', padding: '12px 14px' }}>
          <legend style={{ fontSize: 11, color: 'var(--text-3)', padding: '0 6px' }}>Penalty shootout (only if tied after ET)</legend>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer', marginBottom: 12 }}>
            <input
              type="checkbox" name="went_to_pens"
              defaultChecked={match.decided_by === 'penalties'}
            />
            <span>Decided by penalties</span>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
            <input
              type="number" name="home_pens" min={0} max={20}
              defaultValue={match.home_pens ?? ''}
              placeholder="—"
              className="auth-input" style={{ fontSize: 14, textAlign: 'center', width: '100%' }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>–</span>
            <input
              type="number" name="away_pens" min={0} max={20}
              defaultValue={match.away_pens ?? ''}
              placeholder="—"
              className="auth-input" style={{ fontSize: 14, textAlign: 'center', width: '100%' }}
            />
          </div>
        </fieldset>

        <button type="submit" className="auth-button" style={{ marginTop: 8 }}>
          {completed ? 'Update result' : 'Save result'}
        </button>
      </form>
    </main>
  );
}
