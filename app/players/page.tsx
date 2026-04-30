import Link from 'next/link';
import { getCurrentPlayer } from '@/lib/player';
import { getConsistencyRanking, seasonWindow, TIER_THRESHOLDS, POINTS } from '@/lib/consistency';
import type { Tier } from '@/lib/consistency';

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: { tab?: string; tier?: string };
}) {
  const tab = searchParams.tab === 'about' ? 'about' : 'list';
  const tierFilter = searchParams.tier as Tier | undefined;

  const player = await getCurrentPlayer();
  const ranking = await getConsistencyRanking();
  const { label: seasonLabel } = seasonWindow();

  // Tier counts for filter chips
  const tierCounts: Record<Tier, number> = {
    diamond: 0, platinum: 0, gold: 0, silver: 0, bronze: 0, unranked: 0,
  };
  for (const e of ranking) tierCounts[e.tier]++;

  const filtered = tierFilter
    ? ranking.filter((e) => e.tier === tierFilter)
    : ranking;

  const meId = player?.id ?? null;

  return (
    <>
      <Styles />
      <main className="pl-page">
        <Link href="/play" className="pl-back">← Back to play</Link>

        <header className="pl-head">
          <div className="pl-eyebrow">CONSISTENCY RANKING</div>
          <h1 className="pl-title">
            Season <span className="accent">{seasonLabel}.</span>
          </h1>
          <div className="pl-sub">
            MAY 2026 — APR 2027 · {ranking.length} PLAYER{ranking.length === 1 ? '' : 'S'}
          </div>
        </header>

        <div className="pl-tabs">
          <Link
            href="/players"
            className={`pl-tab ${tab === 'list' ? 'active' : ''}`}
          >
            Players · {ranking.length}
          </Link>
          <Link
            href="/players?tab=about"
            className={`pl-tab ${tab === 'about' ? 'active' : ''}`}
          >
            What is this?
          </Link>
        </div>

        {tab === 'about' ? (
          <AboutTab />
        ) : (
          <ListTab
            ranking={filtered}
            allCount={ranking.length}
            tierCounts={tierCounts}
            tierFilter={tierFilter}
            meId={meId}
          />
        )}
      </main>
    </>
  );
}

// ─── LIST TAB ──────────────────────────────────────────────────────
function ListTab({
  ranking,
  allCount,
  tierCounts,
  tierFilter,
  meId,
}: {
  ranking: any[];
  allCount: number;
  tierCounts: Record<Tier, number>;
  tierFilter?: Tier;
  meId: string | null;
}) {
  return (
    <>
      <div className="pl-chips">
        <FilterChip label={`ALL · ${allCount}`} active={!tierFilter} href="/players" tier={null} />
        {(['diamond', 'platinum', 'gold', 'silver', 'bronze'] as Tier[]).map((t) => (
          tierCounts[t] > 0 && (
            <FilterChip
              key={t}
              label={`${t.toUpperCase()} · ${tierCounts[t]}`}
              active={tierFilter === t}
              href={`/players?tier=${t}`}
              tier={t}
            />
          )
        ))}
      </div>

      <div className="pl-sort-hint">RANKED BY POINTS · ↓</div>

      {ranking.length === 0 ? (
        <div className="pl-empty">
          <div className="pl-empty-title">No players in this filter.</div>
          <div className="pl-empty-body">Try clearing the filter or check back as more matches are played.</div>
        </div>
      ) : (
        <div className="pl-table">
          <div className="pl-table-head">
            <span>#</span>
            <span></span>
            <span>PLAYER</span>
            <span style={{ textAlign: 'right' }}>W-D-L</span>
            <span style={{ textAlign: 'right' }}>PTS</span>
          </div>
          {ranking.map((e) => (
            <PlayerRow key={e.playerId} entry={e} isMe={e.playerId === meId} />
          ))}
        </div>
      )}
    </>
  );
}

function FilterChip({
  label, active, href, tier,
}: {
  label: string; active: boolean; href: string; tier: Tier | null;
}) {
  let cls = 'pl-chip';
  if (active) cls += ' active';
  else if (tier) cls += ` tier-${tier}`;
  return (
    <Link href={href} className={cls}>
      {label}
    </Link>
  );
}

function PlayerRow({ entry, isMe }: { entry: any; isMe: boolean }) {
  const initial = (entry.displayName ?? entry.username ?? '?').charAt(0).toUpperCase();
  const top3Class = entry.rank === 1 ? 'top1' : entry.rank === 2 ? 'top2' : entry.rank === 3 ? 'top3' : '';
  const meClass = isMe ? 'is-me' : '';

  return (
   <Link
      href={`/players/${entry.username}?from=/players`}
      className={`pl-row ${top3Class} ${meClass}`}
    >
      <span className="rank">{String(entry.rank).padStart(2, '0')}</span>
      <div className="avatar" style={
        entry.avatarUrl
          ? { backgroundImage: `url(${entry.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined
      }>
        {!entry.avatarUrl && <span>{initial}</span>}
      </div>
      <div className="player">
        <div className="name">
          @{entry.username.toUpperCase()}
          {isMe && <span className="me-tag"> · YOU</span>}
        </div>
        <span className={`tier-pill tier-${entry.tier}`}>
          {entry.tier.toUpperCase()}
        </span>
      </div>
      <div className="wdl">{entry.wins}-{entry.draws}-{entry.losses}</div>
      <div className="pts">{entry.points}</div>
    </Link>
  );
}

// ─── ABOUT TAB ─────────────────────────────────────────────────────
function AboutTab() {
  return (
    <div className="pl-about">
      <section className="pl-about-section">
        <div className="pl-about-eyebrow">WHAT IT MEASURES</div>
        <p className="pl-about-body">
          Consistency ranking tracks every player's performance across all tournaments
          in the calendar season — combining match results with how deep they go in each cup.
          The more you play and the further you advance, the higher you climb.
        </p>
      </section>

      <section className="pl-about-section">
        <div className="pl-about-eyebrow">MATCH POINTS</div>
        <div className="pl-about-grid">
          <div className="pl-about-cell">
            <div className="pl-about-num">{POINTS.WIN}</div>
            <div className="pl-about-cell-label">WIN</div>
          </div>
          <div className="pl-about-cell">
            <div className="pl-about-num">{POINTS.DRAW}</div>
            <div className="pl-about-cell-label">DRAW</div>
          </div>
          <div className="pl-about-cell">
            <div className="pl-about-num">{POINTS.LOSS}</div>
            <div className="pl-about-cell-label">LOSS</div>
          </div>
        </div>
        <p className="pl-about-note">
          Walkover wins count as a full {POINTS.WALKOVER_WIN}-point win.
          Walkover losses earn {POINTS.WALKOVER_LOSS} points — you can't claim points for a match you didn't play.
        </p>
      </section>

      <section className="pl-about-section">
        <div className="pl-about-eyebrow">TOURNAMENT BONUS</div>
        <div className="pl-about-grid">
          <div className="pl-about-cell highlight">
            <div className="pl-about-num">+{POINTS.TOURNAMENT_WINNER}</div>
            <div className="pl-about-cell-label">WINNER</div>
          </div>
          <div className="pl-about-cell">
            <div className="pl-about-num">+{POINTS.TOURNAMENT_RUNNER_UP}</div>
            <div className="pl-about-cell-label">RUNNER-UP</div>
          </div>
          <div className="pl-about-cell">
            <div className="pl-about-num">+{POINTS.TOURNAMENT_SEMIFINALIST}</div>
            <div className="pl-about-cell-label">SEMI</div>
          </div>
        </div>
        <p className="pl-about-note">
          Awarded when a tournament concludes. Quarter-finalists and earlier exits
          earn match points only — no bonus.
        </p>
      </section>

      <section className="pl-about-section">
        <div className="pl-about-eyebrow">TIERS</div>
        <div className="pl-tier-grid">
          {TIER_THRESHOLDS.filter((t) => t.tier !== 'unranked').map((t) => (
            <div key={t.tier} className="pl-tier-row">
              <span className={`tier-pill tier-${t.tier}`}>{t.label}</span>
              <span className="pl-tier-pts">{t.min}+ PTS</span>
            </div>
          ))}
          <div className="pl-tier-row">
            <span className="tier-pill tier-unranked">UNRANKED</span>
            <span className="pl-tier-pts">&lt; 100 PTS</span>
          </div>
        </div>
        <p className="pl-about-note">
          Tiers reset each season (May 1 — April 30). New players start unranked.
        </p>
      </section>

      <section className="pl-about-section">
        <div className="pl-about-eyebrow">EXAMPLE</div>
        <div className="pl-about-example">
          <div className="ex-row"><span>10 wins</span><span>500</span></div>
          <div className="ex-row"><span>2 draws</span><span>50</span></div>
          <div className="ex-row"><span>3 losses</span><span>30</span></div>
          <div className="ex-row"><span>1 tournament won</span><span>+150</span></div>
          <div className="ex-row"><span>1 semifinal reached</span><span>+75</span></div>
          <div className="ex-total"><span>TOTAL</span><span>805 PTS · GOLD</span></div>
        </div>
      </section>
    </div>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────
function Styles() {
  return (
    <style>{`
      .pl-page {
        max-width: 600px;
        margin: 0 auto;
        padding: 16px 20px 60px;
      }

      .pl-back {
        display: inline-block;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.62);
        text-decoration: none;
        margin-bottom: 18px;
      }
      .pl-back:hover { color: hsl(var(--ink)); }

      .pl-head { padding-bottom: 16px; }
      .pl-eyebrow {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 700;
        letter-spacing: 0.18em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        margin-bottom: 6px;
      }
      .pl-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 32px;
        line-height: 0.92; letter-spacing: -0.03em;
        color: hsl(var(--ink));
        margin: 0 0 6px;
      }
      @media (min-width: 768px) {
        .pl-title { font-size: 40px; }
      }
      .pl-title .accent { color: hsl(var(--accent)); font-style: italic; }
      .pl-sub {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 500;
        letter-spacing: 0.12em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
      }

      .pl-tabs {
        display: flex; gap: 18px;
        border-bottom: 1px solid hsl(var(--ink));
        margin-bottom: 14px;
      }
      .pl-tab {
        position: relative;
        padding: 10px 0;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        text-decoration: none;
      }
      .pl-tab:hover { color: hsl(var(--ink)); }
      .pl-tab.active {
        color: hsl(var(--ink));
      }
      .pl-tab.active::after {
        content: '';
        position: absolute;
        bottom: -1px; left: 0; right: 0;
        height: 2px;
        background: hsl(var(--ink));
      }

      .pl-chips {
        display: flex; gap: 6px;
        margin-bottom: 14px;
        flex-wrap: wrap;
      }
      .pl-chip {
        display: inline-block;
        padding: 4px 10px;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
        text-decoration: none;
        border: 1px solid hsl(var(--ink) / 0.20);
        color: hsl(var(--ink) / 0.62);
        background: transparent;
      }
      .pl-chip:hover {
        color: hsl(var(--ink));
        border-color: hsl(var(--ink));
      }
      .pl-chip.active {
        background: hsl(var(--ink));
        color: hsl(var(--bg));
        border-color: hsl(var(--ink));
      }

      .pl-sort-hint {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 500;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        margin-bottom: 6px;
      }

      .pl-table {
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink));
      }

      .pl-table-head {
        display: grid;
        grid-template-columns: 28px 32px 1fr 60px 60px;
        gap: 8px; align-items: center;
        padding: 8px 10px;
        background: hsl(var(--ink));
        color: hsl(var(--bg));
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.14em;
      }

      .pl-row {
        display: grid;
        grid-template-columns: 28px 32px 1fr 60px 60px;
        gap: 8px; align-items: center;
        padding: 10px;
        border-bottom: 1px solid hsl(var(--ink) / 0.08);
        text-decoration: none;
        color: hsl(var(--ink));
        transition: background 0.1s ease;
      }
      .pl-row:last-child { border-bottom: none; }
      .pl-row:hover { background: hsl(var(--ink) / 0.04); }
      .pl-row.top1 { background: rgba(199,164,221,0.10); }
      .pl-row.top2 { background: rgba(181,212,244,0.10); }
      .pl-row.top3 { background: rgba(250,199,117,0.10); }
      .pl-row.is-me {
        background: hsl(var(--accent) / 0.08);
        border-left: 3px solid hsl(var(--accent));
        padding-left: 7px;
      }

      .pl-row .rank {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 13px;
        color: hsl(var(--ink) / 0.62);
        font-variant-numeric: tabular-nums;
      }
      .pl-row.top1 .rank { color: #3C2A4D; font-size: 14px; }
      .pl-row.top2 .rank { color: #042C53; font-size: 14px; }
      .pl-row.top3 .rank { color: #633806; font-size: 14px; }
      .pl-row.is-me .rank { color: hsl(var(--accent)); }

      .pl-row .avatar {
        width: 28px; height: 28px;
        background: hsl(var(--ink));
        color: hsl(var(--bg));
        display: flex; align-items: center; justify-content: center;
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800; font-size: 12px;
        flex-shrink: 0;
      }
      .pl-row.is-me .avatar {
        background: hsl(var(--accent));
      }
      .pl-row .player { min-width: 0; }
      .pl-row .name {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800; font-size: 13px;
        line-height: 1.2;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .pl-row .name .me-tag {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px; font-weight: 700;
        letter-spacing: 0.12em;
        color: hsl(var(--accent));
      }
      .pl-row .wdl {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px;
        color: hsl(var(--ink) / 0.62);
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .pl-row .pts {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 14px;
        color: hsl(var(--ink));
        text-align: right;
      }
      .pl-row.top1 .pts { color: hsl(var(--accent)); }

      /* Tier pills */
      .tier-pill {
        display: inline-block;
        padding: 2px 6px;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px; font-weight: 700;
        letter-spacing: 0.14em;
        line-height: 1.4;
        margin-top: 3px;
      }
      .tier-pill.tier-diamond { background: #C7A4DD; color: #3C2A4D; }
      .tier-pill.tier-platinum { background: #B5D4F4; color: #042C53; }
      .tier-pill.tier-gold { background: #FAC775; color: #633806; }
      .tier-pill.tier-silver { background: #D3D1C7; color: #2C2C2A; }
      .tier-pill.tier-bronze { background: #F5C4B3; color: #4A1B0C; }
      .tier-pill.tier-unranked {
        background: transparent;
        color: hsl(var(--ink) / 0.42);
        border: 1px solid hsl(var(--ink) / 0.20);
      }

      .pl-empty {
        text-align: center;
        padding: 36px 20px;
        border: 1px dashed hsl(var(--ink) / 0.20);
        background: hsl(var(--surface));
      }
      .pl-empty-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 18px;
        line-height: 1.05; letter-spacing: -0.02em;
        margin-bottom: 6px;
      }
      .pl-empty-body {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 13px; line-height: 1.5;
        color: hsl(var(--ink) / 0.62);
      }

      /* About tab */
      .pl-about { padding: 6px 0; }
      .pl-about-section {
        margin-bottom: 28px;
      }
      .pl-about-eyebrow {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 700;
        letter-spacing: 0.18em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        margin-bottom: 12px;
        padding-bottom: 6px;
        border-bottom: 1px solid hsl(var(--ink));
      }
      .pl-about-body {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 14px; line-height: 1.6;
        color: hsl(var(--ink));
        margin: 0 0 12px;
      }
      .pl-about-note {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 13px; line-height: 1.5;
        color: hsl(var(--ink) / 0.62);
        margin: 12px 0 0;
      }
      .pl-about-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1px;
        background: hsl(var(--ink));
        border: 1px solid hsl(var(--ink));
      }
      .pl-about-cell {
        background: hsl(var(--surface));
        padding: 16px 10px;
        text-align: center;
      }
      .pl-about-cell.highlight {
        background: hsl(var(--accent) / 0.08);
      }
      .pl-about-num {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 28px;
        line-height: 1;
        color: hsl(var(--ink));
        font-variant-numeric: tabular-nums;
        margin-bottom: 6px;
      }
      .pl-about-cell.highlight .pl-about-num { color: hsl(var(--accent)); }
      .pl-about-cell-label {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.14em;
        color: hsl(var(--ink) / 0.42);
        text-transform: uppercase;
      }

      .pl-tier-grid {
        display: flex; flex-direction: column; gap: 8px;
      }
      .pl-tier-row {
        display: flex; justify-content: space-between; align-items: center;
        padding: 10px 12px;
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink) / 0.20);
      }
      .pl-tier-pts {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px; font-weight: 700;
        letter-spacing: 0.10em;
        color: hsl(var(--ink));
        font-variant-numeric: tabular-nums;
      }

      .pl-about-example {
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink) / 0.20);
        padding: 12px 16px;
      }
      .ex-row {
        display: flex; justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid hsl(var(--ink) / 0.08);
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 14px;
        color: hsl(var(--ink) / 0.62);
        font-variant-numeric: tabular-nums;
      }
      .ex-total {
        display: flex; justify-content: space-between;
        padding: 10px 0 4px;
        margin-top: 4px;
        border-top: 1px solid hsl(var(--ink));
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 16px;
        color: hsl(var(--ink));
      }
    `}</style>
  );
}
