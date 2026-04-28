// PASS-1-PAGE-DRAW
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentPlayer } from '@/lib/player';
import { getDrawState, listParticipantsForDraw, buildGroupView, listAvailableCountries, maxRerollsForWinner } from '@/lib/draw';
import { toggleQuizWinner, startDraw, spinForParticipant, acceptDraw, completeDraw, resetDraw } from '../../../../actions/draw';
import { createClient } from '@/lib/supabase/server';

export default async function DrawPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { revealed?: string; for?: string; error?: string };
}) {
  const player = await getCurrentPlayer();
  if (!player) redirect('/signin');
  if (player.role !== 'admin' && player.role !== 'super_admin') redirect('/');

  const supabase = createClient();
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tournament) notFound();

  const drawState = await getDrawState(tournament.id);
  const participants = await listParticipantsForDraw(tournament.id);
  const groups = await buildGroupView(tournament.id);
  const available = await listAvailableCountries(tournament.id);

  const active = participants.filter(p => p.status === 'registered');
  const undrawnPlayers = active.filter(p => !p.country_id);
  const currentPlayer = undrawnPlayers[0] ?? null;

  const justRevealed = searchParams.revealed && searchParams.for
    ? participants.find(p => p.id === searchParams.for) ?? null
    : null;
  const justRevealedCountry = justRevealed?.country ?? null;
  const justRevealedIsWinner = justRevealed?.is_quiz_winner ?? false;
  const rerollsRemaining = justRevealedIsWinner
    ? Math.max(0, maxRerollsForWinner() - (justRevealed?.rerolls_used ?? 0))
    : 0;

  return (
    <main style={{ minHeight: '100vh', padding: '24px 20px 60px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <Link href={`/tournaments/${tournament.slug}`} style={{ color: 'var(--text-2)', fontSize: 13 }}>{tournament.name}</Link>
          <h1 style={{ fontSize: 26, fontWeight: 600, marginTop: 8, marginBottom: 4 }}>Group Draw</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Status: {drawState.status} · {active.length - undrawnPlayers.length} of {active.length} drawn
          </p>
        </div>
        {drawState.status === 'completed' && (
          <span style={{ fontSize: 12, padding: '4px 10px', background: 'rgba(0,255,136,0.1)', color: 'var(--accent)', border: '1px solid rgba(0,255,136,0.3)' }}>Draw complete</span>
        )}
      </div>

      {searchParams.error && (
        <div style={{ padding: '10px 14px', background: 'rgba(255,92,92,0.08)', border: '1px solid rgba(255,92,92,0.3)', color: '#ff5c5c', fontSize: 13, marginBottom: 16 }}>{searchParams.error}</div>
      )}

      {drawState.status === 'not_started' && (
        <SetupPhase slug={tournament.slug} participants={active} canStart={active.length > 0} />
      )}

      {drawState.status === 'in_progress' && (
        <>
          {justRevealedCountry && (
            <RevealBanner
              participant={justRevealed!}
              countryName={justRevealedCountry.name}
              countryGroup={justRevealedCountry.group_label}
              slug={tournament.slug}
              isQuizWinner={justRevealedIsWinner}
              rerollsRemaining={rerollsRemaining}
            />
          )}
          {!justRevealedCountry && currentPlayer && (
            <CurrentPlayerCard participant={currentPlayer} slug={tournament.slug} poolSize={available.length} />
          )}
          {!currentPlayer && undrawnPlayers.length === 0 && (
            <div style={{ padding: 20, background: 'var(--glass)', border: '1px solid rgba(0,255,136,0.3)', marginBottom: 24 }}>
              <p style={{ fontSize: 14, marginBottom: 12 }}>All players drawn. Confirm to lock the draw and start the tournament.</p>
              <form action={completeDraw}>
                <input type="hidden" name="slug" value={tournament.slug} />
                <button type="submit" className="auth-button" style={{ width: 'auto', padding: '10px 20px' }}>Complete draw</button>
              </form>
            </div>
          )}
        </>
      )}

      <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginTop: 32, marginBottom: 12 }}>Groups</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {groups.map(g => (
          <div key={g.label} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '12px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8 }}>Group {g.label}</div>
            {g.slots.map(s => (
              <div key={s.country.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: s.participant ? 'var(--text)' : 'var(--text-3)' }}>{s.country.name}</span>
                <span style={{ fontSize: 11, color: 'var(--accent)' }}>{s.participant?.player?.username ?? '—'}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {drawState.status !== 'not_started' && (
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <details>
            <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--text-3)' }}>Danger zone</summary>
            <form action={resetDraw} style={{ marginTop: 12 }}>
              <input type="hidden" name="slug" value={tournament.slug} />
              <button type="submit" style={{ padding: '8px 14px', background: 'rgba(255,92,92,0.08)', border: '1px solid rgba(255,92,92,0.3)', color: '#ff5c5c', fontSize: 13, cursor: 'pointer' }}>
                Reset draw (locked once a match is played)
              </button>
            </form>
          </details>
        </div>
      )}
    </main>
  );
}

function SetupPhase({ slug, participants, canStart }: any) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ padding: 16, background: 'var(--glass)', border: '1px solid var(--glass-border)', marginBottom: 24 }}>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 0 }}>
          Mark quiz winners (they get 2 rerolls during the draw), then start the draw. The draw goes in registration order.
        </p>
      </div>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Registered players ({participants.length})</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border)', marginBottom: 24 }}>
        {participants.map((p: any, i: number) => (
          <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto auto', gap: 12, alignItems: 'center', padding: '8px 14px', background: 'var(--bg)', fontSize: 13 }}>
            <span style={{ color: 'var(--text-3)', fontSize: 12 }}>{i + 1}</span>
            <span>{p.player?.display_name ?? p.player?.username}</span>
            <span style={{ fontSize: 11, color: p.is_quiz_winner ? 'var(--accent)' : 'var(--text-3)' }}>{p.is_quiz_winner ? 'Quiz winner' : ''}</span>
            <form action={toggleQuizWinner}>
              <input type="hidden" name="participant_id" value={p.id} />
              <input type="hidden" name="slug" value={slug} />
              <button type="submit" style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 11, cursor: 'pointer' }}>
                {p.is_quiz_winner ? 'Unmark' : 'Mark winner'}
              </button>
            </form>
          </div>
        ))}
      </div>
      <form action={startDraw}>
        <input type="hidden" name="slug" value={slug} />
        <button type="submit" disabled={!canStart} className="auth-button" style={{ width: 'auto', padding: '10px 24px' }}>
          Start draw
        </button>
      </form>
    </div>
  );
}

function CurrentPlayerCard({ participant, slug, poolSize }: any) {
  return (
    <div style={{ padding: 24, background: 'var(--glass)', border: '1px solid var(--glass-border)', marginBottom: 24 }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>NEXT UP</div>
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>
        {participant.player?.display_name ?? participant.player?.username}
        {participant.is_quiz_winner && (
          <span style={{ marginLeft: 12, fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>QUIZ WINNER · 3 spins</span>
        )}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>{poolSize} countries left in the pool</p>
      <form action={spinForParticipant}>
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="participant_id" value={participant.id} />
        <button type="submit" className="auth-button" style={{ width: 'auto', padding: '12px 32px', fontSize: 14 }}>Spin</button>
      </form>
    </div>
  );
}

function RevealBanner({ participant, countryName, countryGroup, slug, isQuizWinner, rerollsRemaining }: any) {
  const canReroll = isQuizWinner && rerollsRemaining > 0;
  return (
    <div style={{ padding: 24, background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.4)', marginBottom: 24 }}>
      <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 6 }}>JUST DRAWN</div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
        {participant.player?.display_name ?? participant.player?.username}
      </div>
      <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>{countryName}</h2>
      <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>
        Group {countryGroup}
        {isQuizWinner && ` · ${rerollsRemaining} reroll${rerollsRemaining === 1 ? '' : 's'} remaining`}
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <form action={acceptDraw}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="participant_id" value={participant.id} />
          <button type="submit" className="auth-button" style={{ width: 'auto', padding: '10px 24px' }}>Accept &amp; next player</button>
        </form>
        {canReroll && (
          <form action={spinForParticipant}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="participant_id" value={participant.id} />
            <button type="submit" style={{ padding: '10px 24px', background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: 14, cursor: 'pointer' }}>
              Reroll ({rerollsRemaining} left)
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
