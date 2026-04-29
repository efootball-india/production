// PASS-27-APP-HEADER-CLIENT
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from '../app/actions/auth';
import Logo from './Logo';

type Props = {
  username: string | null;
  displayName: string | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
};

const HOMEPAGE_THRESHOLD = 200;

export default function AppHeaderClient({
  username,
  displayName,
  isAdmin,
  isLoggedIn,
}: Props) {
  const pathname = usePathname() ?? '/';
  const isHomepage = pathname === '/';
  const [expanded, setExpanded] = useState(!isHomepage);

  useEffect(() => {
    if (!isHomepage) {
      setExpanded(true);
      return;
    }
    const handler = () => {
      setExpanded(window.scrollY > HOMEPAGE_THRESHOLD);
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [isHomepage]);

  const nameToShow = displayName || username || '';
  const minimalMode = isHomepage && !expanded;

  return (
    <>
      <style>{`
        .ah {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(5, 10, 8, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0);
          transition: border-color 0.2s ease;
        }
        .ah[data-expanded="true"] {
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }
        .ah-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 20px;
          height: 56px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .ah[data-minimal="true"] .ah-inner {
          justify-content: center;
        }
        .ah-logo {
          display: inline-flex;
          align-items: center;
          color: #ffffff;
          text-decoration: none;
          line-height: 0;
          flex-shrink: 0;
        }
        .ah-logo:hover { color: #ffffff; }
        .ah-nav {
          display: flex;
          gap: 22px;
          flex: 1;
          height: 100%;
          align-items: center;
          opacity: 1;
          transition: opacity 0.2s ease;
        }
        .ah-nav a {
          font-size: 13px;
          color: var(--text-2);
          text-decoration: none;
          height: 100%;
          display: flex;
          align-items: center;
          transition: color 0.15s ease;
        }
        .ah-nav a:hover { color: var(--text); }
        .ah-right {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-left: auto;
          opacity: 1;
          transition: opacity 0.2s ease;
          min-width: 0;
        }
        .ah-play-cta {
          font-size: 12px;
          color: #050a08 !important;
          background: var(--accent);
          padding: 7px 14px;
          border-radius: 4px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-decoration: none;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          flex-shrink: 0;
        }
        .ah-play-cta:hover {
          color: #050a08 !important;
          box-shadow: 0 0 16px rgba(0, 255, 136, 0.4);
          transform: translateY(-1px);
        }
        .ah-username {
          font-size: 10px;
          color: var(--text-2);
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 160px;
          min-width: 0;
        }
        .ah-admin-pill {
          font-size: 10px;
          color: var(--accent);
          background: rgba(0, 255, 136, 0.12);
          border: 1px solid rgba(0, 255, 136, 0.4);
          padding: 4px 10px;
          border-radius: 3px;
          letter-spacing: 0.18em;
          font-weight: 700;
          flex-shrink: 0;
        }
        .ah-signout {
          background: transparent;
          border: none;
          color: var(--text-3);
          font-size: 12px;
          cursor: pointer;
          padding: 0;
          font: inherit;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }
        .ah-signout:hover { color: var(--text-2); }

        .ah[data-minimal="true"] .ah-nav,
        .ah[data-minimal="true"] .ah-right {
          opacity: 0;
          pointer-events: none;
        }

        @media (max-width: 720px) {
          .ah-nav { display: none; }
          .ah-play-cta { display: none; }
          .ah-signout { display: none; }
        }
        @media (max-width: 420px) {
          .ah-username { max-width: 110px; font-size: 9px; }
        }
      `}</style>

      <header className="ah" data-expanded={expanded} data-minimal={minimalMode}>
        <div className="ah-inner">
          <Link href="/" className="ah-logo" aria-label="eFTBL home">
            <Logo height={22} />
          </Link>

          {isLoggedIn && (
            <nav className="ah-nav">
              <Link href="/">Home</Link>
              <Link href="/tournaments">Tournaments</Link>
              <Link href="/play">My matches</Link>
            </nav>
          )}

          <div className="ah-right">
            {isLoggedIn && <Link href="/play" className="ah-play-cta">▸ PLAY</Link>}
            {isLoggedIn && nameToShow && (
              <span className="ah-username">{nameToShow}</span>
            )}
            {isAdmin && <span className="ah-admin-pill">ADMIN</span>}
            {isLoggedIn ? (
              <form action={signOut}>
                <button type="submit" className="ah-signout">Sign out</button>
              </form>
            ) : (
              <Link href="/signin" style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
