'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Props = {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  wins: number;
  draws: number;
  losses: number;
};

export default function ProfileHero({
  displayName,
  username,
  avatarUrl,
  wins,
  draws,
  losses,
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
        </div>
      </div>
    </section>
  );
}
