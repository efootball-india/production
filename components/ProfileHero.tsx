// PASS-15-PROFILE-HERO
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

export default function ProfileHero({ displayName, username, avatarUrl, wins, draws, losses }: Props) {
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
    <section style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          overflow: 'hidden',
          borderBottomLeftRadius: '50% 30%',
          borderBottomRightRadius: '50% 30%',
          transform: `translateY(${-parallax}px)`,
          willChange: 'transform',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: photoBg,
            opacity: imageOpacity,
            willChange: 'opacity',
          }}
        >
          {!avatarUrl && (
            <svg
              viewBox="0 0 200 200"
              preserveAspectRatio="xMidYMid slice"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                opacity: 0.5,
              }}
              aria-hidden="true"
            >
              <ellipse
                cx="100"
                cy="76"
                rx="24"
                ry="28"
                fill="none"
                stroke="rgba(0,255,136,0.35)"
                strokeWidth="1.5"
              />
              <path
                d="M 44 200 Q 44 128 100 128 Q 156 128 156 200 Z"
                fill="none"
                stroke="rgba(0,255,136,0.35)"
                strokeWidth="1.5"
              />
            </svg>
          )}
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.45) 75%, rgba(0,0,0,0.85) 100%)',
            opacity: imageOpacity,
            pointerEvents: 'none',
          }}
        />

        {!avatarUrl && (
          <Link
            href="/profile/edit"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              fontSize: 11,
              color: 'var(--accent)',
              background: 'rgba(0, 255, 136, 0.12)',
              border: '1px solid rgba(0, 255, 136, 0.4)',
              padding: '6px 12px',
              borderRadius: 4,
              letterSpacing: '0.12em',
              textDecoration: 'none',
              fontWeight: 700,
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              opacity: textOpacity,
            }}
          >
            + ADD PHOTO
          </Link>
        )}

        <div
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            bottom: 28,
            textAlign: 'center',
            opacity: textOpacity,
            willChange: 'opacity',
          }}
        >
          <h1
            style={{
              fontSize: 'clamp(22px, 6vw, 36px)',
              color: 'var(--accent)',
              fontWeight: 900,
              letterSpacing: '0.01em',
              lineHeight: 1.05,
              margin: 0,
              textShadow: '0 1px 10px rgba(0,0,0,0.6)',
              wordBreak: 'break-word',
            }}
          >
            {nameToShow}
          </h1>
          <div
            style={{
              marginTop: 10,
              fontSize: 'clamp(13px, 3.4vw, 18px)',
              color: 'var(--text)',
              fontWeight: 800,
              letterSpacing: '0.14em',
              fontVariantNumeric: 'tabular-nums',
              textShadow: '0 1px 8px rgba(0,0,0,0.6)',
            }}
          >
            {wins}W &nbsp;·&nbsp; {draws}D &nbsp;·&nbsp; {losses}L
          </div>
        </div>
      </div>
    </section>
  );
}
