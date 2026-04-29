// PASS-10-PROFILE-HERO
'use client';

import { useEffect, useState } from 'react';

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

  const imageOffset = scrollY * 0.4;
  const imageOpacity = Math.max(0, 1 - scrollY / 350);
  const textOpacity = Math.max(0, 1 - scrollY / 240);

  const initial = (displayName || username || '?').charAt(0).toUpperCase();
  const nameToShow = displayName || username;

  return (
    <section style={{
      position: 'relative',
      paddingTop: 28,
      paddingBottom: 40,
      overflow: 'hidden',
      minHeight: 380,
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        transform: `translateY(${-imageOffset}px)`,
        opacity: imageOpacity,
        willChange: 'transform, opacity',
      }}>
        <div style={{
          width: 'min(60vw, 240px)',
          aspectRatio: '1',
          borderRadius: '50%',
          background: avatarUrl
            ? `url(${avatarUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg, rgba(0,255,136,0.18), rgba(0,255,136,0.04))',
          border: '2px solid rgba(0,255,136,0.35)',
          boxShadow: '0 0 60px rgba(0,255,136,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {!avatarUrl && (
            <span style={{
              fontSize: 'clamp(64px, 18vw, 96px)',
              color: 'var(--accent)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}>
              {initial}
            </span>
          )}
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        marginTop: 20,
        opacity: textOpacity,
        willChange: 'opacity',
      }}>
        <h1 style={{
          fontSize: 'clamp(28px, 6.5vw, 44px)',
          fontWeight: 800,
          letterSpacing: '0.01em',
          color: 'var(--accent)',
          textTransform: 'uppercase',
          margin: 0,
          lineHeight: 1.1,
        }}>
          {nameToShow}
        </h1>
        <div style={{
          marginTop: 10,
          fontSize: 'clamp(15px, 3.2vw, 20px)',
          color: 'var(--text)',
          fontWeight: 700,
          letterSpacing: '0.16em',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {wins}W · {draws}D · {losses}L
        </div>
      </div>
    </section>
  );
}
