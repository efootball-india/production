// PASS-32-FORMATIONS
import { redirect } from 'next/navigation';
import { getCurrentPlayer } from '@/lib/player';

export default async function FormationsPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect('/signin');

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 60px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>Formations</h1>
      <div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.08em', marginTop: 4, marginBottom: 24, textTransform: 'uppercase', fontWeight: 600 }}>
        Plan your tactics
      </div>

      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        border: '1px dashed rgba(0, 255, 136, 0.3)',
        borderRadius: 8,
      }}>
        <svg
          viewBox="0 0 100 140"
          width="120"
          height="168"
          fill="none"
          stroke="#00ff88"
          strokeWidth="1"
          strokeLinecap="round"
          aria-hidden="true"
          style={{ marginBottom: 24, display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
        >
          <rect x="6" y="6" width="88" height="128" rx="3" strokeDasharray="3 3" opacity="0.5" />
          <line x1="6" y1="70" x2="94" y2="70" opacity="0.5" />
          <circle cx="50" cy="70" r="12" opacity="0.5" />
          <circle cx="50" cy="125" r="3.5" fill="#00ff88" />
          <circle cx="20" cy="100" r="3.5" fill="#00ff88" />
          <circle cx="40" cy="100" r="3.5" fill="#00ff88" />
          <circle cx="60" cy="100" r="3.5" fill="#00ff88" />
          <circle cx="80" cy="100" r="3.5" fill="#00ff88" />
          <circle cx="30" cy="75" r="3.5" fill="#00ff88" />
          <circle cx="50" cy="75" r="3.5" fill="#00ff88" />
          <circle cx="70" cy="75" r="3.5" fill="#00ff88" />
          <circle cx="30" cy="40" r="3.5" fill="#00ff88" />
          <circle cx="50" cy="35" r="3.5" fill="#00ff88" />
          <circle cx="70" cy="40" r="3.5" fill="#00ff88" />
        </svg>

        <div style={{ fontSize: 16, color: 'var(--text)', fontWeight: 600, marginBottom: 8 }}>
          Coming soon
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 360, margin: '0 auto 18px', lineHeight: 1.55 }}>
          Design your own formations and lineups. Save different tactics for different opponents and switch between them when you play.
        </div>

        <span style={{
          display: 'inline-block',
          fontSize: 10,
          color: 'var(--accent)',
          border: '1px solid rgba(0, 255, 136, 0.4)',
          padding: '4px 12px',
          borderRadius: 3,
          letterSpacing: '0.18em',
          fontWeight: 700,
        }}>
          SOON
        </span>
      </div>
    </main>
  );
}
