'use client';

import Link from 'next/link';
import { useRef } from 'react';
import type { FixtureEntry } from '@/lib/homepage-fixtures';

type Props = {
  fixtures: FixtureEntry[];
  liveCount: number;
};

export default function FixtureTicker({ fixtures, liveCount }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (fixtures.length === 0) {
    return (
      <>
        <style>{`
          .ft-empty-band {
            background: hsl(var(--bg));
            border-bottom: 1px solid hsl(var(--ink));
          }
          .ft-empty-eye {
            padding: 16px 20px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 1px solid hsl(var(--ink) / 0.10);
          }
          .ft-empty-eye .label {
            font-family: var(--font-mono), ui-monospace, monospace;
            font-size: 11px; font-weight: 700;
            letter-spacing: 0.18em; text-transform: uppercase;
            color: hsl(var(--ink) / 0.62);
          }
          .ft-empty-eye .label .strong { color: hsl(var(--ink)); font-weight: 900; }
          .ft-empty-body {
            padding: 28px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            text-align: center;
          }
          .ft-empty-body .msg {
            font-family: var(--font-sans), system-ui, sans-serif;
            font-weight: 700;
            font-size: 16px;
            color: hsl(var(--ink));
            letter-spacing: -0.01em;
          }
          .ft-empty-body .link {
            font-family: var(--font-mono), ui-monospace, monospace;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: hsl(var(--accent));
            text-decoration: none;
            border-bottom: 1px solid hsl(var(--accent) / 0.30);
            padding-bottom: 2px;
          }
          .ft-empty-body .link:hover {
            color: hsl(var(--ink));
            border-color: hsl(var(--ink));
          }
        `}</style>
        <div className="ft-empty-band">
          <div className="ft-empty-eye">
            <span className="label">
              <span className="strong">LIVE & UPCOMING</span>
            </span>
          </div>
          <div className="ft-empty-body">
            <span className="msg">No matches in progress.</span>
            <Link href="/tournaments" className="link">See open tournaments →</Link>
          </div>
        </div>
      </>
    );
  }

  // Duplicate for seamless loop on desktop only
  const displayFixtures = fixtures.length >= 4 ? [...fixtures, ...fixtures] : fixtures;

  const handleNav = (direction: 'left' | 'right') => {
    const track = trackRef.current;
    if (!track) return;
    const cardWidth = 290;
    track.scrollBy({ left: direction === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' });
  };

  return (
    <>
      <style>{`
        .ft-band {
          background: hsl(var(--bg));
          border-bottom: 1px solid hsl(var(--ink));
        }
        .ft-eye {
          padding: 16px 20px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid hsl(var(--ink) / 0.10);
          gap: 12px;
        }
        .ft-eye .label {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: hsl(var(--ink) / 0.62);
          display: flex; align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .ft-eye .label .live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: hsl(var(--live));
          animation: ft-blink 1.2s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes ft-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .ft-eye .label .strong { color: hsl(var(--ink)); font-weight: 900; }
        .ft-nav { display: flex; gap: 4px; flex-shrink: 0; }
        .ft-nav button {
          width: 28px; height: 28px;
          border: 1px solid hsl(var(--ink) / 0.20);
          background: transparent;
          color: hsl(var(--ink) / 0.62);
          font-size: 14px;
          cursor: pointer;
          line-height: 1;
        }
        .ft-nav button:hover {
          color: hsl(var(--ink));
          border-color: hsl(var(--ink));
        }
        .ft-swipe-hint {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: hsl(var(--ink) / 0.42);
          display: none;
          flex-shrink: 0;
        }
        @media (max-width: 720px) {
          .ft-nav { display: none; }
          .ft-swipe-hint { display: inline; }
        }

        .ft-track {
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x mandatory;
        }
        .ft-track::-webkit-scrollbar { display: none; }

        .ft-track-inner {
          display: flex;
        }

        @media (min-width: 721px) {
          .ft-track {
            scroll-snap-type: none;
            overflow: hidden;
          }
          .ft-track-inner {
            width: max-content;
            animation: ft-scroll 60s linear infinite;
          }
          .ft-track-inner:hover { animation-play-state: paused; }
          @keyframes ft-scroll {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
        }

        .ft-fixture {
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: hsl(var(--bg));
          border-right: 1px solid hsl(var(--ink) / 0.10);
          padding: 14px 18px 16px;
          min-width: 290px;
          width: 290px;
          flex-shrink: 0;
          text-decoration: none;
          color: inherit;
          position: relative;
          scroll-snap-align: start;
          transition: background 0.15s ease;
        }
        .ft-fixture:hover {
          background: hsl(var(--ink) / 0.04);
        }
        @media (max-width: 720px) {
          .ft-fixture {
            min-width: 240px;
            width: 240px;
            padding: 12px 14px 14px;
          }
        }

        .ft-status {
          position: absolute;
          top: 14px; right: 18px;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          line-height: 1;
        }
        @media (max-width: 720px) {
          .ft-status { top: 12px; right: 14px; font-size: 8px; }
        }
        .ft-status.live {
          color: hsl(var(--live));
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .ft-status.live .dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: hsl(var(--live));
          animation: ft-blink 1.2s ease-in-out infinite;
        }
        .ft-status.upcoming { color: hsl(var(--ink) / 0.55); }
        .ft-status.played { color: hsl(var(--ink) / 0.45); }

        .ft-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-right: 60px;
        }
        @media (max-width: 720px) {
          .ft-row { padding-right: 50px; }
        }
        .ft-team {
          display: flex;
          align-items: center;
          gap: 9px;
          flex: 1;
          min-width: 0;
        }
        .ft-flag {
          font-size: 18px;
          line-height: 1;
          flex-shrink: 0;
        }
        .ft-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .ft-country {
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 800;
          font-size: 13px;
          color: hsl(var(--ink));
          line-height: 1;
          letter-spacing: -0.005em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ft-handle {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 9px;
          font-weight: 600;
          color: hsl(var(--ink) / 0.55);
          letter-spacing: 0.06em;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-transform: uppercase;
        }
        .ft-score {
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 900;
          font-size: 20px;
          color: hsl(var(--accent));
          font-variant-numeric: tabular-nums;
          line-height: 1;
          flex-shrink: 0;
          min-width: 16px;
          text-align: center;
        }
        .ft-score.muted {
          color: hsl(var(--ink) / 0.30);
          font-size: 16px;
        }
        .ft-score.lost {
          color: hsl(var(--ink) / 0.42);
        }

        .ft-foot {
          margin-top: 4px;
          padding-top: 8px;
          border-top: 1px solid hsl(var(--ink) / 0.08);
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: hsl(var(--ink) / 0.55);
        }
        @media (max-width: 720px) {
          .ft-foot { font-size: 8px; }
        }
        .ft-foot .name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
        }
        .ft-foot .group {
          flex-shrink: 0;
          color: hsl(var(--accent));
        }
      `}</style>

      <div className="ft-band">
        <div className="ft-eye">
          <span className="label">
            {liveCount > 0 && <span className="live-dot" />}
            <span className="strong">LIVE & UPCOMING</span>
          </span>
          <div className="ft-nav">
            <button type="button" onClick={() => handleNav('left')} aria-label="Scroll left">‹</button>
            <button type="button" onClick={() => handleNav('right')} aria-label="Scroll right">›</button>
          </div>
          <span className="ft-swipe-hint">SWIPE →</span>
        </div>

        <div className="ft-track" ref={trackRef}>
          <div className="ft-track-inner">
            {displayFixtures.map((f, i) => {
              const homeWon = f.isWinnerHome === true;
              const awayWon = f.isWinnerHome === false;
              const isPlayed = f.status === 'played';
              const homeScoreClass = isPlayed
                ? homeWon ? '' : awayWon ? 'lost' : ''
                : f.home.score == null ? 'muted' : '';
              const awayScoreClass = isPlayed
                ? awayWon ? '' : homeWon ? 'lost' : ''
                : f.away.score == null ? 'muted' : '';
              const homeScoreText = f.home.score == null ? '—' : String(f.home.score);
              const awayScoreText = f.away.score == null ? '—' : String(f.away.score);

              return (
                <Link
                  key={`${f.id}-${i}`}
                  href={`/tournaments/${f.tournamentSlug}`}
                  className="ft-fixture"
                >
                  <span className={`ft-status ${f.status}`}>
                    {f.status === 'live' && <span className="dot" />}
                    {f.statusLabel}
                  </span>

                  <div className="ft-row">
                    <div className="ft-team">
                      <span className="ft-flag">{f.home.countryFlag}</span>
                      <div className="ft-info">
                        <span className="ft-country">{f.home.country.toUpperCase()}</span>
                        <span className="ft-handle">@{f.home.username}</span>
                      </div>
                    </div>
                    <span className={`ft-score ${homeScoreClass}`}>{homeScoreText}</span>
                  </div>

                  <div className="ft-row">
                    <div className="ft-team">
                      <span className="ft-flag">{f.away.countryFlag}</span>
                      <div className="ft-info">
                        <span className="ft-country">{f.away.country.toUpperCase()}</span>
                        <span className="ft-handle">@{f.away.username}</span>
                      </div>
                    </div>
                    <span className={`ft-score ${awayScoreClass}`}>{awayScoreText}</span>
                  </div>

                  <div className="ft-foot">
                    <span className="name">
                      {f.tournamentName.toUpperCase()}
                      {f.stageLabel ? ` · ${f.stageLabel}` : ''}
                    </span>
                    {f.groupLabel && <span className="group">{f.groupLabel}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
