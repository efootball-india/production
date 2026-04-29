// PASS-45-STATS-TAB (editorial)
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function StatsTab({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tournament) notFound();

  const { data: completedMatches } = await supabase
    .from('matches')
    .select(`
      id, home_score, away_score, decided_by, round, matchday, match_number_in_round,
      home:tournament_participants!matches_home_participant_id_fkey(id, country:countries(name), player:players(username, display_name)),
      away:tournament_participants!matches_away_participant_id_fkey(id, country:countries(name), player:players(username, display_name)),
      winner_participant_id
    `)
    .eq('tournament_id', tournament.id)
    .eq('status', 'completed');

  const totalMatches = completedMatches?.length ?? 0;

  if (totalMatches === 0) {
    return (
      <>
        <Styles />
        <div className="efs-empty">
          <div className="efs-empty-title">No records yet.</div>
          <p className="efs-empty-body">
            Tournament records appear after the first match completes.
          </p>
        </div>
      </>
    );
  }

  let totalGoals = 0;
  let highestScoring: any = null;
  let biggestMargin: any = null;
  let biggestMarginValue = -1;

  const winsByParticipant = new Map
    string,
    { count: number; name: string; player: string }
  >();

  for (const m of completedMatches ?? []) {
    const total = (m.home_score ?? 0) + (m.away_score ?? 0);
    const margin = Math.abs((m.home_score ?? 0) - (m.away_score ?? 0));
    totalGoals += total;

    if (
      !highestScoring ||
      total >
        ((highestScoring.home_score ?? 0) + (highestScoring.away_score ?? 0))
    ) {
      highestScoring = m;
    }
    if (margin > biggestMarginValue) {
      biggestMargin = m;
      biggestMarginValue = margin;
    }

    if (m.winner_participant_id) {
      const winnerSide =
        (m.home as any)?.id === m.winner_participant_id ? m.home : m.away;
      const w = winnerSide as any;
      if (w) {
        const key = w.id;
        const existing = winsByParticipant.get(key);
        winsByParticipant.set(key, {
          count: (existing?.count ?? 0) + 1,
          name: w.country?.name ?? '—',
          player: w.player?.username ?? w.player?.display_name ?? '—',
        });
      }
    }
  }

  const topWinners = Array.from(winsByParticipant.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const avgGoals = (totalGoals / totalMatches).toFixed(2);

  return (
    <>
      <Styles />
      <div className="efs-page">
        <div className="efs-page-head">
          <h2 className="efs-title">
            The <span className="accent">Records.</span>
          </h2>
          <div className="efs-sub">
            TOURNAMENT STATS · {totalMatches} MATCH
            {totalMatches === 1 ? '' : 'ES'} PLAYED
          </div>
        </div>

        <div className="efs-summary">
          <div className="efs-sm-cell">
            <span className="lbl">Played</span>
            <span className="val">{totalMatches}</span>
          </div>
          <div className="efs-sm-cell">
            <span className="lbl">Goals</span>
            <span className="val">{totalGoals}</span>
          </div>
          <div className="efs-sm-cell">
            <span className="lbl">Per match</span>
            <span className="val">{avgGoals}</span>
          </div>
        </div>

        {(highestScoring || biggestMargin) && (
          <>
            <div className="efs-section-head">
              <h3>Match records.</h3>
              <span className="meta">
                {[highestScoring, biggestMargin].filter(Boolean).length} RECORDS
              </span>
            </div>

            {highestScoring && (
              <RecordCard
                crown="★ HIGHEST-SCORING MATCH"
                ctx={matchContext(highestScoring)}
                match={highestScoring}
                statLabel="Total goals"
                statValue={String(
                  (highestScoring.home_score ?? 0) +
                    (highestScoring.away_score ?? 0)
                )}
              />
            )}

            {biggestMargin && (
              <RecordCard
                crown="★ BIGGEST MARGIN"
                ctx={matchContext(biggestMargin)}
                match={biggestMargin}
                statLabel="Margin"
                statValue={`${biggestMarginValue} GOAL${
                  biggestMarginValue === 1 ? '' : 'S'
                }`}
              />
            )}
          </>
        )}

        {topWinners.length > 0 && (
          <>
            <div className="efs-section-head" style={{ marginTop: 20 }}>
              <h3>Most wins.</h3>
              <span className="meta">TOP {topWinners.length}</span>
            </div>

            <div className="efs-leaderboard">
              <div className="efs-lb-head">
                <span>#</span>
                <span>PLAYER</span>
                <span className="right">W</span>
              </div>

              {topWinners.map((w, i) => (
                <div
                  key={i}
                  className={`efs-lb-row ${i === 0 ? 'first' : ''}`}
                >
                  <span className="efs-lb-pos">{i + 1}</span>
                  <div className="efs-lb-team">
                    <span className="efs-lb-cntry">{w.name}</span>
                    <span className="efs-lb-handle">{w.player}</span>
                  </div>
                  <span className="efs-lb-wins">
                    {w.count}
                    <span className="unit">W</span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function matchContext(m: any): string {
  if (m.matchday != null) return `MATCHDAY ${m.matchday}`;
  const roundLabels: Record<number, string> = {
    1: 'R32',
    2: 'R16',
    3: 'QF',
    4: 'SF',
    5: 'F',
  };
  if (m.round != null && roundLabels[m.round]) {
    const lbl = roundLabels[m.round];
    return m.match_number_in_round
      ? `${lbl} · MATCH ${m.match_number_in_round}`
      : lbl;
  }
  return '';
}

function RecordCard({
  crown,
  ctx,
  match,
  statLabel,
  statValue,
}: {
  crown: string;
  ctx: string;
  match: any;
  statLabel: string;
  statValue: string;
}) {
  const home = match.home as any;
  const away = match.away as any;
  const homeName = home?.country?.name ?? 'TBD';
  const awayName = away?.country?.name ?? 'TBD';
  const homeHandle =
    home?.player?.username ?? home?.player?.display_name ?? '';
  const awayHandle =
    away?.player?.username ?? away?.player?.display_name ?? '';
  const homeScore = match.home_score ?? 0;
  const awayScore = match.away_score ?? 0;
  const homeWon =
    match.winner_participant_id && match.winner_participant_id === home?.id;
  const awayWon =
    match.winner_participant_id && match.winner_participant_id === away?.id;

  return (
    <div className="efs-record">
      <div className="efs-record-head">
        <span className="crown">{crown}</span>
        {ctx && <span className="ctx">{ctx}</span>}
      </div>
      <div className="efs-record-body">
        <div className="scoreline">
          <div className="side">
            <div className="country">{homeName}</div>
            {homeHandle && <div className="handle">{homeHandle}</div>}
          </div>
          <div className="scores">
            <span className={`h ${awayWon ? 'dim' : ''}`}>{homeScore}</span>
            <span className="sep">—</span>
            <span className={`a ${homeWon ? 'dim' : ''}`}>{awayScore}</span>
          </div>
          <div className="side right">
            <div className="country">{awayName}</div>
            {awayHandle && <div className="handle">{awayHandle}</div>}
          </div>
        </div>
        <div className="stat">
          <span>{statLabel}</span>
          <span className="strong">{statValue}</span>
        </div>
      </div>
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      .efs-page { display: flex; flex-direction: column; }

      .efs-page-head { padding-bottom: 16px; }
      .efs-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 32px;
        line-height: 0.92; letter-spacing: -0.03em;
        color: hsl(var(--ink)); margin: 0 0 6px;
      }
      @media (min-width: 768px) {
        .efs-title { font-size: 40px; }
      }
      .efs-title .accent { color: hsl(var(--accent)); font-style: italic; }
      .efs-sub {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 500;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
      }

      .efs-summary {
        display: grid; grid-template-columns: repeat(3, 1fr);
        gap: 1px; background: hsl(var(--ink));
        border: 1px solid hsl(var(--ink));
        margin-bottom: 24px;
      }
      .efs-sm-cell { background: hsl(var(--surface)); padding: 14px 12px; }
      .efs-sm-cell .lbl {
        display: block;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px; font-weight: 500;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42); margin-bottom: 6px;
      }
      .efs-sm-cell .val {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 26px;
        line-height: 1; letter-spacing: -0.03em;
        color: hsl(var(--ink));
        font-variant-numeric: tabular-nums;
      }

      .efs-section-head {
        margin-bottom: 12px;
        display: flex; justify-content: space-between; align-items: baseline;
        padding-bottom: 8px;
        border-bottom: 1px solid hsl(var(--ink));
      }
      .efs-section-head h3 {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 22px;
        line-height: 1; letter-spacing: -0.025em;
        color: hsl(var(--ink));
      }
      .efs-section-head .meta {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
      }

      .efs-record {
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink));
        margin-bottom: 16px;
        box-shadow: 4px 4px 0 hsl(var(--ink));
      }
      .efs-record-head {
        padding: 10px 14px;
        background: hsl(var(--ink));
        color: hsl(var(--bg));
        display: flex; justify-content: space-between; align-items: center;
        gap: 8px;
      }
      .efs-record-head .crown {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.18em; text-transform: uppercase;
        color: hsl(var(--accent));
      }
      .efs-record-head .ctx {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 500;
        letter-spacing: 0.10em; text-transform: uppercase;
        color: hsl(var(--bg) / 0.5);
        white-space: nowrap;
      }

      .efs-record-body { padding: 18px 16px; }
      .efs-record-body .scoreline {
        display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        gap: 12px; align-items: center;
      }
      .efs-record-body .side { min-width: 0; }
      .efs-record-body .side.right { text-align: right; }
      .efs-record-body .country {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 22px;
        line-height: 0.95; letter-spacing: -0.025em;
        margin-bottom: 4px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        color: hsl(var(--ink));
      }
      .efs-record-body .handle {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .efs-record-body .scores {
        display: flex; align-items: baseline; gap: 6px;
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-variant-numeric: tabular-nums;
      }
      .efs-record-body .scores .h,
      .efs-record-body .scores .a {
        font-size: 36px; line-height: 0.9;
        letter-spacing: -0.04em; color: hsl(var(--ink));
      }
      .efs-record-body .scores .h.dim,
      .efs-record-body .scores .a.dim {
        color: hsl(var(--ink) / 0.42);
      }
      .efs-record-body .scores .sep {
        font-size: 28px;
        color: hsl(var(--ink) / 0.42);
        font-weight: 400;
      }
      .efs-record-body .stat {
        margin-top: 14px; padding-top: 10px;
        border-top: 1px solid hsl(var(--ink) / 0.08);
        display: flex; justify-content: space-between; align-items: center;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 500;
        letter-spacing: 0.10em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.62);
      }
      .efs-record-body .stat .strong {
        color: hsl(var(--accent));
        font-weight: 700;
      }

      .efs-leaderboard {
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink) / 0.20);
      }
      .efs-lb-head {
        display: grid; grid-template-columns: 22px minmax(0, 1fr) 56px;
        gap: 8px; align-items: center;
        padding: 6px 14px;
        background: hsl(var(--surface-2));
        border-bottom: 1px solid hsl(var(--ink) / 0.08);
      }
      .efs-lb-head span {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
      }
      .efs-lb-head .right { text-align: right; }
      .efs-lb-row {
        display: grid; grid-template-columns: 22px minmax(0, 1fr) 56px;
        gap: 8px; align-items: center;
        padding: 12px 14px;
        border-bottom: 1px solid hsl(var(--ink) / 0.08);
      }
      .efs-lb-row:last-child { border-bottom: none; }
      .efs-lb-row.first {
        background: hsl(var(--accent) / 0.08);
        border-left: 3px solid hsl(var(--accent));
        padding-left: 11px;
      }
      .efs-lb-pos {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 18px;
        line-height: 1; letter-spacing: -0.02em;
        color: hsl(var(--ink));
      }
      .efs-lb-row.first .efs-lb-pos { color: hsl(var(--accent)); }
      .efs-lb-team { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
      .efs-lb-cntry {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800; font-size: 14px;
        letter-spacing: -0.01em; line-height: 1;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        color: hsl(var(--ink));
      }
      .efs-lb-handle {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px; font-weight: 500;
        letter-spacing: 0.1em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42); line-height: 1;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .efs-lb-wins {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 22px;
        text-align: right; line-height: 1; letter-spacing: -0.025em;
        font-variant-numeric: tabular-nums;
        color: hsl(var(--ink));
      }
      .efs-lb-row.first .efs-lb-wins { color: hsl(var(--accent)); }
      .efs-lb-wins .unit {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 500;
        color: hsl(var(--ink) / 0.42);
        margin-left: 2px;
      }

      .efs-empty {
        text-align: center;
        padding: 48px 24px;
        border: 1px dashed hsl(var(--ink) / 0.20);
        background: hsl(var(--surface));
      }
      .efs-empty-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 22px;
        line-height: 1.05; letter-spacing: -0.025em;
        color: hsl(var(--ink)); margin-bottom: 10px;
      }
      .efs-empty-body {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 14px; line-height: 1.5;
        color: hsl(var(--ink) / 0.62);
        max-width: 440px; margin: 0 auto;
      }
    `}</style>
  );
}
