// PASS-40-TOURNAMENT-LAYOUT
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTournamentBySlug, isCurrentUserRegistered, FORMAT_LABELS, STATUS_LABELS } from '@/lib/tournaments';
import { getCurrentPlayer, isProfileComplete } from '@/lib/player';
import { getDrawState } from '@/lib/draw';
import { fixturesExist } from '@/lib/fixtures';
import { registerForTournament, withdrawFromTournament } from '../../actions/tournaments';
import TournamentTabs from '../../../components/TournamentTabs';

export default async function TournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const result = await getTournamentBySlug(params.slug);
  if (!result) notFound();
  const { tournament, participants } = result;

  const player = await getCurrentPlayer();
  const isRegistered = player ? await isCurrentUserRegistered(tournament.id) : false;
  const profileOk = player ? isProfileComplete(player) : false;
  const isAdmin = player?.role === 'admin' || player?.role === 'super_admin';
  const isMod = isAdmin || player?.role === 'moderator';
  const drawState = await getDrawState(tournament.id);
  const hasFixtures = await fixturesExist(tournament.id);

  const registeredCount = participants.filter((p: any) => p.status === 'registered').length;
  const capacityFull = tournament.max_participants ? registeredCount >= tournament.max_participants : false;
  const regOpen = tournament.status === 'registration_open' &&
    (!tournament.registration_closes_at || new Date(tournament.registration_closes_at) > new Date());

  const statusColor =
    tournament.status === 'registration_open' ? '#00ff88' :
    tournament.status === 'in_progress' ? '#ff9500' :
    tournament.status === 'completed' ? 'var(--text-2)' :
    'var(--text-3)';
  const statusBg =
    tournament.status === 'registration_open' ? 'rgba(0,255,136,0.1)' :
    tournament.status === 'in_progress' ? 'rgba(255,149,0,0.1)' :
    'rgba(255,255,255,0.06)';

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '20px 20px 60px' }}>
      <Link href="/tournaments" style={{ color: 'var(--text-3)', fontSize: 12, display: 'inline-block', marginBottom: 16 }}>
        ← All tournaments
      </Link>

      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 6, letterSpacing: '-0.01em' }}>
        {tournament.name}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: tournament.description ? 12 : 16 }}>
        <span style={{
          fontSize: 9,
          color: statusColor,
          background: statusBg,
          padding: '3px 8px',
          borderRadius: 2,
          letterSpacing: '0.14em',
          fontWeight: 700,
        }}>
          {STATUS_LABELS[tournament.status as keyof typeof STATUS_LABELS]?.toUpperCase() ?? tournament.status.toUpperCase()}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {FORMAT_LABELS[tournament.format as keyof typeof FORMAT_LABELS] ?? tournament.format} · {registeredCount}{tournament.max_participants ? ` / ${tournament.max_participants}` : ''} players
        </span>
      </div>
      {tournament.description && (
        <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.5, margin: 0, marginBottom: 16 }}>{tournament.description}</p>
      )}

      <div style={{ marginBottom: 18 }}>
        {!player && (
          <Link href="/signin" className="auth-button" style={{ display: 'inline-block', padding: '8px 16px', width: 'auto', fontSize: 12 }}>
            Sign in to register
          </Link>
        )}
        {player && !profileOk && (
          <Link href="/profile/edit" className="auth-button" style={{ display: 'inline-block', padding: '8px 16px', width: 'auto', fontSize: 12 }}>
            Complete profile to register
          </Link>
        )}
        {player && profileOk && !isRegistered && regOpen && !capacityFull && (
          <form action={registerForTournament}>
            <input type="hidden" name="slug" value={tournament.slug} />
            <button type="submit" className="auth-button" style={{ padding: '10px 20px', width: 'auto', fontSize: 13 }}>
              Register
            </button>
          </form>
        )}
        {player && profileOk && !isRegistered && regOpen && capacityFull && (
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Tournament is full</span>
        )}
        {player && profileOk && isRegistered && tournament.status === 'registration_open' && (
          <form action={withdrawFromTournament}>
            <input type="hidden" name="slug" value={tournament.slug} />
            <input type="hidden" name="tournament_id" value={tournament.id} />
            <button type="submit" style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.16)',
              color: 'var(--text-2)',
              fontSize: 12,
              cursor: 'pointer',
              borderRadius: 4,
            }}>
              You're registered · Withdraw
            </button>
          </form>
        )}
        {player && profileOk && isRegistered && tournament.status !== 'registration_open' && (
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>✓ You're in this tournament</span>
        )}
      </div>

      {isAdmin && (
        <div style={{ padding: '10px 14px', background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 6, marginBottom: 12, fontSize: 12 }}>
          <span style={{ color: 'var(--accent)', letterSpacing: '0.12em', fontWeight: 700, marginRight: 12 }}>ADMIN</span>
          <Link href={`/admin/tournaments/${tournament.slug}/draw`} style={{ color: 'var(--accent)', marginRight: 14 }}>
            {drawState.status === 'completed' ? 'Draw' : drawState.status === 'in_progress' ? 'Continue draw' : 'Set up draw'}
          </Link>
          {drawState.status === 'completed' && (
            <Link href={`/admin/tournaments/${tournament.slug}/fixtures`} style={{ color: 'var(--accent)', marginRight: 14 }}>
              Fixtures
            </Link>
          )}
          {hasFixtures && (
            <Link href={`/admin/tournaments/${tournament.slug}/matches`} style={{ color: 'var(--accent)' }}>
              All matches
            </Link>
          )}
        </div>
      )}

      {isMod && hasFixtures && (
        <div style={{ padding: '10px 14px', background: 'rgba(255,149,0,0.04)', border: '1px solid rgba(255,149,0,0.2)', borderRadius: 6, marginBottom: 12, fontSize: 12 }}>
          <span style={{ color: '#ff9500', letterSpacing: '0.12em', fontWeight: 700, marginRight: 12 }}>MOD</span>
          <Link href={`/admin/tournaments/${tournament.slug}/queue`} style={{ color: '#ff9500' }}>
            Match queue
          </Link>
        </div>
      )}

      <TournamentTabs slug={tournament.slug} />

      <div style={{ paddingTop: 20 }}>
        {children}
      </div>
    </main>
  );
}
