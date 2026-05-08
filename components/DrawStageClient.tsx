'use client';

import { useEffect, useState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import {
  spinForParticipant,
  acceptDraw,
  pickCandidate,
} from '../app/actions/draw';

type Country = {
  id?: string;
  name: string;
  flag: string;
  groupLabel: string;
};

type Player = {
  initial: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  isQuizWinner: boolean;
};

type Props = {
  slug: string;
  mode: 'ready' | 'revealed' | 'all_drawn' | 'candidate_pick';
  currentPlayer: Player | null;
  participantId: string | null;
  poolSize: number;
  pickNumber: number;
  justDrawnCountry: Country | null;
  rerollsRemaining: number;
  upNextNames: string[];
  candidates: Country[] | null;
};

const SPIN_FLAGS = ['🇧🇷','🇪🇸','🇦🇷','🇩🇪','🇫🇷','🇬🇧','🇲🇦','🇸🇳','🇯🇵','🇰🇷','🇲🇽','🇺🇸','🇮🇹','🇵🇹','🇳🇱','🇧🇪','🇭🇷','🇨🇦'];
const SPIN_NAMES = ['Brazil','Spain','Argentina','Germany','France','England','Morocco','Senegal','Japan','Korea','Mexico','USA','Italy','Portugal','Netherlands','Belgium','Croatia','Canada'];

export default function DrawStageClient({
  slug,
  mode,
  currentPlayer,
  participantId,
  poolSize,
  pickNumber,
  justDrawnCountry,
  rerollsRemaining,
  upNextNames,
  candidates,
}: Props) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinFlag, setSpinFlag] = useState(SPIN_FLAGS[0]);
  const [spinName, setSpinName] = useState(SPIN_NAMES[0]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spinFormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (mode !== 'ready' && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsSpinning(false);
    }
  }, [mode]);

  const startSpinAnimation = () => {
    setIsSpinning(true);
    let i = 0;
    intervalRef.current = setInterval(() => {
      i = (i + 1) % SPIN_FLAGS.length;
      setSpinFlag(SPIN_FLAGS[i]);
      setSpinName(SPIN_NAMES[i]);
    }, 180);
  };

  const handleSpinClick = (_e: React.FormEvent<HTMLFormElement>) => {
    startSpinAnimation();
  };

  return (
    <>
      <style>{`
        .ds-stage {
          background: hsl(var(--bg));
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          position: relative;
          overflow: hidden;
          min-height: 480px;
        }
        @media (min-width: 1024px) {
          .ds-stage {
            border-right: 1px solid hsl(var(--ink) / 0.10);
            border-left: 1px solid hsl(var(--ink) / 0.10);
          }
        }
        .ds-glow {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 80%;
          height: 60%;
          background: radial-gradient(circle, hsl(var(--accent) / 0.08) 0%, hsl(var(--accent) / 0) 70%);
          pointer-events: none;
        }

        .ds-eyebrow {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: hsl(var(--ink) / 0.55);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 22px;
          position: relative;
          z-index: 2;
        }
        .ds-eyebrow.live { color: hsl(var(--live)); }
        .ds-eyebrow.drawn { color: hsl(var(--accent)); }
        .ds-eyebrow .pulse {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: currentColor;
          animation: ds-blink 1.2s ease-in-out infinite;
        }
        @keyframes ds-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .ds-player {
          text-align: center;
          margin-bottom: 22px;
          position: relative;
          z-index: 2;
        }
        .ds-avatar {
          width: 88px; height: 88px;
          background: hsl(var(--ink));
          color: hsl(var(--bg));
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 900;
          font-size: 36px;
          letter-spacing: -0.04em;
          margin-bottom: 14px;
          background-size: cover;
          background-position: center;
        }
        .ds-name {
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 900;
          font-size: 22px;
          line-height: 1;
          letter-spacing: -0.025em;
          margin-bottom: 6px;
          color: hsl(var(--ink));
        }
        .ds-handle {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: hsl(var(--ink) / 0.55);
        }
        .ds-handle .winner {
          color: hsl(var(--accent));
          margin-left: 8px;
          border: 1px solid hsl(var(--accent) / 0.30);
          padding: 2px 6px;
          background: hsl(var(--accent) / 0.08);
          font-size: 9px;
        }

        .ds-country-card {
          background: hsl(var(--bg));
          border: 2px solid hsl(var(--ink));
          padding: 28px 36px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          min-width: 280px;
          margin-bottom: 22px;
          position: relative;
          z-index: 2;
        }
        @media (max-width: 720px) {
          .ds-country-card { min-width: 240px; padding: 22px 28px; }
        }
        .ds-country-card .flag { font-size: 56px; line-height: 1; }
        @media (max-width: 720px) {
          .ds-country-card .flag { font-size: 44px; }
        }
        .ds-country-card .name {
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 900;
          font-size: 32px;
          line-height: 1;
          letter-spacing: -0.035em;
          color: hsl(var(--ink));
          text-align: center;
        }
        @media (max-width: 720px) {
          .ds-country-card .name { font-size: 24px; }
        }
        .ds-country-card .group {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.20em;
          text-transform: uppercase;
          color: hsl(var(--accent));
        }
        .ds-country-card.spinning {
          animation: ds-pulse-border 0.4s ease-in-out infinite alternate;
        }
        @keyframes ds-pulse-border {
          from { border-color: hsl(var(--ink)); }
          to { border-color: hsl(var(--accent)); }
        }
        .ds-country-card.spinning .name {
          animation: ds-flash 0.18s ease-in-out infinite;
        }
        @keyframes ds-flash {
          0% { opacity: 0.3; transform: translateY(2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .ds-country-card.revealed {
          animation: ds-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes ds-bounce {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Quiz-winner candidate cards (3 picks) */
        .ds-candidates {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 16px;
          position: relative;
          z-index: 2;
        }
        .ds-candidate {
          background: hsl(var(--bg));
          border: 2px solid hsl(var(--ink));
          padding: 22px 26px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          min-width: 180px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, transform 0.15s;
          font: inherit;
          color: inherit;
          opacity: 0;
          animation: ds-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .ds-candidate:hover:not(:disabled) {
          border-color: hsl(var(--accent));
          background: hsl(var(--accent) / 0.04);
          transform: translateY(-2px);
        }
        .ds-candidate:disabled {
          cursor: wait;
          opacity: 0.5;
        }
        .ds-candidate .flag { font-size: 40px; line-height: 1; }
        .ds-candidate .name {
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 900;
          font-size: 20px;
          letter-spacing: -0.025em;
          color: hsl(var(--ink));
          text-align: center;
        }
        .ds-candidate .group {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: hsl(var(--ink) / 0.55);
        }
        @media (max-width: 720px) {
          .ds-candidates { flex-direction: column; width: 100%; }
          .ds-candidate { min-width: 0; width: 100%; }
        }

        .ds-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
          position: relative;
          z-index: 2;
        }
        .ds-cta {
          background: hsl(var(--accent));
          color: #fff;
          border: 1px solid hsl(var(--accent));
          padding: 14px 26px;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: pointer;
          line-height: 1;
        }
        .ds-cta:hover { background: hsl(var(--ink)); border-color: hsl(var(--ink)); }
        .ds-cta-ghost {
          background: transparent;
          color: hsl(var(--ink));
          border-color: hsl(var(--ink) / 0.30);
        }
        .ds-cta-ghost:hover {
          border-color: hsl(var(--ink));
          background: hsl(var(--ink) / 0.04);
        }
        .ds-cta:disabled { opacity: 0.5; cursor: wait; }

        .ds-spin-cta {
          background: hsl(var(--ink));
          color: hsl(var(--bg));
          border: 1px solid hsl(var(--ink));
          padding: 18px 40px;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          line-height: 1;
          transition: background 0.15s ease;
        }
        .ds-spin-cta:hover { background: hsl(var(--accent)); border-color: hsl(var(--accent)); }
        .ds-spin-cta:disabled { opacity: 0.5; cursor: wait; background: hsl(var(--ink)); }

        .ds-up-next {
          margin-top: 16px;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: hsl(var(--ink) / 0.42);
          text-align: center;
          position: relative;
          z-index: 2;
        }
        .ds-up-next .name { color: hsl(var(--ink)); font-weight: 900; }
        .ds-pool-hint {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: hsl(var(--ink) / 0.42);
          margin-top: 8px;
          position: relative;
          z-index: 2;
          text-align: center;
        }
      `}</style>

      <div className="ds-stage">
        <div className="ds-glow" />

        {mode === 'ready' && currentPlayer && participantId && (
          <>
            <div className="ds-eyebrow live">
              <span className="pulse" />
              {isSpinning ? 'Spinning…' : `Up next · Pick ${pickNumber}`}
            </div>

            <div className="ds-player">
              <div
                className="ds-avatar"
                style={
                  currentPlayer.avatarUrl
                    ? { backgroundImage: `url(${currentPlayer.avatarUrl})`, color: 'transparent' }
                    : undefined
                }
              >
                {!currentPlayer.avatarUrl && currentPlayer.initial}
              </div>
              <div className="ds-name">{currentPlayer.displayName}</div>
              <div className="ds-handle">
                @{currentPlayer.username.toUpperCase()}
                {currentPlayer.isQuizWinner && (
                  <span className="winner">★ QUIZ WINNER · 3 PICKS</span>
                )}
              </div>
            </div>

            {isSpinning && (
              <div className="ds-country-card spinning">
                <span className="flag">{spinFlag}</span>
                <span className="name">{spinName}</span>
                <span className="group">{currentPlayer.isQuizWinner ? 'Drawing 3…' : 'Revealing…'}</span>
              </div>
            )}

            {!isSpinning && (
              <>
                <form
                  action={spinForParticipant}
                  ref={spinFormRef}
                  onSubmit={handleSpinClick}
                >
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="participant_id" value={participantId} />
                  <SpinButton isQuizWinner={currentPlayer.isQuizWinner} />
                </form>
                <div className="ds-pool-hint">{poolSize} countries left in pool</div>
                {upNextNames.length > 0 && (
                  <div className="ds-up-next">
                    Up after ·{' '}
                    {upNextNames.map((n, i) => (
                      <span key={i}>
                        <span className="name">@{n.toUpperCase()}</span>
                        {i < upNextNames.length - 1 && ' → '}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {mode === 'candidate_pick' && currentPlayer && participantId && candidates && (
          <>
            <div className="ds-eyebrow drawn">
              ★ Quiz winner · Pick one of {candidates.length}
            </div>

            <div className="ds-player">
              <div
                className="ds-avatar"
                style={
                  currentPlayer.avatarUrl
                    ? { backgroundImage: `url(${currentPlayer.avatarUrl})`, color: 'transparent' }
                    : undefined
                }
              >
                {!currentPlayer.avatarUrl && currentPlayer.initial}
              </div>
              <div className="ds-name">{currentPlayer.displayName}</div>
              <div className="ds-handle">@{currentPlayer.username.toUpperCase()}</div>
            </div>

            <div className="ds-candidates">
              {candidates.map((c, i) => (
                <form action={pickCandidate} key={c.id ?? i}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="participant_id" value={participantId} />
                  <input type="hidden" name="country_id" value={c.id ?? ''} />
                  <CandidateButton index={i}>
                    <span className="flag">{c.flag}</span>
                    <span className="name">{c.name}</span>
                    <span className="group">Group {c.groupLabel}</span>
                  </CandidateButton>
                </form>
              ))}
            </div>
            <div className="ds-pool-hint">
              Click a country to claim it · the other {candidates.length - 1} go back to the pool
            </div>
          </>
        )}

        {mode === 'revealed' && currentPlayer && participantId && justDrawnCountry && (
          <>
            <div className="ds-eyebrow drawn">
              ★ Drawn · Group {justDrawnCountry.groupLabel}
            </div>

            <div className="ds-player">
              <div
                className="ds-avatar"
                style={
                  currentPlayer.avatarUrl
                    ? { backgroundImage: `url(${currentPlayer.avatarUrl})`, color: 'transparent' }
                    : undefined
                }
              >
                {!currentPlayer.avatarUrl && currentPlayer.initial}
              </div>
              <div className="ds-name">{currentPlayer.displayName}</div>
              <div className="ds-handle">@{currentPlayer.username.toUpperCase()}</div>
            </div>

            <div className="ds-country-card revealed">
              <span className="flag">{justDrawnCountry.flag}</span>
              <span className="name">{justDrawnCountry.name}</span>
              <span className="group">★ Group {justDrawnCountry.groupLabel}</span>
            </div>

            <div className="ds-actions">
              <form action={acceptDraw}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="participant_id" value={participantId} />
                <AcceptButton />
              </form>
              {currentPlayer.isQuizWinner && rerollsRemaining > 0 && (
                <form action={spinForParticipant}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="participant_id" value={participantId} />
                  <RerollButton remaining={rerollsRemaining} />
                </form>
              )}
            </div>
          </>
        )}

        {mode === 'all_drawn' && (
          <>
            <div className="ds-eyebrow drawn">★ All players drawn</div>
            <div className="ds-player">
              <div className="ds-name" style={{ fontSize: 28, marginBottom: 12 }}>
                Draw complete.
              </div>
              <div className="ds-handle">Confirm to lock the draw and start the tournament.</div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function SpinButton({ isQuizWinner }: { isQuizWinner: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="ds-spin-cta" disabled={pending}>
      {pending ? 'Spinning…' : isQuizWinner ? '↻ Draw 3 countries' : '↻ Spin the wheel'}
    </button>
  );
}

function AcceptButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="ds-cta" disabled={pending}>
      {pending ? 'Confirming…' : 'Accept · next →'}
    </button>
  );
}

function RerollButton({ remaining }: { remaining: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="ds-cta ds-cta-ghost" disabled={pending}>
      {pending ? 'Spinning…' : `↻ Reroll (${remaining} left)`}
    </button>
  );
}

function CandidateButton({ children, index }: { children: React.ReactNode; index: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="ds-candidate"
      style={{ animationDelay: `${index * 500}ms` }}
      disabled={pending}
    >
      {children}
    </button>
  );
}
