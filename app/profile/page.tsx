// PASS-29-PROFILE-VIEW
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentPlayer, PLATFORM_LABELS } from '@/lib/player';
import { getPlayerStats } from '@/lib/stats';
import { signOut } from '../actions/auth';

export default async function ProfilePage() {
  const player = await getCurrentPlayer();
  if (!player) redirect('/signin');

  const stats = await getPlayerStats(player.id);

  const displayName = (player.display_name ?? player.username ?? '').toUpperCase();
  const initial = displayName.charAt(0) || '?';

  const platformLabel = player.platform
    ? (PLATFORM_LABELS as any)[player.platform] ?? player.platform
    : '—';

  return (
    <>
      <style>{`
        .pf-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 12px 14px;
          gap: 12px;
        }
        .pf-row + .pf-row {
          border-top: 1px solid var(--border);
        }
      `}</style>

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px 40px' }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: player.avatar_url
              ? `url(${player.avatar_url}) center/cover no-repeat`
              : 'linear-gradient(135deg, rgba(0,255,136,0.18), rgba(0,255,136,0.04))',
            border: '2px solid rgba(0,255,136,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            {!player.avatar_url && (
              <span style={{ fontSize: 44, color: 'var(--accent)', fontWeight: 800, lineHeight: 1 }}>
                {initial}
              </span>
            )}
          </div>

          <h1 style={{
            fontSize: 24,
            color: 'var(--accent)',
            fontWeight: 800,
            letterSpacing: '0.01em',
            margin: 0,
            marginBottom: 4,
          }}>
            {displayName}
          </h1>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>@{player.username}</div>

          <div style={{
            marginTop: 12,
            fontSize: 13,
            color: 'var(--text)',
            fontWeight: 700,
            letterSpacing: '0.14em',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {stats.wins}W · {stats.draws}D · {stats.losses}L
          </div>

          <Link href="/profile/edit" style={{
            marginTop: 20,
            display: 'inline-block',
            fontSize: 12,
            color: '#050a08',
            background: 'var(--accent)',
            padding: '10px 22px',
            borderRadius: 4,
            textDecoration: 'none',
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}>
            EDIT PROFILE →
          </Link>
        </div>

        {player.bio && (
          <div style={{ marginBottom: 24, padding: '14px 16px', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 6 }}>
            <div style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 6 }}>BIO</div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{player.bio}</div>
          </div>
        )}

        <div style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 10 }}>ACCOUNT</div>
        <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 6, marginBottom: 24, overflow: 'hidden' }}>
          <div className="pf-row">
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Platform</span>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{platformLabel}</span>
          </div>
          <div className="pf-row">
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Country</span>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{player.region ?? '—'}</span>
          </div>
          <div className="pf-row">
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Friend code</span>
            <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all', textAlign: 'right' }}>
              {player.game_id ?? '—'}
            </span>
          </div>
          <div className="pf-row">
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Discord</span>
            <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all', textAlign: 'right' }}>
              {player.discord_handle ?? '—'}
            </span>
          </div>
        </div>

        <div style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 10 }}>SECURITY</div>
        <div style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 6, marginBottom: 32, overflow: 'hidden' }}>
          <div className="pf-row">
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Recovery Q</span>
            <span style={{ fontSize: 13, color: 'var(--text)', textAlign: 'right' }}>
              {player.security_question ?? '—'}
            </span>
          </div>
        </div>

        <form action={signOut} style={{ textAlign: 'center' }}>
          <button type="submit" style={{
            background: 'transparent',
            border: '1px solid rgba(255, 80, 80, 0.3)',
            color: '#ff5050',
            fontSize: 12,
            padding: '10px 24px',
            borderRadius: 4,
            letterSpacing: '0.14em',
            fontWeight: 600,
            cursor: 'pointer',
            font: 'inherit',
          }}>
            SIGN OUT
          </button>
        </form>

      </main>
    </>
  );
}
