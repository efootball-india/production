// PASS-21-PAGE-TOURNAMENTS
import Link from 'next/link';
import { listTournaments, FORMAT_LABELS, STATUS_LABELS } from '@/lib/tournaments';
import { getCurrentPlayer } from '@/lib/player';

export default async function TournamentsPage() {
  const tournaments = await listTournaments();
  const player = await getCurrentPlayer();
  const isAdmin = player?.role === 'admin' || player?.role === 'super_admin';

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="auth-eyebrow">eFTBL</div>
          <h1 className="auth-h1" style={{ marginBottom: 0 }}>Tournaments</h1>
        </div>
        {isAdmin && (
          <Link href="/admin/tournaments/new" className="auth-button" style={{ padding: '8px 14px', width: 'auto' }}>
            + New tournament
          </Link>
        )}
      </div>

      {tournaments.length === 0 && (
        <div style={{ padding: 24, border: '1px solid var(--glass-border)', color: 'var(--text-2)', fontSize: 14 }}>
          No tournaments yet. {isAdmin && 'Click "New tournament" above to create the first one.'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tournaments.map((t) => (
          <Link
            key={t.id}
            href={`/tournaments/${t.slug}`}
            style={{
              display: 'block',
              padding: '18px 20px',
              background: 'var(--glass)',
              border: '1px solid var(--glass-border)',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'border-color 0.15s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{t.name}</h2>
              <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>{STATUS_LABELS[t.status]}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span>{FORMAT_LABELS[t.format]}</span>
              <span>{t.participant_count}{t.max_participants ? ` / ${t.max_participants}` : ''} players</span>
              {t.starts_at && (
                <span>Starts {new Date(t.starts_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
