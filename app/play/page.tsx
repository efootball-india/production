// PASS-25-PAGE-PLAY-INDEX
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentPlayer } from '@/lib/player';
import { getMatchesForPlayer, roundLabel, type PlayerMatch } from '@/lib/upcoming';

export default async function PlayIndexPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect('/signin');

  const { upcoming, played } = await getMatchesForPlayer(player.id);
  const total = upcoming.length + played.length;

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 60px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>Matches</h1>
      <div style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.08em', marginTop: 4, marginBottom: 20, textTransform: 'uppercase', fontWeight: 600 }}>
        {upcoming.length} upcoming · {played.length} played
      </div>

      <div style={{
        border: '1px dashed rgba(0, 255, 136, 0.3)',
        borderRadius: 6,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
        gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.04em' }}>
            + CREATE A MATCH
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
            Schedule with another player
          </div>
        </div>
        <span style={{
          fontSize: 9,
          color: 'var(--text-3)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '3px 8px',
          borderRadius: 3,
          letterSpacing: '0.14em',
          fontWeight: 600,
          flexShrink: 0,
        }}>
          SOON
        </span>
      </div>

      {total === 0 ? (
        <EmptyState />
      ) : (
        <>
          {upcoming.length > 0 && (
            <Section title="UPCOMING" matches={upcoming} kind="upcoming" />
          )}
          {played.length > 0 && (
            <Section title="PLAYED" matches={played} kind="played" />
          )}
        </>
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 20px',
      border: '1px dashed rgba(255, 255, 255, 0.1)',
      borderRadius: 8,
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'rgba(0, 255, 136, 0.08)',
        border: '1px solid rgba(0, 255, 136, 0.2)',
        margin: '0 auto 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
      </div>
      <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600, marginBottom: 6 }}>No matches yet</div>
      <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 18, lineHeight: 1.5 }}>
        Register for a tournament to start playing.
      </div>
      <Link
        href="/tournaments"
        style={{
          display: 'inline-block',
          fontSize: 12,
          color: 'var(--accent)',
          border: '1px solid rgba(0, 255, 136, 0.4)',
          padding: '8px 16px',
          borderRadius: 4,
          textDecoration: 'none',
          fontWeight: 600,
          letterSpacing: '0.04em',
        }}
      >
        Browse tournaments →
      </Link>
    </div>
  );
}

function Section({ title, matches, kind }: { title: string; matches: PlayerMatch[]; kind: 'upcoming' | 'played' }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} kind={kind} />
        ))}
      </div>
    </section>
  );
}

function MatchCard({ match, kind }: { match: PlayerMatch; kind: 'upcoming' | 'played' }) {
  const m = match;
  const stageLabel = m.matchday != null ? `MD ${m.matchday}` : roundLabel(m.round) ?? '';
  const tournamentLabel = `${m.tournamentName.toUpperCase()} · ${stageLabel}`;
  const oppLabel = m.oppCountry ?? 'TBD';
  const oppUsername = m.oppUsername ?? '—';
  const href = `/play/${m.tournamentSlug}`;

  if (kind === 'upcoming') {
    const canSubmit = m.matchday != null && (
      m.status === 'awaiting_result' ||
      m.status === 'awaiting_confirmation' ||
      m.status === 'disputed'
    );
    const statusColor =
      m.status === 'awaiting_confirmation' ? '#ff9500' :
      m.status === 'disputed' ? '#ff5050' :
      'var(--text-3)';

    return (
      <Link href={href} style={{
        display: 'block',
        background: 'var(--glass)',
        border: '1px solid var(--glass-border)',
        borderRadius: 6,
        padding: '12px 14px',
        textDecoration: 'none',
        color: 'inherit',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, gap: 12 }}>
          <span style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.14em', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
            {tournamentLabel}
          </span>
          <span style={{ fontSize: 10, color: statusColor, letterSpacing: '0.08em', flexShrink: 0 }}>
            {statusLabel(m.status)}
          </span>
        </div>
        <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>
          {oppLabel} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>vs you</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{oppUsername}</div>
        {canSubmit && (
          <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 8, fontWeight: 600 }}>
            Submit score →
          </div>
        )}
      </Link>
    );
  }

  const result: 'won' | 'lost' | 'drew' =
    m.winnerIsMe === true ? 'won' :
    m.winnerIsMe === false ? 'lost' :
    'drew';

  const resultPill = {
    won: { bg: 'rgba(0,255,136,0.1)', color: 'var(--accent)', label: 'WON' },
    lost: { bg: 'rgba(255,80,80,0.1)', color: '#ff5050', label: 'LOST' },
    drew: { bg: 'rgba(255,255,255,0.06)', color: 'var(--text-2)', label: 'DREW' },
  }[result];

  const decoration =
    m.decidedBy === 'penalties' ? ' (P)' :
    m.decidedBy === 'extra_time' ? ' (AET)' :
    '';
  const myScoreDisplay = m.myScore != null ? m.myScore : '—';
  const oppScoreDisplay = m.oppScore != null ? m.oppScore : '—';

  return (
    <Link href={href} style={{
      display: 'block',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 6,
      padding: '12px 14px',
      textDecoration: 'none',
      color: 'inherit',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, gap: 12 }}>
        <span style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.14em', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
          {tournamentLabel}
        </span>
        <span style={{
          fontSize: 9,
          color: resultPill.color,
          background: resultPill.bg,
          padding: '2px 7px',
          borderRadius: 2,
          letterSpacing: '0.14em',
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {resultPill.label}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {oppLabel}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{oppUsername}</div>
        </div>
        <div style={{ fontSize: 18, color: 'var(--text)', fontWeight: 800, letterSpacing: '0.02em', flexShrink: 0 }}>
          {myScoreDisplay} — {oppScoreDisplay}{decoration}
        </div>
      </div>
    </Link>
  );
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Awaiting bracket',
    awaiting_result: 'Awaiting result',
    awaiting_confirmation: 'Awaiting confirm',
    disputed: 'Disputed',
    walkover: 'Walkover',
  };
  return map[status] ?? status;
}
