// PASS-26-PAGE-PLAY-INDEX (editorial)
import { getConsistencyRanking, seasonWindow } from '@/lib/consistency';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentPlayer } from '@/lib/player';
import CommunityCard from '../../components/CommunityCard';
import {
  getMatchesForPlayer,
  roundLabel,
  type PlayerMatch,
} from '@/lib/upcoming';

type Bucket = 'submit' | 'confirm' | 'disputed' | 'waiting';

function bucketFor(m: PlayerMatch): Bucket {
  if (m.matchday == null) {
    if (
      m.status === 'awaiting_result' ||
      m.status === 'awaiting_confirmation' ||
      m.status === 'disputed'
    ) {
      // KO match with action available
    } else {
      return 'waiting';
    }
  }
  if (m.status === 'disputed') return 'disputed';
  if (m.status === 'awaiting_confirmation') return 'confirm';
  if (m.status === 'awaiting_result') return 'submit';
  return 'waiting';
}

function stageLabelOf(m: PlayerMatch): string {
  if (m.matchday != null) return `MD ${m.matchday}`;
  return roundLabel(m.round) ?? '';
}

function tournamentEyebrow(m: PlayerMatch): string {
  const stage = stageLabelOf(m);
  return stage
    ? `${m.tournamentName.toUpperCase()} · ${stage}`
    : m.tournamentName.toUpperCase();
}

export default async function PlayIndexPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect('/signin');

  const { upcoming, played } = await getMatchesForPlayer(player.id);
  const ranking = await getConsistencyRanking();
  const { label: seasonLabel } = seasonWindow();
  const total = upcoming.length + played.length;

  const action: PlayerMatch[] = [];
  const waiting: PlayerMatch[] = [];
  for (const m of upcoming) {
    const b = bucketFor(m);
    if (b === 'submit' || b === 'confirm' || b === 'disputed') action.push(m);
    else waiting.push(m);
  }

  return (
    <>
      <Styles />
      <main className="efp-page">
   <div className="efp-head">
          <h1 className="efp-title">
            Your <span className="accent">matches.</span>
          </h1>
          <div className="efp-sub">
            {action.length} ACTION · {waiting.length} WAITING ·{' '}
            {played.length} PLAYED
          </div>
        </div>

        <CommunityCard
          topPlayers={ranking.slice(0, 5)}
          totalPlayers={ranking.length}
          seasonLabel={seasonLabel}
        />

        <div className="efp-create">
          <div className="body">
            <span className="ttl">+ Create a match</span>
            <span className="desc">Schedule with another player</span>
          </div>
          <span className="pill">SOON</span>
        </div>

        {total === 0 ? (
          <EmptyState />
        ) : (
          <>
            {action.length > 0 && (
              <Section
                title={
                  <>
                    Action <span className="accent">needed.</span>
                  </>
                }
                count={action.length}
              >
                <div className="efp-action-list">
                  {action.map((m) => (
                    <ActionCard key={m.id} match={m} />
                  ))}
                </div>
              </Section>
            )}

            {waiting.length > 0 && (
              <Section title={<>Waiting.</>} count={waiting.length}>
                <div className="efp-quiet-list">
                  {waiting.map((m) => (
                    <WaitingCard key={m.id} match={m} />
                  ))}
                </div>
              </Section>
            )}

            {played.length > 0 && (
              <Section title={<>Played.</>} count={played.length}>
                <div className="efp-quiet-list">
                  {played.map((m) => (
                    <PlayedCard key={m.id} match={m} />
                  ))}
                </div>
              </Section>
            )}
          </>
        )}

    </main>
    </>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="efp-section">
      <header className="efp-section-head">
        <h2>{title}</h2>
        <span className="meta">{count}</span>
      </header>
      {children}
    </section>
  );
}

function ActionCard({ match }: { match: PlayerMatch }) {
  const m = match;
  const bucket = bucketFor(m);
  const href = `/play/${m.tournamentSlug}`;
  const oppCountry = m.oppCountry ?? 'TBD';
  const oppHandle = m.oppUsername ?? '';

  let eyebrow = '';
  let cardClass = 'efp-action-card';
  let eyebrowClass = 'efp-action-eye';
  let ctaClass = 'efp-action-cta';
  let ctaText = '';

  if (bucket === 'submit') {
    eyebrow = '● SUBMIT YOUR SCORE';
    eyebrowClass += ' submit';
    ctaClass += ' submit';
    ctaText = 'Tap to submit';
  } else if (bucket === 'confirm') {
    const reported =
      m.myScore != null && m.oppScore != null
        ? `${m.oppScore}-${m.myScore}`
        : '';
    eyebrow = reported
      ? `● OPPONENT REPORTED ${reported} · CONFIRM?`
      : '● OPPONENT REPORTED · CONFIRM?';
    cardClass += ' confirm';
    eyebrowClass += ' confirm';
    ctaClass += ' confirm';
    ctaText = 'Review & confirm';
  } else {
    eyebrow = '● DISPUTE PENDING · ADMIN REVIEW';
    cardClass += ' disputed';
    eyebrowClass += ' disputed';
    ctaClass += ' disputed';
    ctaText = 'View dispute';
  }

  return (
    <Link href={href} className={cardClass}>
      <div className={eyebrowClass}>
        <span className="dot"></span>
        <span className="text">{eyebrow.replace(/^● /, '')}</span>
      </div>
      <div className="efp-action-tourney">{tournamentEyebrow(m)}</div>
      <div className="efp-action-opp">
        {oppCountry} <span className="vs">vs you</span>
      </div>
      {oppHandle && <div className="efp-action-handle">{oppHandle}</div>}
      <div className={ctaClass}>
        <span>{ctaText}</span>
        <span className="arrow">→</span>
      </div>
    </Link>
  );
}

function WaitingCard({ match }: { match: PlayerMatch }) {
  const m = match;
  const href = `/play/${m.tournamentSlug}`;
  const oppCountry = m.oppCountry ?? 'TBD';
  const oppHandle = m.oppUsername ?? '';
  const pillText = waitingPill(m);

  return (
    <Link href={href} className="efp-quiet efp-quiet-waiting">
      <div className="body">
        <div className="top">
          <span className="tourney">{tournamentEyebrow(m)}</span>
        </div>
        <div className="opp">
          {oppCountry} <span className="vs">vs you</span>
        </div>
        {oppHandle && <div className="handle">{oppHandle}</div>}
      </div>
      <div className="right-stack">
        <span className="pill waiting">{pillText}</span>
      </div>
    </Link>
  );
}

function waitingPill(m: PlayerMatch): string {
  if (m.matchday == null) {
    if (m.status === 'pending') return 'AWAITING BRACKET';
    if (m.status === 'scheduled') return 'SCHEDULED';
    return statusLabel(m.status).toUpperCase();
  }
  if (m.status === 'scheduled') return 'SCHEDULED';
  if (m.status === 'pending') return 'PENDING';
  return statusLabel(m.status).toUpperCase();
}

function PlayedCard({ match }: { match: PlayerMatch }) {
  const m = match;
  const href = `/play/${m.tournamentSlug}`;
  const oppCountry = m.oppCountry ?? 'TBD';
  const oppHandle = m.oppUsername ?? '';

  const result: 'won' | 'lost' | 'drew' =
    m.winnerIsMe === true ? 'won' : m.winnerIsMe === false ? 'lost' : 'drew';

  const myScoreDisplay = m.myScore != null ? m.myScore : '—';
  const oppScoreDisplay = m.oppScore != null ? m.oppScore : '—';
  const isPen = m.decidedBy === 'penalties';
  const isAet = m.decidedBy === 'extra_time';

  let pillText = result.toUpperCase();
  if (isPen) pillText += ' · PEN';
  else if (isAet) pillText += ' · AET';
  if (m.status === 'walkover') pillText = 'W/O';

  return (
    <Link href={href} className={`efp-quiet efp-quiet-${result}`}>
      <div className="body">
        <div className="top">
          <span className="tourney">{tournamentEyebrow(m)}</span>
        </div>
        <div className="opp">
          {oppCountry} <span className="vs">vs you</span>
        </div>
        {oppHandle && <div className="handle">{oppHandle}</div>}
      </div>
      <div className="right-stack">
        <span className="pill">{pillText}</span>
        <span className="score">
          {myScoreDisplay}
          {isPen && m.myPens != null && (
            <span className="pen">{m.myPens}</span>
          )}
          {' — '}
          {oppScoreDisplay}
          {isPen && m.oppPens != null && (
            <span className="pen">{m.oppPens}</span>
          )}
        </span>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="efp-empty">
      <div className="efp-empty-title">No matches yet.</div>
      <p className="efp-empty-body">Register for a tournament to start playing.</p>
      <Link href="/tournaments" className="efp-empty-cta">
        Browse tournaments →
      </Link>
    </div>
  );
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Awaiting bracket',
    awaiting_result: 'Awaiting result',
    awaiting_confirmation: 'Awaiting confirm',
    disputed: 'Disputed',
    walkover: 'Walkover',
    scheduled: 'Scheduled',
  };
  return map[status] ?? status;
}

function Styles() {
  return (
    <style>{`
      .efp-page {
        max-width: 720px;
        margin: 0 auto;
        padding: 24px 20px 60px;
      }

      .efp-head { padding-bottom: 14px; }
      .efp-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 32px;
        line-height: 0.92; letter-spacing: -0.03em;
        color: hsl(var(--ink)); margin: 0 0 6px;
      }
      @media (min-width: 768px) {
        .efp-title { font-size: 40px; }
      }
      .efp-title .accent { color: hsl(var(--accent)); font-style: italic; }
      .efp-sub {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 500;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
      }

      .efp-create {
        margin: 16px 0 24px;
        border: 1px dashed hsl(var(--ink) / 0.42);
        padding: 12px 14px;
        display: flex; justify-content: space-between; align-items: center;
        gap: 12px;
        background: hsl(var(--bg));
      }
      .efp-create .body {
        display: flex; flex-direction: column; gap: 2px; min-width: 0;
      }
      .efp-create .ttl {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 700;
        letter-spacing: 0.16em; text-transform: uppercase;
        color: hsl(var(--ink));
      }
      .efp-create .desc {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 500;
        letter-spacing: 0.08em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
      }
      .efp-create .pill {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.18em; color: hsl(var(--ink) / 0.42);
        border: 1px solid hsl(var(--ink) / 0.20);
        padding: 3px 8px;
        flex-shrink: 0;
      }

      .efp-section { margin-bottom: 24px; }
      .efp-section-head {
        margin-bottom: 10px;
        display: flex; justify-content: space-between; align-items: baseline;
        padding-bottom: 8px; border-bottom: 1px solid hsl(var(--ink));
      }
      .efp-section-head h2 {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 22px; line-height: 1;
        letter-spacing: -0.025em; color: hsl(var(--ink));
        margin: 0;
      }
      .efp-section-head h2 .accent {
        color: hsl(var(--accent));
        font-style: italic;
      }
      .efp-section-head .meta {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
      }

      .efp-action-list { display: flex; flex-direction: column; gap: 10px; }

      .efp-action-card {
        display: block;
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink));
        box-shadow: 4px 4px 0 hsl(var(--ink));
        padding: 14px 16px;
        text-decoration: none;
        color: inherit;
      }
      .efp-action-card.confirm {
        border-color: hsl(var(--warn));
        box-shadow: 4px 4px 0 hsl(var(--warn));
      }
      .efp-action-card.disputed {
        border: 2px solid hsl(var(--warn));
        box-shadow: 4px 4px 0 hsl(var(--warn));
      }

      .efp-action-eye {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 700;
        letter-spacing: 0.18em; text-transform: uppercase;
        margin-bottom: 8px;
        display: flex; align-items: center; gap: 6px;
      }
      .efp-action-eye.submit { color: hsl(var(--accent)); }
      .efp-action-eye.confirm,
      .efp-action-eye.disputed { color: hsl(var(--warn)); }
      .efp-action-eye .dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: currentColor;
        animation: efp-pulse 1.4s ease-in-out infinite;
        flex-shrink: 0;
      }
      .efp-action-eye .text {
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        min-width: 0;
      }
      @keyframes efp-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.85); }
      }

      .efp-action-tourney {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 500;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        margin-bottom: 10px;
      }
      .efp-action-opp {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 24px;
        line-height: 0.95; letter-spacing: -0.025em;
        margin-bottom: 4px;
        color: hsl(var(--ink));
      }
      .efp-action-opp .vs {
        color: hsl(var(--ink) / 0.42);
        font-style: italic; font-weight: 800;
      }
      .efp-action-handle {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.62);
        margin-bottom: 14px;
      }
      .efp-action-cta {
        display: flex; justify-content: space-between; align-items: center;
        padding-top: 12px;
        border-top: 1px solid hsl(var(--ink) / 0.08);
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
      }
      .efp-action-cta.submit { color: hsl(var(--accent)); }
      .efp-action-cta.confirm,
      .efp-action-cta.disputed { color: hsl(var(--warn)); }
      .efp-action-cta .arrow {
        font-family: var(--font-mono), ui-monospace, monospace;
      }

      .efp-quiet-list { display: flex; flex-direction: column; gap: 6px; }

      .efp-quiet {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink) / 0.20);
        padding: 11px 14px;
        text-decoration: none;
        color: inherit;
      }
      .efp-quiet .body { min-width: 0; }
      .efp-quiet .top {
        display: flex; justify-content: space-between; align-items: baseline;
        margin-bottom: 3px; gap: 8px;
      }
      .efp-quiet .tourney {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 500;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        min-width: 0;
      }
      .efp-quiet .opp {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800; font-size: 14px;
        letter-spacing: -0.005em; line-height: 1.1;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        color: hsl(var(--ink));
      }
      .efp-quiet .opp .vs {
        color: hsl(var(--ink) / 0.42);
        font-weight: 500;
      }
      .efp-quiet .handle {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px; font-weight: 500;
        letter-spacing: 0.1em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        line-height: 1.2; margin-top: 2px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .efp-quiet .right-stack {
        display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
        flex-shrink: 0;
      }
      .efp-quiet .pill {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
        padding: 4px 7px;
        border: 1px solid hsl(var(--ink) / 0.20);
        color: hsl(var(--ink) / 0.42);
        line-height: 1;
        white-space: nowrap;
      }
      .efp-quiet-waiting .pill { border-style: dashed; }
      .efp-quiet-won .pill {
        background: hsl(var(--accent));
        border-color: hsl(var(--accent));
        color: #fff;
      }
      .efp-quiet-lost .pill { color: hsl(var(--ink) / 0.42); }
      .efp-quiet-drew .pill { color: hsl(var(--ink) / 0.62); }

      .efp-quiet .score {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 18px;
        letter-spacing: -0.02em; line-height: 1;
        font-variant-numeric: tabular-nums;
        color: hsl(var(--ink));
      }
      .efp-quiet-lost .score { color: hsl(var(--ink) / 0.42); }
      .efp-quiet .score .pen {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 600;
        color: hsl(var(--ink) / 0.42);
        margin-left: 2px;
      }

      .efp-empty {
        text-align: center;
        padding: 48px 24px;
        border: 1px dashed hsl(var(--ink) / 0.20);
        background: hsl(var(--surface));
      }
      .efp-empty-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 22px;
        line-height: 1.05; letter-spacing: -0.025em;
        color: hsl(var(--ink));
        margin-bottom: 10px;
      }
      .efp-empty-body {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 14px; line-height: 1.5;
        color: hsl(var(--ink) / 0.62);
        max-width: 440px; margin: 0 auto 18px;
      }
      .efp-empty-cta {
        display: inline-block;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--accent));
        border: 1px solid hsl(var(--accent));
        padding: 10px 18px;
        text-decoration: none;
      }
     .efp-empty-cta:hover {
        background: hsl(var(--accent));
        color: #fff;
      }

      .efp-discover {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px;
        margin-top: 24px;
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink));
        padding: 14px 16px;
        text-decoration: none;
        color: inherit;
        transition: background 0.15s ease;
      }
      .efp-discover:hover {
        background: hsl(var(--accent) / 0.06);
      }
      .efp-discover-body {
        display: flex; flex-direction: column; gap: 2px;
        min-width: 0;
      }
      .efp-discover-eye {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.18em; text-transform: uppercase;
        color: hsl(var(--accent));
        margin-bottom: 4px;
      }
      .efp-discover-ttl {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800; font-size: 16px;
        letter-spacing: -0.015em;
        color: hsl(var(--ink));
      }
      .efp-discover-meta {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 500;
        letter-spacing: 0.06em;
        color: hsl(var(--ink) / 0.42);
        text-transform: lowercase;
      }
      .efp-discover-arrow {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 22px;
        color: hsl(var(--accent));
        flex-shrink: 0;
      }
    `}</style>
  );
}
