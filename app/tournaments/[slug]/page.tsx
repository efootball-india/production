// PASS-1-PAGE-TOURNAMENT-DETAIL
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTournamentBySlug, isCurrentUserRegistered, FORMAT_LABELS, STATUS_LABELS } from '@/lib/tournaments';
import { getCurrentPlayer, isProfileComplete, PLATFORM_LABELS } from '@/lib/player';
import { registerForTournament, withdrawFromTournament } from '../../actions/tournaments';
import { getDrawState } from '@/lib/draw';

export default async function TournamentDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { registered?: string; withdrawn?: string; error?: string };
}) {
  const result = await getTournamentBySlug(params.slug);
  if (!result) notFound();
  const { tournament, participants } = result;

  const player = await getCurrentPlayer();
  const isRegistered = player ? await isCurrentUserRegistered(tournament.id) : false;
  const profileOk = player ? isProfileComplete(player) : false;
  const isAdmin = player?.role === 'admin' || player?.role === 'super_admin';
  const drawState = await getDrawState(tournament.id);

  const registeredCount = participants.filter((p: any) => p.status === 'registered').length;
  const capacityFull = tournament.max_participants ? registeredCount >= tournament.max_participants : false;
  const regOpen = tournament.status === 'registration_open' &&
    (!tournament.registration_closes_at || new Date(tournament.registration_closes_at) > new Date());

  return (
    <main className="auth-shell" style={{ alignItems: 'flex-start', paddingTop: 40 }}>
      <div style={{ maxWidth: 720, width: '100%', padding: '0 20px' }}>
        <Link href="/tournaments" style={{ color: 'var(--text-2)', fontSize: 13, display: 'inline-block', marginBottom: 16 }}>
          All tournaments
        </Link>

        {searchParams.registered && (
          <div style={{ padding: '10px 14px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', color: 'var(--accent)', fontSize: 13, marginBottom: 16 }}>
            You are registered. See you at the draw.
          </div>
        )}
        {searchParams.withdrawn && (
          <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 13, marginBottom: 16 }}>
            Withdrawn from this tournament.
          </div>
        )}
        {searchParams.error && (
          <div style={{ padding: '10px 14px', background: 'rgba(255,92,92,0.08)', border: '1px solid rgba(255,92,92,0.3)', color: '#ff5c5c', fontSize: 13, marginBottom: 16 }}>
            {searchParams.error}
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <div className="auth-eyebrow">{STATUS_LABELS[tournament.status]}</div>
          <h1 className="auth-h1" style={{ marginBottom: 8 }}>{tournament.name}</h1>
          {tournament.description && (
            <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.55 }}>{tournament.description}</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          <Meta label="Format" value={FORMAT_LABELS[tournament.format]} />
          <Meta label="Players" value={`${registeredCount}${tournament.max_participants ? ` / ${tournament.max_participants}` : ''}`} />
          {tournament.starts_at && (
            <Meta label="Starts" value={new Date(tournament.starts_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} />
          )}
          <Meta label="Draw" value={drawState.status === 'not_started' ? 'Not started' : drawState.status === 'in_progress' ? 'In progress' : 'Complete'} />
        </div>

        {isAdmin && (
          <div style={{ marginBottom: 24, padding: '12px 14px', background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.2)' }}>
            <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 6 }}>ADMIN</div>
            <Link href={`/admin/tournaments/${tournament.slug}/draw`} style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 500 }}>
              {drawState.status === 'not_started' && 'Set up group draw'}
              {drawState.status === 'in_progress' && 'Continue group draw'}
              {drawState.status === 'completed' && 'View / reset draw'}
            </Link>
          </div>
        )}

        <div style={{ marginBottom: 32, padding: '16px 18px', background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
          {!player && (
            <>
              <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 12 }}>Sign in to register.</p>
              <Link href="/signin" className="auth-button" style={{ display: 'inline-block', padding: '8px 16px', width: 'auto' }}>Sign in</Link>
            </>
          )}
          {player && !profileOk && (
            <>
              <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 12 }}>Complete your profile (set your platform) to register.</p>
              <Link href="/profile/edit" className="auth-button" style={{ display: 'inline-block', padding: '8px 16px', width: 'auto' }}>Complete profile</Link>
            </>
          )}
          {player && profileOk && isRegistered && (
            <>
              <p style={{ fontSize: 14, color: 'var(--accent)', marginBottom: 12 }}>You are registered.</p>
              {tournament.status === 'registration_open' && (
                <form action={withdrawFromTournament}>
                  <input type="hidden" name="slug" value={tournament.slug} />
                  <input type="hidden" name="tournament_id" value={tournament.id} />
                  <button type="submit" style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.16)', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer' }}>Withdraw</button>
                </form>
              )}
            </>
          )}
          {player && profileOk && !isRegistered && regOpen && !capacityFull && (
            <form action={registerForTournament}>
              <input type="hidden" name="slug" value={tournament.slug} />
              <button type="submit" className="auth-button" style={{ padding: '10px 20px', width: 'auto' }}>Register</button>
            </form>
          )}
          {player && profileOk && !isRegistered && regOpen && capacityFull && (
            <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>Tournament is full.</p>
          )}
          {player && profileOk && !isRegistered && !regOpen && (
            <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>Registration is closed.</p>
          )}
        </div>

        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12 }}>
            Players ({registeredCount})
          </h2>
          {participants.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No registrations yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border)' }}>
              {participants.map((p: any) => (
                <div key={p.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: 12,
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--bg)',
                  fontSize: 13,
                  opacity: p.status === 'withdrawn' ? 0.4 : 1,
                  textDecoration: p.status === 'withdrawn' ? 'line-through' : 'none',
                }}>
                  <span style={{ fontWeight: 500 }}>{p.player?.display_name ?? p.player?.username}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {p.player?.platform ? PLATFORM_LABELS[p.player.platform as keyof typeof PLATFORM_LABELS] : ''}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {p.player?.region ?? ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{value}</span>
    </div>
  );
}
