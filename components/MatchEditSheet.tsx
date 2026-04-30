'use client';

import { useEffect, useState, useRef } from 'react';
import { overrideMatchScore } from '../app/actions/fixtures';
import { submitKnockoutScore } from '../app/actions/knockout';
import { recordWalkover } from '../app/actions/fixtures';

type Side = {
  id: string;
  country: string;
  handle: string;
  seedLabel?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  matchId: string;
  slug: string;
  isKnockout: boolean;
  contextLabel: string;
  home: Side;
  away: Side;
  initialHomeScore: number | null;
  initialAwayScore: number | null;
  initialHomePens: number | null;
  initialAwayPens: number | null;
  initialDecidedBy: string | null;
};

export default function MatchEditSheet({
  open,
  onClose,
  matchId,
  slug,
  isKnockout,
  contextLabel,
  home,
  away,
  initialHomeScore,
  initialAwayScore,
  initialHomePens,
  initialAwayPens,
  initialDecidedBy,
}: Props) {
  const [homeScore, setHomeScore] = useState<string>(initialHomeScore?.toString() ?? '');
  const [awayScore, setAwayScore] = useState<string>(initialAwayScore?.toString() ?? '');
  const [wentToET, setWentToET] = useState<boolean>(initialDecidedBy === 'extra_time' || initialDecidedBy === 'penalties');
  const [wentToPens, setWentToPens] = useState<boolean>(initialDecidedBy === 'penalties');
  const [homePens, setHomePens] = useState<string>(initialHomePens?.toString() ?? '');
  const [awayPens, setAwayPens] = useState<string>(initialAwayPens?.toString() ?? '');
  const [walkover, setWalkover] = useState<boolean>(initialDecidedBy === 'walkover');
  const [walkoverWinner, setWalkoverWinner] = useState<'home' | 'away' | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const winnerCountry = walkoverWinner === 'home' ? home.country : walkoverWinner === 'away' ? away.country : '—';

  const formAction = walkover
    ? recordWalkover
    : isKnockout
    ? submitKnockoutScore
    : overrideMatchScore;

  return (
    <>
      <style>{`
        .mes-backdrop {
          position: fixed; inset: 0; z-index: 100;
          background: hsl(var(--ink) / 0.55);
          animation: mes-fade 0.2s ease-out;
        }
        @keyframes mes-fade { from { opacity: 0; } to { opacity: 1; } }

        .mes-sheet {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 101;
          background: hsl(var(--bg));
          border-top: 1px solid hsl(var(--ink));
          max-height: 92vh;
          display: flex; flex-direction: column;
          animation: mes-slide 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes mes-slide {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        @media (min-width: 720px) {
          .mes-sheet {
            left: 50%; transform: translateX(-50%);
            max-width: 480px;
            border-left: 1px solid hsl(var(--ink));
            border-right: 1px solid hsl(var(--ink));
          }
          @keyframes mes-slide {
            from { transform: translate(-50%, 100%); }
            to { transform: translate(-50%, 0); }
          }
        }

        .mes-handle {
          padding: 10px 0 4px;
          display: flex; justify-content: center;
          flex-shrink: 0;
        }
        .mes-handle .grip {
          width: 36px; height: 3px;
          background: hsl(var(--ink) / 0.20);
        }
        .mes-head {
          padding: 0 18px 14px;
          border-bottom: 1px solid hsl(var(--ink) / 0.08);
          display: flex; align-items: baseline; justify-content: space-between;
          flex-shrink: 0;
        }
        .mes-head .ctx {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: hsl(var(--ink) / 0.42);
        }
        .mes-head .ctx .strong { color: hsl(var(--ink)); }
        .mes-head .close {
          background: transparent; border: none;
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 900; font-size: 18px; line-height: 1;
          color: hsl(var(--ink) / 0.42); cursor: pointer;
          padding: 4px 8px;
        }
        .mes-head .close:hover { color: hsl(var(--ink)); }

        .mes-body {
          padding: 18px;
          overflow-y: auto;
          flex: 1;
        }
        .mes-title {
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 900; font-size: 22px;
          line-height: 0.95; letter-spacing: -0.025em;
          color: hsl(var(--ink));
          margin: 0 0 14px;
        }
        .mes-title .accent { color: hsl(var(--warn)); font-style: italic; }

        .mes-score-row {
          display: grid; grid-template-columns: 1fr auto 1fr;
          gap: 12px; align-items: center;
          margin-bottom: 12px;
        }
        .mes-side {
          background: hsl(var(--surface));
          border: 1px solid hsl(var(--ink) / 0.20);
          padding: 12px;
          display: flex; flex-direction: column; gap: 6px;
          align-items: center;
        }
        .mes-side .country {
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 800; font-size: 14px;
          letter-spacing: -0.01em; line-height: 1;
          text-align: center; color: hsl(var(--ink));
        }
        .mes-side .handle {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 8px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: hsl(var(--ink) / 0.42);
          text-align: center;
        }
        .mes-side input {
          width: 64px; height: 56px;
          background: hsl(var(--bg));
          border: 2px solid hsl(var(--ink));
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 900; font-size: 32px;
          text-align: center; color: hsl(var(--ink));
          font-variant-numeric: tabular-nums;
          outline: none; line-height: 1;
        }
        .mes-side input:focus { border-color: hsl(var(--accent)); }
        .mes-dash {
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 900; font-size: 24px;
          color: hsl(var(--ink) / 0.42);
          padding-top: 36px;
        }

        .mes-toggle-row {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px;
          border: 1px solid hsl(var(--ink) / 0.20);
          background: hsl(var(--surface));
          margin-bottom: 8px;
          cursor: pointer;
          width: 100%;
          text-align: left;
        }
        .mes-toggle-row.on {
          border-color: hsl(var(--accent));
          background: hsl(var(--accent) / 0.08);
        }
        .mes-toggle-row.on.warn {
          border-color: hsl(var(--warn));
          background: hsl(var(--warn) / 0.10);
        }
        .mes-toggle-row .check {
          width: 18px; height: 18px;
          border: 2px solid hsl(var(--ink));
          background: hsl(var(--bg));
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .mes-toggle-row.on .check {
          background: hsl(var(--ink));
        }
        .mes-toggle-row.on.warn .check {
          background: hsl(var(--warn));
          border-color: hsl(var(--warn));
        }
        .mes-toggle-row.on .check::after {
          content: '✓';
          color: hsl(var(--bg)); font-size: 12px; font-weight: 900;
          line-height: 1;
        }
        .mes-toggle-row .label {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.10em; text-transform: uppercase;
          color: hsl(var(--ink));
        }
        .mes-toggle-row .label .sub {
          display: block; margin-top: 2px;
          font-weight: 500; letter-spacing: 0.06em;
          color: hsl(var(--ink) / 0.42);
          text-transform: none; font-size: 10px;
        }

        .mes-pens {
          border: 1px dashed hsl(var(--ink) / 0.20);
          padding: 12px;
          margin-bottom: 12px;
        }
        .mes-pens .head {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: hsl(var(--ink) / 0.42);
          margin-bottom: 8px;
        }
        .mes-pens .row {
          display: grid; grid-template-columns: 1fr auto 1fr;
          gap: 10px; align-items: center;
        }
        .mes-pens input {
          width: 100%; height: 38px;
          background: hsl(var(--bg));
          border: 1px solid hsl(var(--ink) / 0.20);
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 800; font-size: 18px;
          text-align: center; color: hsl(var(--ink));
          outline: none;
        }
        .mes-pens input:focus { border-color: hsl(var(--accent)); }
        .mes-pens .dash {
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 700; font-size: 14px;
          color: hsl(var(--ink) / 0.42);
          text-align: center;
        }

        .mes-walkover {
          margin-bottom: 12px;
        }
        .mes-walkover .head {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: hsl(var(--warn));
          margin-bottom: 8px;
        }
        .mes-walkover .opts {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .mes-walkover .opt {
          background: hsl(var(--surface));
          border: 1px solid hsl(var(--ink) / 0.20);
          padding: 16px 10px;
          text-align: center;
          display: flex; flex-direction: column; gap: 4px;
          cursor: pointer;
          font-family: inherit;
        }
        .mes-walkover .opt.selected {
          background: hsl(var(--ink));
          color: hsl(var(--bg));
          border-color: hsl(var(--ink));
        }
        .mes-walkover .opt .country {
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 800; font-size: 16px;
          letter-spacing: -0.015em;
        }
        .mes-walkover .opt .label {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          opacity: 0.6;
        }
        .mes-walkover .opt.selected .label { opacity: 0.7; }
        .mes-walkover .scoreline {
          margin-top: 10px;
          text-align: center;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: hsl(var(--ink) / 0.42);
        }
        .mes-walkover .scoreline .score {
          color: hsl(var(--warn));
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 900; font-size: 14px;
          letter-spacing: -0.02em; margin: 0 4px;
        }

        .mes-foot {
          display: grid; grid-template-columns: auto 1fr;
          gap: 8px;
          padding: 14px 18px;
          border-top: 1px solid hsl(var(--ink) / 0.08);
          background: hsl(var(--bg));
          flex-shrink: 0;
        }
        .mes-cancel {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          background: transparent;
          border: 1px solid hsl(var(--ink) / 0.20);
          color: hsl(var(--ink) / 0.62);
          padding: 12px 18px;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .mes-cancel:hover {
          color: hsl(var(--ink));
          border-color: hsl(var(--ink));
        }
        .mes-save {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          background: hsl(var(--ink));
          color: hsl(var(--bg));
          border: 1px solid hsl(var(--ink));
          padding: 12px;
          cursor: pointer;
        }
        .mes-save:hover { background: hsl(var(--accent)); border-color: hsl(var(--accent)); }
        .mes-save.warn {
          background: hsl(var(--warn));
          border-color: hsl(var(--warn));
        }
        .mes-save.warn:hover {
          background: hsl(var(--ink));
          border-color: hsl(var(--ink));
        }
        .mes-save:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>

      <div className="mes-backdrop" onClick={onClose} />

      <div className="mes-sheet" ref={sheetRef}>
        <div className="mes-handle"><div className="grip" /></div>
        <div className="mes-head">
          <span className="ctx">
            <span className="strong">{contextLabel}</span>
          </span>
          <button type="button" className="close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form action={formAction} className="mes-body" id="match-edit-form">
          <input type="hidden" name="match_id" value={matchId} />
          <input type="hidden" name="slug" value={slug} />
          {walkover && <input type="hidden" name="winner_side" value={walkoverWinner ?? ''} />}
          {walkover && <input type="hidden" name="is_knockout" value={isKnockout ? '1' : '0'} />}

          {!walkover && (
            <>
              <h2 className="mes-title">Edit result.</h2>

              <div className="mes-score-row">
                <div className="mes-side">
                  <span className="country">{home.country}</span>
                  <span className="handle">{home.seedLabel ? `${home.seedLabel} · ` : ''}{home.handle}</span>
                  <input
                    type="number"
                    name="home_score"
                    min={0}
                    max={50}
                    required
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                  />
                </div>
                <div className="mes-dash">—</div>
                <div className="mes-side">
                  <span className="country">{away.country}</span>
                  <span className="handle">{away.seedLabel ? `${away.seedLabel} · ` : ''}{away.handle}</span>
                  <input
                    type="number"
                    name="away_score"
                    min={0}
                    max={50}
                    required
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                  />
                </div>
              </div>

              {isKnockout && (
                <>
                  <button
                    type="button"
                    className={`mes-toggle-row ${wentToET ? 'on' : ''}`}
                    onClick={() => setWentToET(!wentToET)}
                  >
                    <input type="hidden" name="went_to_et" value={wentToET ? 'on' : ''} />
                    <div className="check" />
                    <div className="label">Match went to extra time</div>
                  </button>

                  <button
                    type="button"
                    className={`mes-toggle-row ${wentToPens ? 'on' : ''}`}
                    onClick={() => {
                      const next = !wentToPens;
                      setWentToPens(next);
                      if (next) setWentToET(true);
                    }}
                  >
                    <input type="hidden" name="went_to_pens" value={wentToPens ? 'on' : ''} />
                    <div className="check" />
                    <div className="label">Decided by penalties</div>
                  </button>

                  {wentToPens && (
                    <div className="mes-pens">
                      <div className="head">PENALTY SHOOTOUT</div>
                      <div className="row">
                        <input
                          type="number"
                          name="home_pens"
                          min={0}
                          max={20}
                          value={homePens}
                          onChange={(e) => setHomePens(e.target.value)}
                          required
                        />
                        <span className="dash">—</span>
                        <input
                          type="number"
                          name="away_pens"
                          min={0}
                          max={20}
                          value={awayPens}
                          onChange={(e) => setAwayPens(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {walkover && (
            <>
              <h2 className="mes-title">Record <span className="accent">walkover.</span></h2>

              <div className="mes-walkover">
                <div className="head">⚠ WHO ADVANCES?</div>
                <div className="opts">
                  <button
                    type="button"
                    className={`opt ${walkoverWinner === 'home' ? 'selected' : ''}`}
                    onClick={() => setWalkoverWinner('home')}
                  >
                    <span className="country">{home.country}</span>
                    <span className="label">{home.handle}</span>
                  </button>
                  <button
                    type="button"
                    className={`opt ${walkoverWinner === 'away' ? 'selected' : ''}`}
                    onClick={() => setWalkoverWinner('away')}
                  >
                    <span className="country">{away.country}</span>
                    <span className="label">{away.handle}</span>
                  </button>
                </div>
                {walkoverWinner && (
                  <div className="scoreline">
                    FINAL: <span className="score">3 — 0</span> TO {winnerCountry.toUpperCase()}
                  </div>
                )}
              </div>
            </>
          )}

          <button
            type="button"
            className={`mes-toggle-row ${walkover ? 'on warn' : ''}`}
            onClick={() => {
              setWalkover(!walkover);
              if (walkover) setWalkoverWinner(null);
            }}
            style={{ marginTop: walkover ? 8 : 0 }}
          >
            <div className="check" />
            <div className="label">
              Mark as walkover
              <span className="sub">
                {walkover
                  ? 'Match did not happen · winner advances 3-0'
                  : 'Auto-records 3-0 to the winner'}
              </span>
            </div>
          </button>
        </form>

        <div className="mes-foot">
          <button type="button" className="mes-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="match-edit-form"
            className={`mes-save ${walkover ? 'warn' : ''}`}
            disabled={walkover && !walkoverWinner}
          >
            {walkover ? 'Confirm walkover →' : 'Save result →'}
          </button>
        </div>
      </div>
    </>
  );
}
