'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Tier = 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'unranked';

type Props = {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  wins: number;
  draws: number;
  losses: number;
  rank?: number | null;
  tier?: Tier | null;
  points?: number | null;
  seasonLabel?: string | null;
};

export default function ProfileHero({
  displayName,
  username,
  avatarUrl,
  wins,
  draws,
  losses,
  rank,
  tier,
  points,
  seasonLabel,
}: Props) {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);
  const parallax = scrollY * 0.4;
  const imageOpacity = Math.max(0, 1 - scrollY / 350);
  const textOpacity = Math.max(0, 1 - scrollY / 240);
  const nameToShow = (displayName || username || '').toUpperCase();
  const photoBg = avatarUrl
    ? `url(${avatarUrl}) center/cover no-repeat`
    : 'linear-gradient(180deg, #2a3a35 0%, #1c2a26 35%, #11201b 65%, #08130f 100%)';

  const showRank = tier !== null && tier !== undefined;
  const isUnranked = tier === 'unranked' || (points ?? 0) < 100;

  return (
    <section style={{ position: 'relative', width: '100%' }}>
      <style>{`
        .ph-wrap { position: relative; width: 100%; }
        .ph-frame {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          border-bottom-left-radius: 50% 30%;
          border-bottom-right-radius: 50% 30%;
          will-change: transform;
        }
        .ph-photo { position: absolute; inset: 0; will-change: opacity; }
        .ph-text { text-align: center; padding: 20px 20px 32px; will-change: opacity; }
        .ph-name {
          color: hsl(var(--ink));
          font-weight: 900;
          letter-spacing: -0.01em;
          line-height: 1;
          margin: 0;
          word-break: break-word;
          font-size: clamp(28px, 7vw, 44px);
        }
        .ph-record {
          margin-top: 8px;
          color: hsl(var(--accent));
          font-weight: 900;
          letter-spacing: 0.01em;
          font-variant-numeric: tabular-nums;
          font-size: clamp(20px, 5.2vw, 32px);
        }

        .ph-rank-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 14px;
          padding: 8px 14px;
          text-decoration: none;
          color: inherit;
          border: 1px solid hsl(var(--ink) / 0.20);
          background: hsl(var(--surface));
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .ph-rank-link:hover {
          border-color: hsl(var(--ink));
          background: hsl(var(--ink) / 0.04);
        }
        .ph-rank-pill {
          display: inline-block;
          padding: 3px 8px;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          line-height: 1.4;
          text-transform: uppercase;
        }
        .ph-rank-pill.tier-diamond { background: #C7A4DD; color: #3C2A4D; }
        .ph-rank-pill.tier-platinum { background: #B5D4F4; color: #042C53; }
        .ph-rank-pill.tier-gold { background: #FAC775; color: #633806; }
        .ph-rank-pill.tier-silver { background: #D3D1C7; color: #2C2C2A; }
        .ph-rank-pill.tier-bronze { background: #F5C4B3; color: #4A1B0C; }
        .ph-rank-pill.tier-unranked {
          background: transparent;
          color: hsl(var(--ink) / 0.42);
          border: 1px solid hsl(var(--ink) / 0.20);
        }
        .ph-rank-num {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.10em;
          color: hsl(var(--ink));
          text-transform: uppercase;
        }
        .ph-rank-pts {
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 900;
          font-size: 14px;
          color: hsl(var(--accent));
          font-variant-numeric: tabular-nums;
        }
        .ph-season {
          margin-top: 6px;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: hsl(var(--ink) / 0.42);
        }

        @media (min-width: 768px) {
          .ph-wrap { max-width: 480px; margin: 0 auto; padding-top: 24px; }
          .ph-name { font-size: 44px; }
          .ph-record { font-size: 32px; }
        }
      `}</style>
      <div className="ph-wrap">
        <div className="ph-frame" style={{ transform: `translateY(${-parallax}px)` }}>
          <div className="ph-photo" style={{ background: photoBg, opacity: imageOpacity }}>
            {!avatarUrl && (
              <svg
                viewBox="0 0 200 200"
                preserveAspectRatio="xMidYMid slice"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5 }}
                aria-hidden="true"
              >
                <ellipse cx="100" cy="76" rx="24" ry="28" fill="none" stroke="hsl(var(--accent) / 0.35)" strokeWidth="1.5" />
                <path d="M 44 200 Q 44 128 100 128 Q 156 128 156 200 Z" fill="none" stroke="hsl(var(--accent) / 0.35)" strokeWidth="1.5" />
              </svg>
            )}
          </div>
          {!avatarUrl && (
            <Link
              href="/profile/edit"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                fontSize: 11,
                color: 'hsl(var(--accent))',
                background: 'hsl(var(--accent) / 0.12)',
                border: '1px solid hsl(var(--accent) / 0.4)',
                padding: '6px 12px',
                letterSpacing: '0.12em',
                textDecoration: 'none',
                fontWeight: 700,
                opacity: textOpacity,
              }}
            >
              + ADD PHOTO
            </Link>
          )}
        </div>
        <div className="ph-text" style={{ opacity: textOpacity }}>
          <h1 className="ph-name">{nameToShow}</h1>
          <div className="ph-record">
            {wins}W &nbsp;&nbsp;{draws}D &nbsp;&nbsp;{losses}L
          </div>

          {showRank && (
            <Link href="/players" className="ph-rank-link">
              <span className={`ph-rank-pill tier-${tier}`}>
                {(tier ?? 'unranked').toUpperCase()}
              </span>
              {!isUnranked && rank != null && (
                <span className="ph-rank-num">RANK #{rank}</span>
              )}
              {!isUnranked && points != null && (
                <span className="ph-rank-pts">{points}</span>
              )}
              {isUnranked && (
                <span className="ph-rank-num">SEE LEADERBOARD →</span>
              )}
            </Link>
          )}

          {showRank && seasonLabel && (
            <div className="ph-season">SEASON {seasonLabel}</div>
          )}
        </div>
      </div>
    </section>
  );
}
