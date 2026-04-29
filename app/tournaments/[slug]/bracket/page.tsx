// PASS-47-BRACKET-TAB (editorial · horizontal scroll tree)
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentPlayer } from '@/lib/player';
import {
  getBracketView,
  bracketExists,
  R32_PAIRINGS,
  seedToLabel,
} from '@/lib/knockout';

const ROUND_INFO: Array<{ round: number; label: string; expectedCount: number }> = [
  { round: 1, label: 'R32', expectedCount: 16 },
  { round: 2, label: 'R16', expectedCount: 8 },
  { round: 3, label: 'QF', expectedCount: 4 },
  { round: 4, label: 'SF', expectedCount: 2 },
  { round: 5, label: 'F', expectedCount: 1 },
];

function fifaLabel(seed: number): string {
  const raw = seedToLabel(seed);
  if (raw.startsWith('BT')) return raw;
  const letter = raw.charAt(0);
  const num = raw.slice(1);
  return `${num}${letter}`;
}

export default async function BracketTab({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, slug, champion_participant_id, status')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tournament) notFound();

  const player = await getCurrentPlayer();
  const isMod =
    !!player && ['moderator', 'admin', 'super_admin'].includes(player.role);

  const exists = await bracketExists(tournament.id);

  if (!exists) {
    const status = tournament.status as string;
    const isPreGroups =
      status === 'draft' ||
      status === 'registration_open' ||
      status === 'registration_closed';

    if (isPreGroups) {
      return (
        <>
          <Styles />
          <div className="efb-empty efb-empty-warn">
            <div className="efb-empty-title">
              Bracket projects after group stage starts.
            </div>
            <p className="efb-empty-body">
              Once the draw is complete and matchday 1 begins, projected R32
              pairings appear here.
            </p>
          </div>
        </>
      );
    }

    return (
      <>
        <Styles />
        <div className="efb-page">
          <div className="efb-projected-banner">
            <span className="dot" />
            <span>
              Bracket reveals when groups finish · projected pairings below
            </span>
          </div>

          <div className="efb-section-head">ROUND OF 32 · PROJECTED</div>
          <div className="efb-projected-list">
            {R32_PAIRINGS.map(([seedA, seedB], i) => (
              <div key={i} className="efb-projected-row">
                <span className="seed">{fifaLabel(seedA)}</span>
                <span className="vs">VS</span>
                <span className="seed right">{fifaLabel(seedB)}</span>
              </div>
            ))}
          </div>

          <div className="efb-section-head" style={{ marginTop: 24 }}>
            ROUND OF 16 · PROJECTED
          </div>
          <div className="efb-projected-future">
            Winners of R32 · pairings reveal as R32 results come in
          </div>
        </div>
      </>
    );
  }

  const bracket = await getBracketView(tournament.id);
  if (!bracket) {
    return (
      <>
        <Styles />
        <div className="efb-empty">
          <div className="efb-empty-title">Bracket unavailable.</div>
          <p className="efb-empty-body">Try refreshing in a moment.</p>
        </div>
      </>
    );
  }

  let champion: any = null;
  if (tournament.champion_participant_id) {
    const { data: champ } = await supabase
      .from('tournament_participants')
      .select(
        `id, player:players(username, display_name), country:countries(name)`
      )
      .eq('id', tournament.champion_participant_id)
      .maybeSingle();
    champion = champ;
  }

  const { data: seeds } = await supabase
    .from('knockout_seeds')
    .select('participant_id, source_label')
    .eq('tournament_id', tournament.id);
  const seedMap = new Map<string, string>();
  for (const s of seeds ?? []) {
    if (s.participant_id) seedMap.set(s.participant_id, s.source_label ?? '');
  }

  const finalMatch = bracket[5]?.[0];

  const championPath = new Set<string>();
  let pathGD = 0;
  if (champion) {
    for (const r of [1, 2, 3, 4, 5]) {
      const ms = bracket[r] ?? [];
      for (const m of ms) {
        if (m.winner_participant_id === champion.id) {
          championPath.add(m.id);
          if (m.home_score != null && m.away_score != null) {
            const champIsHome = m.home?.id === champion.id;
            pathGD += champIsHome
              ? m.home_score - m.away_score
              : m.away_score - m.home_score;
          }
        }
      }
    }
  }

  const roundStats = ROUND_INFO.map(({ round, label, expectedCount }) => {
    const matches = bracket[round] ?? [];
    const played = matches.filter((m: any) => m.status === 'completed').length;
    const live = matches.filter((m: any) => m.status === 'awaiting_result')
      .length;
    const confirm = matches.filter(
      (m: any) => m.status === 'awaiting_confirmation'
    ).length;
    return { round, label, expectedCount, played, live, confirm };
  });

  const totalPlayed = roundStats.reduce((n, r) => n + r.played, 0);
  const totalMatches = ROUND_INFO.reduce((n, r) => n + r.expectedCount, 0);
  const totalLive = roundStats.reduce((n, r) => n + r.live, 0);
  const currentLabel =
    roundStats.find((r) => r.played < r.expectedCount)?.label ?? 'F';

  return (
    <>
      <Styles />
      <div className="efb-page">
        <div className="efb-head">
          {champion ? (
            <>
              <h2 className="efb-title">
                The <span className="accent">Champion.</span>
              </h2>
              <div className="efb-sub">
                TOURNAMENT COMPLETE · {totalMatches} MATCHES
              </div>
            </>
          ) : (
            <>
              <h2 className="efb-title">
                The <span className="accent">Knockout.</span>
              </h2>
              <div className="efb-sub">
                SINGLE ELIMINATION · 32 PLAYERS · 5 ROUNDS
              </div>
            </>
          )}
        </div>

        {champion && finalMatch && (
          <ChampionBanner
            champion={champion}
            finalMatch={finalMatch}
            seedMap={seedMap}
            pathSize={championPath.size}
            pathGD={pathGD}
          />
        )}

        {!champion && (
          <div className="efb-meta">
            <div className="efb-meta-cell">
              <span className="lbl">Round</span>
              <span className="val">
                {currentLabel}
                <span className="dim"> /5</span>
              </span>
            </div>
            <div className="efb-meta-cell">
              <span className="lbl">Played</span>
              <span className="val">
                {totalPlayed}
                <span className="dim">/{totalMatches}</span>
              </span>
            </div>
            <div className="efb-meta-cell">
              <span className="lbl">Live</span>
              <span className={`val ${totalLive > 0 ? 'live' : ''}`}>
                {totalLive}
              </span>
            </div>
          </div>
        )}

        <div className="efb-scroll-hint">
          <span>
            {champion
              ? '← TRACE THE PATH TO THE TITLE'
              : 'SCROLL → TO SEE LATER ROUNDS'}
          </span>
          <span className="arrow">→</span>
        </div>

        <div className="efb-tree-scroll">
          <div className="efb-tree">
            {ROUND_INFO.map(({ round, label, expectedCount }) => {
              const matches = bracket[round] ?? [];
              const sorted = [...matches].sort(
                (a: any, b: any) =>
                  a.match_number_in_round - b.match_number_in_round
              );
              const stats = roundStats.find((r) => r.round === round)!;
              return (
                <section
                  key={round}
                  className="efb-round"
                  data-r={label.toLowerCase()}
                >
                  <header className="efb-round-head">
                    <span className="name">{label}</span>
                    <RoundMeta stats={stats} />
                  </header>
                  <div className="efb-matches">
                    {sorted.length === 0
                      ? Array.from({ length: expectedCount }).map((_, i) => (
                          <PlaceholderMatch key={`ph-${round}-${i}`} />
                        ))
                      : sorted.map((m: any) => (
                          <MatchCard
                            key={m.id}
                            match={m}
                            seedMap={seedMap}
                            isOnPath={championPath.has(m.id)}
                            isMod={isMod}
                            slug={tournament.slug}
                          />
                        ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function ChampionBanner({
  champion,
  finalMatch,
  seedMap,
  pathSize,
  pathGD,
}: {
  champion: any;
  finalMatch: any;
  seedMap: Map<string, string>;
  pathSize: number;
  pathGD: number;
}) {
  const country = champion.country?.name ?? '?';
  const handle =
    champion.player?.display_name ?? champion.player?.username ?? '';
  const seed = seedMap.get(champion.id) ?? '';

  const finalH = finalMatch.home_score;
  const finalA = finalMatch.away_score;
  const champIsHome = finalMatch.home?.id === champion.id;
  const champScore = champIsHome ? finalH : finalA;
  const oppScore = champIsHome ? finalA : finalH;
  const finalScore =
    finalH != null && finalA != null ? `${champScore}-${oppScore}` : '—';

  return (
    <div className="efb-champ">
      <div className="crown">★ CHAMPION</div>
      <div className="country">
        {country}
        <span className="accent">.</span>
      </div>
      <div className="handle">
        {handle}
        {seed ? ` · ${seed}` : ''}
      </div>
      <div className="summary">
        <div>
          <span className="lbl">Final</span>
          <span className="val accent">{finalScore}</span>
        </div>
        <div>
          <span className="lbl">Path</span>
          <span className="val">{pathSize}-0</span>
        </div>
        <div>
          <span className="lbl">GD</span>
          <span className="val">
            {pathGD > 0 ? '+' : ''}
            {pathGD}
          </span>
        </div>
      </div>
    </div>
  );
}

function RoundMeta({ stats }: { stats: any }) {
  if (stats.played === stats.expectedCount && stats.expectedCount > 0) {
    return <span className="meta">{stats.expectedCount} · ✓</span>;
  }
  if (stats.live > 0) {
    return <span className="meta live">● {stats.live} LIVE</span>;
  }
  if (stats.played > 0) {
    return (
      <span className="meta">
        {stats.played}/{stats.expectedCount}
      </span>
    );
  }
  return <span className="meta">PENDING</span>;
}

function MatchCard({
  match,
  seedMap,
  isOnPath,
  isMod,
  slug,
}: {
  match: any;
  seedMap: Map<string, string>;
  isOnPath: boolean;
  isMod: boolean;
  slug: string;
}) {
  const m = match;
  const winnerId = m.winner_participant_id ?? null;
  const homeIsWinner = !!winnerId && m.home?.id === winnerId;
  const awayIsWinner = !!winnerId && m.away?.id === winnerId;
  const isAwait = m.status === 'awaiting_result';
  const isConfirm = m.status === 'awaiting_confirmation';
  const isDisputed = m.status === 'disputed';
  const isCompleted = m.status === 'completed';
  const hasBothPlayers = !!m.home && !!m.away;

  let cardClass = 'efb-match';
  if (isAwait && hasBothPlayers) cardClass += ' live';
  else if (isConfirm) cardClass += ' confirm';
  else if (isDisputed) cardClass += ' disputed';
  if (isOnPath) cardClass += ' path-win';

  let footText = '';
  let footClass = '';
  if (isCompleted) {
    if (m.decided_by === 'penalties') {
      footText = 'FINAL · PEN';
      footClass = 'aet';
    } else if (m.decided_by === 'extra_time') {
      footText = 'FINAL · A.E.T.';
      footClass = 'aet';
    } else if (m.decided_by === 'walkover') {
      footText = 'WALKOVER';
      footClass = 'aet';
    } else {
      footText = 'FINAL';
    }
  } else if (isAwait) {
    footText = hasBothPlayers ? 'AWAITING RESULT' : 'PENDING';
    footClass = hasBothPlayers ? 'live' : '';
  } else if (isConfirm) {
    footText = '⚠ AWAITING CONFIRMATION';
    footClass = 'confirm';
  } else if (isDisputed) {
    footText = 'DISPUTED · ADMIN';
    footClass = 'confirm';
  } else if (m.status === 'pending') {
    footText = 'TBD';
  } else if (m.status === 'scheduled') {
    footText = 'SCHEDULED';
  } else if (m.status === 'walkover') {
    footText = 'WALKOVER';
    footClass = 'aet';
  } else {
    footText =
      String(m.status ?? '').toUpperCase().replace(/_/g, ' ') || 'TBD';
  }

  const showModLink = isMod && hasBothPlayers;

  return (
    <div className={cardClass}>
      <Side
        side={m.home}
        score={m.home_score}
        pens={m.decided_by === 'penalties' ? m.home_pens : null}
        isWin={homeIsWinner}
        isLoss={!!winnerId && !homeIsWinner}
        seedMap={seedMap}
      />
      <Side
        side={m.away}
        score={m.away_score}
        pens={m.decided_by === 'penalties' ? m.away_pens : null}
        isWin={awayIsWinner}
        isLoss={!!winnerId && !awayIsWinner}
        seedMap={seedMap}
      />
      <div className={`efb-foot ${footClass}`.trim()}>
        <span className="foot-text">{footText}</span>
        {showModLink && (
          <Link
            href={`/admin/tournaments/${slug}/ko-match/${m.id}`}
            className="foot-mod"
          >
            {isCompleted ? 'Edit' : 'Set'} →
          </Link>
        )}
      </div>
    </div>
  );
}

function Side({
  side,
  score,
  pens,
  isWin,
  isLoss,
  seedMap,
}: {
  side: any;
  score: number | null;
  pens: number | null;
  isWin: boolean;
  isLoss: boolean;
  seedMap: Map<string, string>;
}) {
  if (!side) {
    return (
      <div className="efb-side tbd">
        <div className="efb-team">
          <span className="efb-name">TBD</span>
        </div>
        <span className="efb-score">—</span>
      </div>
    );
  }
  const country = side.country?.name ?? 'TBD';
  const handle = side.player?.username ?? side.player?.display_name ?? '';
  const seed = seedMap.get(side.id) ?? '';
  const handleStr = [seed, handle].filter(Boolean).join(' · ');

  let className = 'efb-side';
  if (isWin) className += ' win';
  else if (isLoss) className += ' loss';

  return (
    <div className={className}>
      <div className="efb-team">
        <span className="efb-name">{country}</span>
        {handleStr && <span className="efb-handle">{handleStr}</span>}
      </div>
      {score == null ? (
        <span className="efb-score efb-score-empty">—</span>
      ) : (
        <span className="efb-score">
          {score}
          {pens != null && <span className="pen">{pens}</span>}
        </span>
      )}
    </div>
  );
}

function PlaceholderMatch() {
  return (
    <div className="efb-match" style={{ opacity: 0.55 }}>
      <div className="efb-side tbd">
        <div className="efb-team">
          <span className="efb-name">TBD</span>
        </div>
        <span className="efb-score">—</span>
      </div>
      <div className="efb-side tbd">
        <div className="efb-team">
          <span className="efb-name">TBD</span>
        </div>
        <span className="efb-score">—</span>
      </div>
      <div className="efb-foot">
        <span className="foot-text">PENDING</span>
      </div>
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      .efb-page { display: flex; flex-direction: column; }

      .efb-head { padding-bottom: 14px; }
      .efb-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 32px;
        line-height: 0.92; letter-spacing: -0.03em;
        color: hsl(var(--ink)); margin: 0 0 6px;
      }
      @media (min-width: 768px) {
        .efb-title { font-size: 40px; }
      }
      .efb-title .accent { color: hsl(var(--accent)); font-style: italic; }
      .efb-head .efb-sub {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 500;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42); line-height: 1.5;
      }

      .efb-meta {
        display: grid; grid-template-columns: repeat(3, 1fr);
        gap: 1px; background: hsl(var(--ink));
        border: 1px solid hsl(var(--ink));
        margin-bottom: 14px;
      }
      .efb-meta-cell { background: hsl(var(--surface)); padding: 10px 12px; }
      .efb-meta-cell .lbl {
        display: block;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px; font-weight: 500;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42); margin-bottom: 4px;
      }
      .efb-meta-cell .val {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800; font-size: 18px;
        line-height: 1; letter-spacing: -0.02em;
        color: hsl(var(--ink));
      }
      .efb-meta-cell .val.live { color: hsl(var(--live)); }
      .efb-meta-cell .val .dim { color: hsl(var(--ink) / 0.42); font-weight: 500; }

      .efb-champ {
        background: hsl(var(--ink));
        color: hsl(var(--bg));
        padding: 26px 18px 20px;
        margin-bottom: 14px;
        box-shadow: 4px 4px 0 hsl(var(--accent));
      }
      .efb-champ .crown {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.22em; text-transform: uppercase;
        color: hsl(var(--accent)); margin-bottom: 12px;
      }
      .efb-champ .country {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 48px;
        line-height: 0.84; letter-spacing: -0.04em;
        margin-bottom: 6px;
      }
      .efb-champ .country .accent { color: hsl(var(--accent)); font-style: italic; }
      .efb-champ .handle {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px; font-weight: 700;
        letter-spacing: 0.16em; text-transform: uppercase;
        color: hsl(var(--bg) / 0.7); margin-bottom: 16px;
      }
      .efb-champ .summary {
        display: flex; gap: 18px; padding-top: 14px;
        border-top: 1px solid hsl(var(--bg) / 0.15);
      }
      .efb-champ .summary > div { display: flex; flex-direction: column; gap: 3px; }
      .efb-champ .summary .lbl {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px; font-weight: 500;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--bg) / 0.5);
      }
      .efb-champ .summary .val {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800; font-size: 17px;
        line-height: 1; letter-spacing: -0.02em;
      }
      .efb-champ .summary .val.accent { color: hsl(var(--accent)); }

      .efb-projected-banner {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 14px; margin-bottom: 16px;
        background: hsl(var(--warn) / 0.08);
        border: 1px solid hsl(var(--warn) / 0.30);
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 700;
        letter-spacing: 0.12em; text-transform: uppercase;
        color: hsl(var(--warn));
      }
      .efb-projected-banner .dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: hsl(var(--warn)); flex-shrink: 0;
      }
      .efb-section-head {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 700;
        letter-spacing: 0.18em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42); margin-bottom: 10px;
      }
      .efb-projected-list { display: flex; flex-direction: column; gap: 4px; }
      .efb-projected-row {
        display: grid; grid-template-columns: 1fr auto 1fr;
        gap: 10px; align-items: center;
        background: hsl(var(--surface));
        border: 1px dashed hsl(var(--ink) / 0.18);
        padding: 9px 14px;
      }
      .efb-projected-row .seed {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800; font-size: 13px;
        color: hsl(var(--ink)); letter-spacing: -0.01em;
        font-variant-numeric: tabular-nums;
      }
      .efb-projected-row .seed.right { text-align: right; }
      .efb-projected-row .vs {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.18em; color: hsl(var(--ink) / 0.42);
      }
      .efb-projected-future {
        padding: 14px;
        background: hsl(var(--surface));
        border: 1px dashed hsl(var(--ink) / 0.18);
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 500;
        letter-spacing: 0.10em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42); text-align: center;
      }

      .efb-scroll-hint {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 500;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 8px;
      }
      .efb-scroll-hint .arrow { color: hsl(var(--accent)); font-weight: 700; }

      .efb-tree-scroll {
        overflow-x: auto; overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
        border-top: 1px solid hsl(var(--ink));
        background: hsl(var(--bg));
        margin-left: -20px; margin-right: -20px;
        padding: 0 20px;
      }
      @media (min-width: 768px) {
        .efb-tree-scroll {
          margin-left: -32px; margin-right: -32px;
          padding: 0 32px;
        }
      }
      .efb-tree-scroll::-webkit-scrollbar { height: 6px; }
      .efb-tree-scroll::-webkit-scrollbar-track { background: transparent; }
      .efb-tree-scroll::-webkit-scrollbar-thumb { background: hsl(var(--ink) / 0.20); }

      .efb-tree {
        display: flex; align-items: stretch;
        width: max-content;
        padding: 12px 0 24px;
        gap: 12px;
      }

      .efb-round {
        flex: 0 0 auto; width: 220px;
        display: flex; flex-direction: column;
      }
      .efb-round-head {
        padding: 8px 0 12px; margin-bottom: 12px;
        border-bottom: 1px solid hsl(var(--ink));
        display: flex; align-items: baseline; justify-content: space-between;
        flex-shrink: 0;
      }
      .efb-round-head .name {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 16px;
        line-height: 1; letter-spacing: -0.02em;
        color: hsl(var(--ink));
      }
      .efb-round-head .meta {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
      }
      .efb-round-head .meta.live { color: hsl(var(--live)); }

      .efb-matches {
        flex: 1;
        display: flex; flex-direction: column;
        justify-content: space-around;
        gap: 6px;
      }

      .efb-match {
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink) / 0.20);
        position: relative;
      }
      .efb-match.live { border: 2px solid hsl(var(--live)); }
      .efb-match.live::before {
        content: 'AWAIT';
        position: absolute; top: -8px; left: 8px; z-index: 2;
        background: hsl(var(--live)); color: #fff;
        padding: 1px 5px;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px; font-weight: 700; letter-spacing: 0.14em;
      }
      .efb-match.confirm { border: 1px solid hsl(var(--warn)); }
      .efb-match.disputed { border: 2px solid hsl(var(--warn)); }
      .efb-match.disputed::before {
        content: 'DISPUTED';
        position: absolute; top: -8px; left: 8px; z-index: 2;
        background: hsl(var(--warn)); color: #fff;
        padding: 1px 5px;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px; font-weight: 700; letter-spacing: 0.14em;
      }
      .efb-match.path-win { box-shadow: 0 0 0 2px hsl(var(--accent)); }

      .efb-side {
        display: grid; grid-template-columns: minmax(0, 1fr) auto;
        align-items: center; gap: 6px;
        padding: 7px 10px;
        border-bottom: 1px solid hsl(var(--ink) / 0.08);
      }
      .efb-side:last-of-type { border-bottom: none; }
      .efb-side.win {
        background: hsl(var(--accent) / 0.08);
        border-left: 3px solid hsl(var(--accent));
        padding-left: 7px;
      }
      .efb-side.loss { opacity: 0.55; }
      .efb-side.tbd { color: hsl(var(--ink) / 0.42); }

      .efb-team {
        min-width: 0; display: flex; flex-direction: column; gap: 2px;
      }
      .efb-name {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800; font-size: 13px;
        letter-spacing: -0.005em; line-height: 1;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        color: hsl(var(--ink));
      }
      .efb-side.win .efb-name { color: hsl(var(--accent)); }
      .efb-side.tbd .efb-name {
        font-style: italic;
        color: hsl(var(--ink) / 0.42);
        font-weight: 600;
      }
      .efb-handle {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px; font-weight: 500;
        letter-spacing: 0.1em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42); line-height: 1;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .efb-score {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 17px;
        color: hsl(var(--ink)); letter-spacing: -0.02em;
        line-height: 1; font-variant-numeric: tabular-nums;
      }
      .efb-score .pen {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 600;
        color: hsl(var(--ink) / 0.42); margin-left: 2px;
      }
      .efb-side.loss .efb-score { color: hsl(var(--ink) / 0.42); }
      .efb-side.tbd .efb-score,
      .efb-score-empty {
        color: hsl(var(--ink) / 0.42); font-weight: 400;
      }

      .efb-foot {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 7px; font-weight: 700;
        letter-spacing: 0.16em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        padding: 4px 8px;
        border-top: 1px solid hsl(var(--ink) / 0.08);
        background: hsl(var(--surface-2));
        display: flex; justify-content: space-between; align-items: center;
        gap: 6px;
      }
      .efb-foot .foot-text { flex: 1; text-align: center; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .efb-foot.aet .foot-text { color: hsl(var(--warn)); }
      .efb-foot.live .foot-text { color: hsl(var(--live)); }
      .efb-foot.confirm .foot-text { color: hsl(var(--warn)); }
      .efb-foot .foot-mod {
        color: hsl(var(--accent));
        font-weight: 700;
        flex-shrink: 0;
        text-decoration: none;
      }
      .efb-foot .foot-mod:hover { color: hsl(var(--ink)); }

      .efb-empty {
        text-align: center;
        padding: 48px 24px;
        border: 1px dashed hsl(var(--ink) / 0.20);
        background: hsl(var(--surface));
      }
      .efb-empty.efb-empty-warn {
        border: 1px dashed hsl(var(--warn) / 0.40);
        background: hsl(var(--warn) / 0.04);
      }
      .efb-empty-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 22px;
        line-height: 1.05; letter-spacing: -0.025em;
        color: hsl(var(--ink)); margin-bottom: 10px;
      }
      .efb-empty.efb-empty-warn .efb-empty-title { color: hsl(var(--warn)); }
      .efb-empty-body {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 14px; line-height: 1.5;
        color: hsl(var(--ink) / 0.62);
        max-width: 440px; margin: 0 auto;
      }
    `}</style>
  );
}
