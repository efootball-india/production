// PASS-16-BOTTOM-NAV
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Props = {
  activeSlug: string | null;
};

export default function BottomNav({ activeSlug }: Props) {
  const pathname = usePathname() ?? '/';

  const playHref = activeSlug ? `/play/${activeSlug}` : '/tournaments';
  const bracketHref = activeSlug ? `/tournaments/${activeSlug}/bracket` : '/tournaments';

  const isHome = pathname === '/';
  const isBracket = pathname.includes('/bracket');
  const isTourneys =
    !isBracket &&
    (pathname.startsWith('/tournaments') || pathname.startsWith('/admin/tournaments'));
  const isProfile = pathname.startsWith('/profile');

  const ACTIVE = '#00ff88';
  const INACTIVE = 'rgba(255,255,255,0.5)';

  return (
    <>
      <style>{`
        .bn-wrap { display: none; }
        @media (max-width: 720px) {
          .bn-wrap { display: block; }
          body { padding-bottom: 70px; }
        }
        .bn {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: rgba(5, 10, 8, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding: 8px 0 max(10px, env(safe-area-inset-bottom));
        }
        .bn-inner {
          display: grid;
          grid-template-columns: 1fr 1fr 70px 1fr 1fr;
          align-items: end;
          max-width: 600px;
          margin: 0 auto;
        }
        .bn-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 6px 0;
          font-size: 10px;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .bn-play {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          text-decoration: none;
        }
        .bn-play-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #00ff88;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: -24px;
          box-shadow: 0 0 18px rgba(0, 255, 136, 0.45);
          transition: transform 0.15s ease;
        }
        .bn-play:active .bn-play-circle { transform: scale(0.94); }
        .bn-play-label {
          font-size: 10px;
          color: #00ff88;
          font-weight: 500;
        }
      `}</style>

      <nav className="bn-wrap" aria-label="Primary navigation">
        <div className="bn">
          <div className="bn-inner">
            <Link href="/" className="bn-tab" style={{ color: isHome ? ACTIVE : INACTIVE }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12l9-9 9 9" />
                <path d="M5 10v10h14V10" />
              </svg>
              <span>Home</span>
            </Link>

            <Link href="/tournaments" className="bn-tab" style={{ color: isTourneys ? ACTIVE : INACTIVE }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 4h12v3a6 6 0 01-12 0V4z" />
                <path d="M9 18h6" />
                <path d="M12 14v4" />
              </svg>
              <span>Tourneys</span>
            </Link>

            <Link href={playHref} className="bn-play" aria-label="Play next match">
              <div className="bn-play-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#050a08" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                </svg>
              </div>
              <span className="bn-play-label">Play</span>
            </Link>

            <Link href={bracketHref} className="bn-tab" style={{ color: isBracket ? ACTIVE : INACTIVE }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h6" />
                <path d="M3 14h6" />
                <path d="M15 6h6" />
                <path d="M15 14h6" />
                <path d="M9 8h3v8h3" />
              </svg>
              <span>Bracket</span>
            </Link>

            <Link href="/profile/edit" className="bn-tab" style={{ color: isProfile ? ACTIVE : INACTIVE }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
              </svg>
              <span>Profile</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
