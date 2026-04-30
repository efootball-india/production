import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getCurrentPlayer, getPlayerByUsername, PLATFORM_LABELS } from '@/lib/player';
import { getPlayerStats } from '@/lib/stats';
import { getPlayerConsistency, seasonWindow, pointsToNextTier } from '@/lib/consistency';
import { getMatchHistory, getTournamentsForPlayer, getHeadToHead } from '@/lib/player-profile';

export default async function PublicPlayerProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const viewer = await getCurrentPlayer();
  const player = await getPlayerByUsername(params.username);
  if (!player) notFound();

  // If viewing your own profile, redirect to /profile
  if (viewer && viewer.id === player.id) {
    redirect('/profile');
  }

  const [stats, consistency, history, tournaments] = await Promise.all([
    getPlayerStats(player.id),
    getPlayerConsistency(player.id),
    getMatchHistory(player.id, 10),
    getTournamentsForPlayer(player.id),
  ]);

  const h2h = viewer ? await getHeadToHead(viewer.id, player.id) : null;
  const { label: seasonLabel } = seasonWindow();

  const displayName = player.display_name ?? player.username ?? '';
  const initial = (displayName.charAt(0) || '?').toUpperCase();
  const handle = player.username ? `@${player.username.toUpperCase()}` : '';

  const platformLabel = player.platform
    ? (PLATFORM_LABELS as any)[player.platform] ?? player.platform
    : null;
  const region = player.region ? player.region.toUpperCase() : null;

  const metaParts: string[] = [];
  if (platformLabel) metaParts.push(platformLabel);
  if (region) metaParts.push(region);

  const tier = consistency?.tier ?? 'unranked';
  const points = consistency?.points ?? 0;
  const rank = consistency?.rank ?? null;
  const isUnranked = tier === 'unranked' || points < 100;
  const nextTier = pointsToNextTier(points);

  const championships = tournaments.filter((t) => t.placement === 'winner');

  return (
    <>
      <Styles />
      <main className="pp-page">
        <Link href="/players" className="pp-back">← All players</Link>

        {/* Hero */}
        <div className="pp-hero">
          <div className="pp-top">
            <div
              className="pp-avatar"
              style={
                player.avatar_url
                  ? {
                      backgroundImage: `url(${player.avatar_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              {!player.avatar_url && <span className="initial">{initial}</span>}
            </div>
            <div className="pp-id">
              <h1 className="pp-name">{displayName}</h1>
              {handle && <div className="pp-handle">{handle}</div>}
              {metaParts.length > 0 && (
                <div className="pp-meta">{metaParts.join(' · ')}</div>
              )}
            </div>
          </div>

          <div className="pp-stats">
            <div className="pp-cell w">
              <span className="lbl">Wins</span>
              <span className="val">{stats.wins}</span>
            </div>
            <div className="pp-cell">
              <span className="lbl">Draws</span>
              <span className="val">{stats.draws}</span>
            </div>
            <div className="pp-cell l">
              <span className="lbl">Losses</span>
              <span className="val">{stats.losses}</span>
            </div>
          </div>
        </div>

        {/* Consistency block */}
        <div className="pp-consistency">
          <div className="pp-cons-head">
            <span>CONSISTENCY · {seasonLabel}</span>
            <Link href="/players?tab=about">What's this?</Link>
          </div>
          {isUnranked ? (
            <div className="pp-cons-empty">
              <span className={`pp-tier-pill tier-${tier}`}>UNRANKED</span>
              <span className="empty-text">Less than 100 points this season.</span>
            </div>
          ) : (
            <div className="pp-cons-grid">
              <div className="pp-cons-rank">
                <div className={`pp-cons-num tier-${tier}-text`}>#{rank}</div>
                <div className="pp-cons-lbl">RANK</div>
              </div>
              <div className="pp-cons-tier">
                <span className={`pp-tier-pill tier-${tier}`}>
                  {tier.toUpperCase()}
                </span>
                {nextTier.next && (
                  <div className="pp-cons-next">
                    +{nextTier.needed} to {nextTier.next.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="pp-cons-pts">
                <div className="pp-cons-num accent">{points}</div>
                <div className="pp-cons-lbl">PTS</div>
              </div>
            </div>
          )}
        </div>

        {/* Bio */}
        {player.bio && (
          <div className="pp-bio">
            <div className="lbl">BIO</div>
            <div className="body">{player.bio}</div>
          </div>
        )}

        {/* Connections (public only) */}
        {(player.game_id || player.discord_handle) && (
          <div className="pp-section">
            <div className="pp-section-head">CONNECTIONS</div>
            <div className="pp-info">
              {player.game_id && (
                <div className="pp-row">
                  <span className="lbl">Friend code</span>
                  <span className="val mono">{player.game_id}</span>
                </div>
              )}
              {player.discord_handle && (
                <div className="pp-row">
                  <span className="lbl">Discord</span>
                  <span className="val mono">{player.discord_handle}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Head-to-head (only if viewer has played them) */}
        {h2h && h2h.matches > 0 && (
          <div className="pp-section">
            <div className="pp-section-head">YOU VS THEM · H2H</div>
            <div className="pp-h2h">
              <div className="pp-h2h-cell">
                <span className="num accent">{h2h.myWins}</span>
                <span className="lbl">YOUR WINS</span>
              </div>
              <div className="pp-h2h-cell">
                <span className="num">{h2h.draws}</span>
                <span className="lbl">DRAWS</span>
              </div>
              <div className="pp-h2h-cell">
                <span className="num">{h2h.oppWins}</span>
                <span className="lbl">THEIR WINS</span>
              </div>
            </div>
            <div className="pp-h2h-foot">{h2h.matches} match{h2h.matches === 1 ? '' : 'es'} total</div>
          </div>
        )}

        {/* Match history */}
        <div className="pp-section">
          <div className="pp-section-head">RECENT MATCHES</div>
          {history.length === 0 ? (
            <div className="pp-empty">No matches played yet.</div>
          ) : (
            <div className="pp-history">
              {history.map((m) => (
                <Link
                  key={m.matchId}
                  href={`/tournaments/${m.tournamentSlug}/bracket`}
                  className={`pp-match pp-match-${m.result}`}
                >
                  <div className="pp-match-result">
                    {m.result === 'won' ? 'W' : m.result === 'lost' ? 'L' : 'D'}
                  </div>
                  <div className="pp-match-body">
                    <div className="pp-match-tourney">
                      {m.tournamentName.toUpperCase()} · {m.stage}
                    </div>
                    <div className="pp-match-opp">
                      vs {m.oppCountry ?? '?'}
                      {m.oppUsername && (
                        <span className="handle"> · @{m.oppUsername}</span>
                      )}
                    </div>
                  </div>
                  <div className="pp-match-score">
                    {m.myScore ?? '—'}{' — '}{m.oppScore ?? '—'}
                    {m.decidedBy === 'penalties' && (
                      <span className="aet"> P</span>
                    )}
                    {m.decidedBy === 'extra_time' && (
                      <span className="aet"> AET</span>
                    )}
                    {m.status === 'walkover' && (
                      <span className="aet"> W/O</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Tournaments */}
        {tournaments.length > 0 && (
          <div className="pp-section">
            <div className="pp-section-head">TOURNAMENTS · {tournaments.length}</div>
            {championships.length > 0 && (
              <div className="pp-champs">
                <div className="pp-champs-eye">★ CHAMPIONSHIPS · {championships.length}</div>
                {championships.map((t) => (
                  <Link
                    key={t.tournamentId}
                    href={`/tournaments/${t.slug}`}
                    className="pp-champ-row"
                  >
                    <span className="trophy">★</span>
                    <span className="name">{t.name}</span>
                    <span className="arrow">→</span>
                  </Link>
                ))}
              </div>
            )}
            <div className="pp-tourney-list">
              {tournaments
                .filter((t) => t.placement !== 'winner')
                .map((t) => (
                  <Link
                    key={t.tournamentId}
                    href={`/tournaments/${t.slug}`}
                    className="pp-tourney-row"
                  >
                    <div className="pp-tourney-name">{t.name}</div>
                    <div className="pp-tourney-meta">
                      {placementLabel(t.placement)} · {statusLabel(t.status)}
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function placementLabel(p: string | null): string {
  if (p === 'runner_up') return 'RUNNER-UP';
  if (p === 'semifinalist') return 'SEMIFINALIST';
  return '';
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    in_progress: 'IN PROGRESS',
    completed: 'COMPLETED',
    registration_open: 'OPEN',
    registration_closed: 'CLOSED',
  };
  return map[s] ?? s.toUpperCase();
}

function Styles() {
  return (
    <style>{`
      .pp-page {
        max-width: 560px;
        margin: 0 auto;
        padding: 16px 20px 60px;
      }

      .pp-back {
        display: inline-block;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.62);
        text-decoration: none;
        margin-bottom: 16px;
      }
      .pp-back:hover { color: hsl(var(--ink)); }

      /* Hero */
      .pp-hero {
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink));
        box-shadow: 4px 4px 0 hsl(var(--ink));
        padding: 22px 20px;
        margin-bottom: 18px;
      }
      .pp-top {
        display: grid;
        grid-template-columns: 80px minmax(0, 1fr);
        gap: 16px;
        align-items: center;
        margin-bottom: 20px;
      }
      .pp-avatar {
        width: 80px; height: 80px;
        background: hsl(var(--ink));
        color: hsl(var(--bg));
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }
      .pp-avatar .initial {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 40px;
        letter-spacing: -0.04em; line-height: 1;
      }
      .pp-id { min-width: 0; }
      .pp-name {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 26px;
        line-height: 0.95; letter-spacing: -0.03em;
        color: hsl(var(--ink));
        margin: 0 0 4px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .pp-handle {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 700;
        letter-spacing: 0.16em;
        color: hsl(var(--ink) / 0.42);
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      .pp-meta {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 500;
        letter-spacing: 0.14em;
        color: hsl(var(--ink) / 0.62);
        text-transform: uppercase;
      }

      .pp-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1px;
        background: hsl(var(--ink));
        border: 1px solid hsl(var(--ink));
      }
      .pp-cell {
        background: hsl(var(--surface));
        padding: 12px;
        text-align: center;
      }
      .pp-cell .lbl {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px; font-weight: 500;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        margin-bottom: 6px; display: block;
      }
      .pp-cell .val {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 24px;
        line-height: 1; letter-spacing: -0.025em;
        color: hsl(var(--ink));
        font-variant-numeric: tabular-nums;
      }
      .pp-cell.w .val { color: hsl(var(--accent)); }
      .pp-cell.l .val { color: hsl(var(--ink) / 0.42); }

      /* Consistency block */
      .pp-consistency {
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink));
        padding: 16px;
        margin-bottom: 18px;
      }
      .pp-cons-head {
        display: flex; justify-content: space-between; align-items: baseline;
        margin-bottom: 12px;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.18em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
      }
      .pp-cons-head a {
        color: hsl(var(--accent));
        text-decoration: underline;
        font-weight: 700; letter-spacing: 0.10em;
        text-transform: uppercase;
      }

      .pp-cons-grid {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 14px; align-items: center;
      }
      .pp-cons-rank, .pp-cons-pts { text-align: center; }
      .pp-cons-num {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 36px;
        line-height: 0.9;
        letter-spacing: -0.025em;
        color: hsl(var(--ink));
      }
      .pp-cons-num.accent { color: hsl(var(--accent)); font-size: 26px; }
      .pp-cons-num.tier-diamond-text { color: #3C2A4D; }
      .pp-cons-num.tier-platinum-text { color: #042C53; }
      .pp-cons-num.tier-gold-text { color: #633806; }
      .pp-cons-num.tier-silver-text { color: hsl(var(--ink)); }
      .pp-cons-num.tier-bronze-text { color: #4A1B0C; }

      .pp-cons-lbl {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px; font-weight: 500;
        letter-spacing: 0.14em;
        color: hsl(var(--ink) / 0.42);
        margin-top: 2px;
      }
      .pp-cons-tier {
        border-left: 1px solid hsl(var(--ink) / 0.20);
        padding-left: 14px;
      }
      .pp-cons-next {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px;
        color: hsl(var(--ink) / 0.42);
        margin-top: 6px;
        letter-spacing: 0.06em;
      }
      .pp-cons-empty {
        display: flex; align-items: center; gap: 12px;
      }
      .pp-cons-empty .empty-text {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 13px;
        color: hsl(var(--ink) / 0.62);
      }

      /* Tier pills */
      .pp-tier-pill {
        display: inline-block;
        padding: 4px 10px;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 700;
        letter-spacing: 0.14em;
        line-height: 1.4;
      }
      .pp-tier-pill.tier-diamond { background: #C7A4DD; color: #3C2A4D; }
      .pp-tier-pill.tier-platinum { background: #B5D4F4; color: #042C53; }
      .pp-tier-pill.tier-gold { background: #FAC775; color: #633806; }
      .pp-tier-pill.tier-silver { background: #D3D1C7; color: #2C2C2A; }
      .pp-tier-pill.tier-bronze { background: #F5C4B3; color: #4A1B0C; }
      .pp-tier-pill.tier-unranked {
        background: transparent;
        color: hsl(var(--ink) / 0.42);
        border: 1px solid hsl(var(--ink) / 0.20);
      }

      /* Bio */
      .pp-bio {
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink) / 0.20);
        border-left: 3px solid hsl(var(--accent));
        padding: 14px 16px;
        margin-bottom: 18px;
      }
      .pp-bio .lbl {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.18em;
        color: hsl(var(--ink) / 0.42);
        text-transform: uppercase;
        margin-bottom: 6px;
      }
      .pp-bio .body {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 14px; line-height: 1.5;
        color: hsl(var(--ink) / 0.62);
      }

      /* Section */
      .pp-section { margin-bottom: 22px; }
      .pp-section-head {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.18em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid hsl(var(--ink));
      }
      .pp-info {
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink) / 0.20);
      }
      .pp-row {
        display: flex; justify-content: space-between; align-items: baseline;
        padding: 12px 14px; gap: 12px;
        border-bottom: 1px solid hsl(var(--ink) / 0.08);
      }
      .pp-row:last-child { border-bottom: none; }
      .pp-row .lbl {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 500;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42); flex-shrink: 0;
      }
      .pp-row .val {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 14px; font-weight: 700;
        color: hsl(var(--ink));
        text-align: right;
        max-width: 60%;
      }
      .pp-row .val.mono {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 12px;
        word-break: break-all;
        white-space: normal;
      }

      /* H2H */
      .pp-h2h {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1px;
        background: hsl(var(--ink));
        border: 1px solid hsl(var(--ink));
      }
      .pp-h2h-cell {
        background: hsl(var(--surface));
        padding: 14px 10px;
        text-align: center;
      }
      .pp-h2h-cell .num {
        display: block;
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 24px;
        line-height: 1; letter-spacing: -0.025em;
        color: hsl(var(--ink));
        font-variant-numeric: tabular-nums;
        margin-bottom: 4px;
      }
      .pp-h2h-cell .num.accent { color: hsl(var(--accent)); }
      .pp-h2h-cell .lbl {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px; font-weight: 500;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
      }
      .pp-h2h-foot {
        text-align: center;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 500;
        letter-spacing: 0.12em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        padding: 8px 0 0;
      }

      /* Match history */
      .pp-history {
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink) / 0.20);
      }
      .pp-match {
        display: grid;
        grid-template-columns: 36px 1fr auto;
        gap: 10px; align-items: center;
        padding: 10px 12px;
        border-bottom: 1px solid hsl(var(--ink) / 0.08);
        text-decoration: none; color: inherit;
      }
      .pp-match:last-child { border-bottom: none; }
      .pp-match:hover { background: hsl(var(--ink) / 0.04); }

      .pp-match-result {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 18px;
        text-align: center;
        line-height: 1;
        padding: 6px 0;
      }
      .pp-match-won .pp-match-result { color: hsl(var(--accent)); }
      .pp-match-lost .pp-match-result { color: hsl(var(--ink) / 0.42); }
      .pp-match-drew .pp-match-result { color: hsl(var(--ink) / 0.62); }

      .pp-match-body { min-width: 0; }
      .pp-match-tourney {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px; font-weight: 500;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        margin-bottom: 3px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .pp-match-opp {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 700; font-size: 13px;
        color: hsl(var(--ink));
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .pp-match-opp .handle {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 500;
        color: hsl(var(--ink) / 0.42);
        letter-spacing: 0.10em;
        text-transform: uppercase;
      }
      .pp-match-score {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 16px;
        color: hsl(var(--ink));
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .pp-match-lost .pp-match-score { color: hsl(var(--ink) / 0.42); }
      .pp-match-score .aet {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.14em;
        color: hsl(var(--warn));
        margin-left: 2px;
      }

      /* Tournaments */
      .pp-champs { margin-bottom: 14px; }
      .pp-champs-eye {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.18em; text-transform: uppercase;
        color: #BA7517;
        margin-bottom: 8px;
      }
      .pp-champ-row {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 14px;
        background: #FAEEDA;
        border: 1px solid #FAC775;
        text-decoration: none;
        color: hsl(var(--ink));
        margin-bottom: 6px;
      }
      .pp-champ-row .trophy {
        font-size: 16px; color: #BA7517;
        flex-shrink: 0;
      }
      .pp-champ-row .name {
        flex: 1;
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800; font-size: 14px;
        letter-spacing: -0.005em;
      }
      .pp-champ-row .arrow {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; color: #BA7517;
      }
      .pp-tourney-list {
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink) / 0.20);
      }
      .pp-tourney-row {
        display: flex; justify-content: space-between; align-items: baseline;
        padding: 10px 14px;
        border-bottom: 1px solid hsl(var(--ink) / 0.08);
        text-decoration: none;
        color: inherit;
        gap: 12px;
      }
      .pp-tourney-row:last-child { border-bottom: none; }
      .pp-tourney-row:hover { background: hsl(var(--ink) / 0.04); }
      .pp-tourney-name {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 700; font-size: 13px;
        color: hsl(var(--ink));
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        min-width: 0;
      }
      .pp-tourney-meta {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 500;
        letter-spacing: 0.14em;
        color: hsl(var(--ink) / 0.42);
        text-transform: uppercase;
        flex-shrink: 0;
      }

      .pp-empty {
        background: hsl(var(--surface));
        border: 1px dashed hsl(var(--ink) / 0.20);
        padding: 20px;
        text-align: center;
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 13px;
        color: hsl(var(--ink) / 0.62);
      }
    `}</style>
  );
}
