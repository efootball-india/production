// PASS-3-PAGE-DRAW (editorial broadcast layout, no mid-file 'use client')
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentPlayer } from '@/lib/player';
import {
  getDrawState,
  listParticipantsForDraw,
  buildGroupView,
  listAvailableCountries,
  maxRerollsForWinner,
} from '@/lib/draw';
import {
  toggleQuizWinner,
  startDraw,
  completeDraw,
  resetDraw,
} from '../../../../actions/draw';
import { createClient } from '@/lib/supabase/server';
import DrawStageClient from '../../../../../components/DrawStageClient';
import {
  ToggleWinnerButton,
  StartDrawButton,
  CompleteDrawButton,
  ResetDrawButton,
} from '../../../../../components/DrawActionButtons';

const NAME_TO_CODE: Record<string, string> = {
  'Argentina': 'AR', 'Australia': 'AU', 'Belgium': 'BE', 'Brazil': 'BR',
  'Cameroon': 'CM', 'Canada': 'CA', 'Chile': 'CL', 'Colombia': 'CO',
  'Costa Rica': 'CR', 'Croatia': 'HR', 'Czech Republic': 'CZ',
  'Denmark': 'DK', 'Ecuador': 'EC', 'Egypt': 'EG', 'England': 'GB',
  'France': 'FR', 'Germany': 'DE', 'Ghana': 'GH', 'Iran': 'IR',
  'Ireland': 'IE', 'Italy': 'IT', 'Japan': 'JP', 'Mexico': 'MX',
  'Morocco': 'MA', 'Netherlands': 'NL', 'Nigeria': 'NG', 'Norway': 'NO',
  'Peru': 'PE', 'Poland': 'PL', 'Portugal': 'PT', 'Qatar': 'QA',
  'Russia': 'RU', 'Saudi Arabia': 'SA', 'Scotland': 'GB', 'Senegal': 'SN',
  'Serbia': 'RS', 'South Africa': 'ZA', 'South Korea': 'KR',
  'Korea Republic': 'KR', 'Spain': 'ES', 'Sweden': 'SE', 'Switzerland': 'CH',
  'Tunisia': 'TN', 'Turkey': 'TR', 'Ukraine': 'UA', 'United States': 'US',
  'USA': 'US', 'Uruguay': 'UY', 'Wales': 'GB',
};

function codeToFlag(code: string): string {
  if (!code || code.length !== 2) return '🏴';
  const upper = code.toUpperCase();
  const a = upper.charCodeAt(0);
  const b = upper.charCodeAt(1);
  if (a < 65 || a > 90 || b < 65 || b > 90) return '🏴';
  return String.fromCodePoint(0x1F1E6 + a - 65, 0x1F1E6 + b - 65);
}

function flagForCountry(country: { code?: string | null; name: string }): string {
  if (country.code) return codeToFlag(country.code);
  const fromMap = NAME_TO_CODE[country.name];
  return fromMap ? codeToFlag(fromMap) : '🏴';
}

export default async function DrawPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { revealed?: string; for?: string; error?: string };
}) {
  const player = await getCurrentPlayer();
  if (!player) redirect('/signin');
  if (player.role !== 'admin' && player.role !== 'super_admin') redirect('/');

  const supabase = createClient();
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!tournament) notFound();

  const drawState = await getDrawState(tournament.id);
  const participants = await listParticipantsForDraw(tournament.id);
  const groups = await buildGroupView(tournament.id);
  const available = await listAvailableCountries(tournament.id);

  const active = participants.filter((p) => p.status === 'registered');
  const undrawnPlayers = active.filter((p) => !p.country_id);
  const totalActive = active.length;
  const drawnCount = totalActive - undrawnPlayers.length;
  const progressPct = totalActive > 0 ? Math.round((drawnCount / totalActive) * 100) : 0;

  const justRevealed = searchParams.revealed && searchParams.for
    ? participants.find((p) => p.id === searchParams.for) ?? null
    : null;

  const focusedParticipant = justRevealed ?? undrawnPlayers[0] ?? null;

  let stageMode: 'ready' | 'revealed' | 'all_drawn' = 'ready';
  if (justRevealed && justRevealed.country) {
    stageMode = 'revealed';
  } else if (undrawnPlayers.length === 0 && totalActive > 0) {
    stageMode = 'all_drawn';
  }

  const upNextNames = (justRevealed
    ? undrawnPlayers
    : undrawnPlayers.slice(1)
  )
    .slice(0, 2)
    .map((p) => p.player?.username ?? '?');

  const rerollsRemaining = justRevealed?.is_quiz_winner
    ? Math.max(0, maxRerollsForWinner() - (justRevealed?.rerolls_used ?? 0))
    : 0;

  const activeGroupLabel = (() => {
    if (justRevealed?.country?.group_label) return justRevealed.country.group_label;
    for (const g of groups) {
      if (g.slots.some((s) => !s.participant)) return g.label;
    }
    return null;
  })();

  const justFilledCountryId = justRevealed?.country_id ?? null;

  return (
    <>
      <Styles />
      <main className="dr-page">

        <div className="dr-chrome">
          <div className="dr-chrome-head">
            <Link href={`/tournaments/${tournament.slug}`} className="dr-breadcrumb">
              ← {tournament.name}
            </Link>
            <h1 className="dr-title">
              Group <span className="accent">draw.</span>
            </h1>
            <div className="dr-status">
              {drawState.status === 'not_started' && 'NOT STARTED'}
              {drawState.status === 'in_progress' && 'LIVE NOW'}
              {drawState.status === 'completed' && '★ DRAW COMPLETE'}
            </div>
          </div>
          {drawState.status !== 'not_started' && (
            <div className="dr-progress">
              <div className="count">
                <span className="done">{drawnCount}</span>
                <span className="of">/ {totalActive} drawn</span>
              </div>
              <div className="bar">
                <div className="fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}
        </div>

        {searchParams.error && (
          <div className="dr-banner warn">
            <span className="dot" />
            <span>{searchParams.error.toUpperCase()}</span>
          </div>
        )}

        {drawState.status === 'not_started' && (
          <div className="dr-setup">
            <div className="dr-setup-eye">SETUP · MARK QUIZ WINNERS</div>
            <p className="dr-setup-body">
              Quiz winners get <strong>2 rerolls</strong> during the draw if they don't like the country they get.
              Mark them now, then start the draw. The draw goes in registration order.
            </p>

            <div className="dr-setup-list">
              {active.length === 0 ? (
                <div className="dr-setup-empty">
                  No registered players yet. Add players to begin.
                </div>
              ) : (
                active.map((p, i) => (
                  <div key={p.id} className="dr-setup-row">
                    <span className="num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="who">
                      {p.player?.display_name ?? p.player?.username ?? '?'}
                      <span className="handle">
                        @{(p.player?.username ?? '').toUpperCase()}
                      </span>
                    </span>
                    {p.is_quiz_winner && <span className="winner-pill">★ QUIZ WINNER</span>}
                    <form action={toggleQuizWinner}>
                      <input type="hidden" name="participant_id" value={p.id} />
                      <input type="hidden" name="slug" value={tournament.slug} />
                      <ToggleWinnerButton isWinner={p.is_quiz_winner} />
                    </form>
                  </div>
                ))
              )}
            </div>

            {active.length > 0 && (
              <form action={startDraw} className="dr-setup-start">
                <input type="hidden" name="slug" value={tournament.slug} />
                <StartDrawButton />
              </form>
            )}
          </div>
        )}

        {drawState.status === 'in_progress' && (
          <div className="dr-broadcast">

            <aside className="dr-pool">
              <div className="dr-pool-head">
                <span className="label">
                  <span className="strong">POOL</span> · REMAINING
                </span>
                <span className="num">{available.length}</span>
              </div>
              <div className="dr-pool-grid">
                {groups.flatMap((g) =>
                  g.slots.map((s) => {
                    const taken = !!s.participant;
                    const justDrawn = s.country.id === justFilledCountryId;
                    return (
                      <div
                        key={s.country.id}
                        className={`dr-pool-card ${taken ? 'taken' : ''} ${justDrawn ? 'just-drawn' : ''}`}
                      >
                        <span className="flag">{flagForCountry(s.country)}</span>
                        <span className="name">{s.country.name}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            {focusedParticipant ? (
              <DrawStageClient
                slug={tournament.slug}
                mode={stageMode}
                currentPlayer={{
                  initial: (focusedParticipant.player?.display_name ?? focusedParticipant.player?.username ?? '?')
                    .charAt(0)
                    .toUpperCase(),
                  displayName:
                    focusedParticipant.player?.display_name ??
                    focusedParticipant.player?.username ??
                    'Unknown',
                  username: focusedParticipant.player?.username ?? 'unknown',
                  avatarUrl: (focusedParticipant.player as any)?.avatar_url ?? null,
                  isQuizWinner: focusedParticipant.is_quiz_winner,
                }}
                participantId={focusedParticipant.id}
                poolSize={available.length}
                pickNumber={drawnCount + 1}
                justDrawnCountry={
                  stageMode === 'revealed' && justRevealed?.country
                    ? {
                        name: justRevealed.country.name,
                        flag: flagForCountry(justRevealed.country),
                        groupLabel: justRevealed.country.group_label,
                      }
                    : null
                }
                rerollsRemaining={rerollsRemaining}
                upNextNames={upNextNames}
              />
            ) : (
              <DrawStageClient
                slug={tournament.slug}
                mode="all_drawn"
                currentPlayer={null}
                participantId={null}
                poolSize={0}
                pickNumber={drawnCount}
                justDrawnCountry={null}
                rerollsRemaining={0}
                upNextNames={[]}
              />
            )}

            <aside className="dr-groups">
              <div className="dr-groups-head">
                <span className="label">
                  <span className="strong">GROUPS</span> · {groups.length} × {groups[0]?.slots.length ?? 4}
                </span>
              </div>
              <div className="dr-groups-list">
                {groups.map((g) => {
                  const filled = g.slots.filter((s) => s.participant).length;
                  const isActive = g.label === activeGroupLabel;
                  return (
                    <div key={g.label} className={`dr-group ${isActive ? 'active' : ''}`}>
                      <div className="dr-group-label">
                        <span>
                          GROUP {g.label}
                          {isActive && drawState.status === 'in_progress' && ' · DRAWING'}
                        </span>
                        <span className="filled">
                          {filled} / {g.slots.length}
                        </span>
                      </div>
                      {g.slots.map((s) => {
                        const justFilled = s.country.id === justFilledCountryId;
                        return (
                          <div
                            key={s.country.id}
                            className={`dr-slot ${s.participant ? 'filled' : 'empty'} ${justFilled ? 'just-filled' : ''}`}
                          >
                            <div className="left">
                              <span className="flag">{flagForCountry(s.country)}</span>
                              <span className="cn">{s.country.name}</span>
                            </div>
                            <span className="h">
                              {s.participant?.player?.username
                                ? `@${s.participant.player.username.slice(0, 8).toUpperCase()}`
                                : '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        )}

        {drawState.status === 'completed' && (
          <div className="dr-completed">
            <div className="dr-completed-eye">★ DRAW COMPLETE</div>
            <h2 className="dr-completed-title">All players placed.</h2>
            <p className="dr-completed-body">
              The draw is locked. Group fixtures can now be generated.
            </p>
            <Link href={`/tournaments/${tournament.slug}`} className="dr-completed-link">
              View tournament →
            </Link>
            <div className="dr-broadcast dr-broadcast-completed">
              <aside className="dr-groups dr-groups-full">
                <div className="dr-groups-head">
                  <span className="label">
                    <span className="strong">FINAL GROUPS</span>
                  </span>
                </div>
                <div className="dr-groups-list">
                  {groups.map((g) => (
                    <div key={g.label} className="dr-group">
                      <div className="dr-group-label">
                        <span>GROUP {g.label}</span>
                        <span className="filled">
                          {g.slots.length} / {g.slots.length}
                        </span>
                      </div>
                      {g.slots.map((s) => (
                        <div key={s.country.id} className="dr-slot filled">
                          <div className="left">
                            <span className="flag">{flagForCountry(s.country)}</span>
                            <span className="cn">{s.country.name}</span>
                          </div>
                          <span className="h">
                            {s.participant?.player?.username
                              ? `@${s.participant.player.username.slice(0, 8).toUpperCase()}`
                              : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        )}

        {drawState.status === 'in_progress' && undrawnPlayers.length === 0 && totalActive > 0 && (
          <div className="dr-complete-row">
            <form action={completeDraw}>
              <input type="hidden" name="slug" value={tournament.slug} />
              <CompleteDrawButton />
            </form>
          </div>
        )}

        {drawState.status !== 'not_started' && (
          <div className="dr-danger">
            <details>
              <summary>Danger zone</summary>
              <div className="dr-danger-row">
                <div>
                  <div className="dr-danger-name">Reset draw</div>
                  <div className="dr-danger-desc">
                    Clear all country assignments and start over. Locked once any match is played.
                  </div>
                </div>
                <form action={resetDraw}>
                  <input type="hidden" name="slug" value={tournament.slug} />
                  <ResetDrawButton />
                </form>
              </div>
            </details>
          </div>
        )}
      </main>
    </>
  );
}

function Styles() {
  return (
    <style>{`
      .dr-page {
        max-width: 1100px;
        margin: 0 auto;
        padding: 16px 0 60px;
      }

      .dr-chrome {
        padding: 0 20px 18px;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      @media (max-width: 720px) {
        .dr-chrome { padding: 0 16px 14px; }
      }
      .dr-chrome-head { min-width: 0; flex: 1; }
      .dr-breadcrumb {
        display: inline-block;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.55);
        text-decoration: none;
        margin-bottom: 6px;
      }
      .dr-breadcrumb:hover { color: hsl(var(--ink)); }
      .dr-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 32px;
        line-height: 0.92;
        letter-spacing: -0.025em;
        margin: 0 0 4px;
      }
      @media (max-width: 720px) {
        .dr-title { font-size: 26px; }
      }
      .dr-title .accent {
        color: hsl(var(--accent));
        font-style: italic;
      }
      .dr-status {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
      }
      .dr-progress {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
        flex-shrink: 0;
      }
      .dr-progress .count {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.55);
      }
      .dr-progress .count .done {
        color: hsl(var(--accent));
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 14px;
        margin-right: 4px;
      }
      .dr-progress .bar {
        width: 200px;
        height: 4px;
        background: hsl(var(--ink) / 0.10);
        position: relative;
      }
      .dr-progress .bar .fill {
        position: absolute;
        top: 0; left: 0; height: 100%;
        background: hsl(var(--accent));
        transition: width 0.5s ease;
      }
      @media (max-width: 720px) {
        .dr-progress .bar { width: 100%; }
        .dr-progress { width: 100%; align-items: flex-start; }
      }

      .dr-banner {
        margin: 0 20px 14px;
        padding: 10px 14px;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .dr-banner.warn {
        background: hsl(var(--warn) / 0.08);
        border: 1px solid hsl(var(--warn) / 0.30);
        color: hsl(var(--warn));
      }
      .dr-banner .dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: currentColor;
      }

      .dr-setup {
        margin: 0 20px;
        background: hsl(var(--bg));
        border: 1px solid hsl(var(--ink));
        padding: 24px;
      }
      @media (max-width: 720px) {
        .dr-setup { margin: 0 16px; padding: 18px; }
      }
      .dr-setup-eye {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: hsl(var(--accent));
        margin-bottom: 10px;
      }
      .dr-setup-body {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: hsl(var(--ink) / 0.72);
        margin: 0 0 22px;
      }
      .dr-setup-body strong { color: hsl(var(--ink)); font-weight: 700; }
      .dr-setup-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 22px;
      }
      .dr-setup-row {
        display: grid;
        grid-template-columns: 28px 1fr auto auto;
        gap: 10px;
        align-items: center;
        padding: 9px 12px;
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink) / 0.10);
      }
      .dr-setup-row .num {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 700;
        color: hsl(var(--ink) / 0.42);
      }
      .dr-setup-row .who {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 700;
        font-size: 14px;
        color: hsl(var(--ink));
        display: flex;
        align-items: baseline;
        gap: 8px;
        flex-wrap: wrap;
      }
      .dr-setup-row .who .handle {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.12em;
        color: hsl(var(--ink) / 0.42);
      }
      .dr-setup-row .winner-pill {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.14em;
        color: hsl(var(--accent));
        background: hsl(var(--accent) / 0.08);
        border: 1px solid hsl(var(--accent) / 0.30);
        padding: 2px 6px;
      }
      .dr-setup-btn {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        background: transparent;
        border: 1px solid hsl(var(--ink) / 0.20);
        color: hsl(var(--ink) / 0.72);
        padding: 5px 10px;
        cursor: pointer;
      }
      .dr-setup-btn:hover {
        border-color: hsl(var(--ink));
        color: hsl(var(--ink));
      }
      .dr-setup-btn:disabled { opacity: 0.5; cursor: wait; }
      .dr-setup-empty {
        padding: 32px 16px;
        text-align: center;
        background: hsl(var(--surface));
        border: 1px dashed hsl(var(--ink) / 0.20);
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 13px;
        color: hsl(var(--ink) / 0.55);
      }
      .dr-setup-start {
        padding-top: 16px;
        border-top: 1px solid hsl(var(--ink) / 0.10);
      }
      .dr-start-btn {
        background: hsl(var(--ink));
        color: hsl(var(--bg));
        border: 1px solid hsl(var(--ink));
        padding: 14px 28px;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        cursor: pointer;
        line-height: 1;
      }
      .dr-start-btn:hover {
        background: hsl(var(--accent));
        border-color: hsl(var(--accent));
      }
      .dr-start-btn:disabled { opacity: 0.5; cursor: wait; }

      .dr-broadcast {
        display: grid;
        grid-template-columns: 240px 1fr 280px;
        border-top: 1px solid hsl(var(--ink));
        border-bottom: 1px solid hsl(var(--ink));
        background: hsl(var(--bg));
      }
      @media (max-width: 1024px) {
        .dr-broadcast {
          grid-template-columns: 1fr;
        }
      }

      .dr-pool {
        border-right: 1px solid hsl(var(--ink) / 0.10);
        display: flex;
        flex-direction: column;
      }
      @media (max-width: 1024px) {
        .dr-pool {
          border-right: none;
          border-bottom: 1px solid hsl(var(--ink) / 0.10);
          order: 2;
        }
      }
      .dr-pool-head {
        padding: 14px 18px 10px;
        border-bottom: 1px solid hsl(var(--ink) / 0.10);
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .dr-pool-head .label {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.55);
      }
      .dr-pool-head .label .strong { color: hsl(var(--ink)); font-weight: 900; }
      .dr-pool-head .num {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 14px;
        color: hsl(var(--accent));
      }
      .dr-pool-grid {
        padding: 10px 12px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
        overflow-y: auto;
      }
      @media (max-width: 1024px) {
        .dr-pool-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }
      @media (max-width: 480px) {
        .dr-pool-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      .dr-pool-card {
        background: hsl(var(--bg));
        border: 1px solid hsl(var(--ink) / 0.20);
        padding: 7px 9px;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: opacity 0.3s ease, background 0.3s ease, border-color 0.3s ease;
      }
      .dr-pool-card.taken {
        opacity: 0.30;
        background: hsl(var(--ink) / 0.04);
      }
      .dr-pool-card.taken .name {
        text-decoration: line-through;
        text-decoration-color: hsl(var(--ink) / 0.30);
      }
      .dr-pool-card.just-drawn {
        animation: dr-flash-fade 1.5s ease-out;
      }
      @keyframes dr-flash-fade {
        0% {
          background: hsl(var(--accent) / 0.20);
          border-color: hsl(var(--accent));
          transform: scale(1.04);
          opacity: 1;
        }
        100% {
          opacity: 0.30;
          background: hsl(var(--ink) / 0.04);
          border-color: hsl(var(--ink) / 0.20);
          transform: scale(1);
        }
      }
      .dr-pool-card .flag {
        font-size: 13px;
        line-height: 1;
        flex-shrink: 0;
      }
      .dr-pool-card .name {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 700;
        font-size: 11px;
        line-height: 1;
        color: hsl(var(--ink));
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .dr-groups {
        display: flex;
        flex-direction: column;
      }
      @media (max-width: 1024px) {
        .dr-groups { order: 3; }
      }
      .dr-groups-head {
        padding: 14px 18px 10px;
        border-bottom: 1px solid hsl(var(--ink) / 0.10);
      }
      .dr-groups-head .label {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.55);
      }
      .dr-groups-head .label .strong { color: hsl(var(--ink)); font-weight: 900; }
      .dr-groups-list {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      @media (max-width: 1024px) {
        .dr-groups-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
      }
      @media (max-width: 480px) {
        .dr-groups-list {
          grid-template-columns: 1fr;
        }
      }
      .dr-group {
        background: hsl(var(--bg));
        border: 1px solid hsl(var(--ink) / 0.20);
        padding: 9px 12px;
        transition: border-color 0.3s ease, background 0.3s ease;
      }
      .dr-group.active {
        border-color: hsl(var(--accent));
        background: hsl(var(--accent) / 0.04);
      }
      .dr-group-label {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.55);
        margin-bottom: 6px;
        display: flex;
        justify-content: space-between;
      }
      .dr-group.active .dr-group-label { color: hsl(var(--accent)); }
      .dr-group-label .filled {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 11px;
        color: hsl(var(--ink) / 0.42);
      }
      .dr-group.active .dr-group-label .filled { color: hsl(var(--accent)); }
      .dr-slot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 0;
        border-bottom: 1px solid hsl(var(--ink) / 0.06);
      }
      .dr-slot:last-child { border-bottom: none; }
      .dr-slot.empty { opacity: 0.45; }
      .dr-slot .left {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 1;
        min-width: 0;
      }
      .dr-slot .flag {
        font-size: 12px;
        line-height: 1;
        flex-shrink: 0;
      }
      .dr-slot .cn {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 700;
        font-size: 11px;
        color: hsl(var(--ink));
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .dr-slot.empty .cn { color: hsl(var(--ink) / 0.42); }
      .dr-slot .h {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.10em;
        text-transform: uppercase;
        color: hsl(var(--accent));
        flex-shrink: 0;
      }
      .dr-slot.empty .h { color: hsl(var(--ink) / 0.30); }
      .dr-slot.just-filled {
        animation: dr-slot-pulse 1.5s ease-out;
      }
      @keyframes dr-slot-pulse {
        0% { background: hsl(var(--accent) / 0.20); }
        100% { background: transparent; }
      }

      .dr-complete-row {
        margin: 20px;
        padding: 20px;
        background: hsl(var(--accent) / 0.06);
        border: 1px solid hsl(var(--accent) / 0.30);
        text-align: center;
      }
      .dr-complete-btn {
        background: hsl(var(--accent));
        color: #fff;
        border: 1px solid hsl(var(--accent));
        padding: 14px 28px;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        cursor: pointer;
        line-height: 1;
      }
      .dr-complete-btn:hover { background: hsl(var(--ink)); border-color: hsl(var(--ink)); }
      .dr-complete-btn:disabled { opacity: 0.5; cursor: wait; }

      .dr-completed {
        padding: 32px 20px;
        text-align: center;
      }
      .dr-completed-eye {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.20em;
        text-transform: uppercase;
        color: hsl(var(--accent));
        margin-bottom: 12px;
      }
      .dr-completed-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 36px;
        line-height: 1;
        letter-spacing: -0.03em;
        margin: 0 0 10px;
      }
      .dr-completed-body {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 14px;
        color: hsl(var(--ink) / 0.62);
        margin: 0 0 20px;
      }
      .dr-completed-link {
        display: inline-block;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: hsl(var(--accent));
        text-decoration: underline;
        text-underline-offset: 4px;
        margin-bottom: 32px;
      }
      .dr-completed-link:hover { color: hsl(var(--ink)); }
      .dr-broadcast-completed {
        grid-template-columns: 1fr;
        text-align: left;
      }
      .dr-groups-full .dr-groups-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 10px;
      }

      .dr-danger {
        margin: 20px;
        padding: 12px 16px;
        background: hsl(var(--warn) / 0.04);
        border: 1px solid hsl(var(--warn) / 0.20);
      }
      .dr-danger details summary {
        cursor: pointer;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: hsl(var(--warn));
        list-style: none;
      }
      .dr-danger details summary::-webkit-details-marker { display: none; }
      .dr-danger details summary::before { content: '⚠ '; }
      .dr-danger-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        align-items: center;
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid hsl(var(--warn) / 0.20);
      }
      .dr-danger-name {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 800;
        font-size: 14px;
        color: hsl(var(--ink));
        margin-bottom: 4px;
      }
      .dr-danger-desc {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 12px;
        color: hsl(var(--ink) / 0.62);
        line-height: 1.4;
      }
      .dr-danger-btn {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        padding: 8px 14px;
        border: 1px solid hsl(var(--warn));
        color: hsl(var(--warn));
        background: transparent;
        cursor: pointer;
        flex-shrink: 0;
      }
      .dr-danger-btn:hover {
        background: hsl(var(--warn));
        color: #fff;
      }
      .dr-danger-btn:disabled { opacity: 0.5; cursor: wait; }
    `}</style>
  );
}
