// PASS-2-PAGE-PLAY
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentPlayer } from '@/lib/player';
import { getParticipantFixtures, getGroupStandings } from '@/lib/fixtures';
import { submitScore } from '../../actions/fixtures';

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: { slug: string };
searchParams: { submitted?: string; completed?: string; error?: string };
}) {
  const player = await getCurrentPlayer();
  if (!player) redirect('/signin');

  const supabase = createClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, slug, status')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tournament) notFound();

  // Find this player's participant record
  const { data: participant } = await supabase
    .from('tournament_participants')
    .select(`
      id, status, country_id,
      country:countries(id, name, group_label, position)
    `)
    .eq('tournament_id', tournament.id)
    .eq('player_id', player.id)
    .maybeSingle();

  if (!participant) {
    return (
      <main className="auth-shell" style={{ paddingTop: 60 }}>
        <div style={{ maxWidth: 520, padding: '0 20px' }}>
          <Link href={`/tournaments/${tournament.slug}`} style={{ color: 'var(--text-2)', fontSize: 13 }}>{tournament.name}</Link>
          <h1 className="auth-h1" style={{ marginTop: 12 }}>Not registered</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>You are not registered for this tournament.</p>
        </div>
      </main>
    );
  }

  const country: any = (participant as any).country;

  if (!country) {
    return (
      <main className="auth-shell" style={{ paddingTop: 60 }}>
        <div style={{ maxWidth: 520, padding: '0 20px' }}>
          <Link href={`/tournaments/${tournament.slug}`} style={{ color: 'var(--text-2)', fontSize: 13 }}>{tournament.name}</Link>
          <h1 className="auth-h1" style={{ marginTop: 12 }}>Waiting for the draw</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>You haven&apos;t been drawn yet. Check back after the group draw.</p>
        </div>
      </main>
    );
  }

  // Find this player's group
  const { data: stage } = await supabase
    .from('stages')
    .select('id')
    .eq('tournament_id', tournament.id)
    .eq('stage_type', 'groups')
    .maybeSingle();

  let standings: any[] = [];
  let groupId: string | null = null;
  if (stage) {
    const { data: group } = await supabase
      .from('groups')
      .select('id')
      .eq('stage_id', stage.id)
      .eq('name', `Group ${country.group_label}`)
      .maybeSingle();
    if (group) {
      groupId = group.id;
      standings = await getGroupStandings(group.id);
    }
  }

  const fixtures = await getParticipantFixtures(participant.id);

  // Compute personal record
  let played = 0, wins = 0, draws = 0, losses = 0;
  for (const f of fixtures) {
    if ((f as any).status !== 'completed') continue;
    const isHome = (f as any).home_participant_id === participant.id;
    const my = isHome ? (f as any).home_score : (f as any).away_score;
    const opp = isHome ? (f as any).away_score : (f as any).home_score;
    if (my == null || opp == null) continue;
    played++;
    if (my > opp) wins++;
    else if (my < opp) losses++;
    else draws++;
  }

  return (
    <main style={{ minHeight: '100vh', maxWidth: 760, margin: '0 auto', padding: '24px 20px 60px' }}>
      <Link href={`/tournaments/${tournament.slug}`} style={{ color: 'var(--text-2)', fontSize: 13 }}>← {tournament.name}</Link>

      <div style={{ marginTop: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>YOUR TEAM</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{country.name}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Group {country.group_label} · Played {played} · {wins}W {draws}D {losses}L</p>
      </div>

      {searchParams.completed && (
  <div style={{ padding: '10px 14px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', color: 'var(--accent)', fontSize: 13, marginBottom: 16 }}>
    Match recorded.
  </div>
)}
{searchParams.submitted && (
  <div style={{ padding: '10px 14px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', color: 'var(--accent)', fontSize: 13, marginBottom: 16 }}>
    Score submitted. Waiting on opponent confirmation.
  </div>
)}
      {searchParams.error && (
        <div style={{ padding: '10px 14px', background: 'rgba(255,92,92,0.08)', border: '1px solid rgba(255,92,92,0.3)', color: '#ff5c5c', fontSize: 13, marginBottom: 16 }}>
          {searchParams.error}
        </div>
      )}

      {/* Fixtures */}
      <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Your fixtures</h2>
      {fixtures.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 32 }}>Fixtures haven&apos;t been generated yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          {fixtures.map((f: any) => (
            <FixtureCard key={f.id} fixture={f} myParticipantId={participant.id} slug={tournament.slug} />
          ))}
        </div>
      )}

      {/* Group standings */}
      {standings.length > 0 && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Group {country.group_label} standings</h2>
          <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 28px 28px 28px 32px 32px 36px', gap: 8, padding: '8px 12px', fontSize: 11, color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
              <span></span>
              <span>Team</span>
              <span style={{ textAlign: 'right' }}>P</span>
              <span style={{ textAlign: 'right' }}>W</span>
              <span style={{ textAlign: 'right' }}>L</span>
              <span style={{ textAlign: 'right' }}>GF</span>
              <span style={{ textAlign: 'right' }}>GA</span>
              <span style={{ textAlign: 'right' }}>Pts</span>
            </div>
            {standings.map(s => (
              <div key={s.participant_id} style={{
                display: 'grid',
                gridTemplateColumns: '24px 1fr 28px 28px 28px 32px 32px 36px',
                gap: 8, padding: '8px 12px', fontSize: 13,
                borderBottom: '1px solid var(--border)',
                background: s.participant_id === participant.id ? 'rgba(0,255,136,0.04)' : 'transparent',
              }}>
                <span style={{ color: 'var(--text-3)' }}>{s.position}</span>
                <span>
                  {s.country?.name}
                  {s.needs_tiebreaker && <span style={{ marginLeft: 6, fontSize: 10, color: '#ff9500' }}>TIE</span>}
                </span>
                <span style={{ textAlign: 'right' }}>{s.played}</span>
                <span style={{ textAlign: 'right' }}>{s.wins}</span>
                <span style={{ textAlign: 'right' }}>{s.losses}</span>
                <span style={{ textAlign: 'right' }}>{s.goals_for}</span>
                <span style={{ textAlign: 'right' }}>{s.goals_against}</span>
                <span style={{ textAlign: 'right', fontWeight: 600 }}>{s.points}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

function FixtureCard({ fixture, myParticipantId, slug }: any) {
  const isHome = fixture.home_participant_id === myParticipantId;
  const me = isHome ? fixture.home : fixture.away;
  const opp = isHome ? fixture.away : fixture.home;

  const myCountry = me?.country?.name ?? 'TBD';
  const oppCountry = opp?.country?.name ?? 'TBD';
  const oppPlayer = opp?.player;

  const myScore = isHome ? fixture.home_score : fixture.away_score;
  const oppScore = isHome ? fixture.away_score : fixture.home_score;
  const completed = fixture.status === 'completed';
  const disputed = fixture.status === 'disputed';
  const awaiting = fixture.status === 'awaiting_confirmation';
  const playable = fixture.status === 'awaiting_result' || awaiting || disputed;

  return (
    <div style={{
      background: 'var(--glass)',
      border: '1px solid var(--glass-border)',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Match Day {fixture.matchday}</span>
        <FixtureStatus status={fixture.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{myCountry}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>You</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-2)', textAlign: 'center', minWidth: 60 }}>
          {completed && myScore != null && oppScore != null ? `${myScore} – ${oppScore}` : 'vs'}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{oppCountry}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{oppPlayer?.username ?? '—'}</div>
        </div>
      </div>

      {oppPlayer && (
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <span style={{ marginRight: 12 }}>Discord: <strong style={{ color: 'var(--text-2)' }}>{oppPlayer.discord_handle ?? '—'}</strong></span>
          <span style={{ marginRight: 12 }}>Platform: <strong style={{ color: 'var(--text-2)' }}>{oppPlayer.platform ?? '—'}</strong></span>
          {oppPlayer.game_id && <span>Game ID: <strong style={{ color: 'var(--text-2)' }}>{oppPlayer.game_id}</strong></span>}
        </div>
      )}

      {playable && (
        <details>
          <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--accent)' }}>
            {awaiting && fixture.reported_by !== myParticipantId ? 'Confirm result' : 'Submit result'}
          </summary>
          <form action={submitScore} style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <input type="hidden" name="match_id" value={fixture.id} />
            <input type="hidden" name="slug" value={slug} />
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>Your goals</label>
              <input
                type="number" name={isHome ? 'home_score' : 'away_score'}
                min={0} max={50} required
                className="auth-input" style={{ width: 60 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>Opp goals</label>
              <input
                type="number" name={isHome ? 'away_score' : 'home_score'}
                min={0} max={50} required
                className="auth-input" style={{ width: 60 }}
              />
            </div>
            <button type="submit" className="auth-button" style={{ padding: '8px 16px', width: 'auto' }}>Submit</button>
          </form>
          {disputed && (
            <p style={{ fontSize: 11, color: '#ff9500', marginTop: 8 }}>
              Your submission disagreed with your opponent&apos;s. Resubmit if you made a typo, otherwise wait for admin to resolve.
            </p>
          )}
        </details>
      )}
    </div>
  );
}

function FixtureStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'var(--text-3)' },
    awaiting_result: { label: 'Awaiting result', color: 'var(--text-2)' },
    awaiting_confirmation: { label: 'Awaiting confirmation', color: '#ff9500' },
    disputed: { label: 'Disputed', color: '#ff5c5c' },
    completed: { label: 'Completed', color: 'var(--accent)' },
    walkover: { label: 'Walkover', color: 'var(--text-2)' },
  };
  const m = map[status] ?? { label: status, color: 'var(--text-3)' };
  return <span style={{ fontSize: 11, color: m.color }}>{m.label}</span>;
}
