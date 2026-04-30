// PASS-32-APP-HEADER-CLIENT (editorial · cream masthead)
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
          background: hsl(var(--bg));
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s ease;
        }
        .ah[data-expanded="true"] {
          border-bottom-color: hsl(var(--ink));
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
          color: hsl(var(--ink));
          text-decoration: none;
          line-height: 0;
          flex-shrink: 0;
        }
        .ah-logo:hover { color: hsl(var(--accent)); }

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
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: hsl(var(--ink) / 0.62);
          text-decoration: none;
          height: 100%;
          display: flex;
          align-items: center;
          transition: color 0.15s ease;
        }
        .ah-nav a:hover { color: hsl(var(--ink)); }
        .ah-nav a.active { color: hsl(var(--ink)); }

        .ah-right {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-left: auto;
          opacity: 1;
          transition: opacity 0.2s ease;
          min-width: 0;
        }

        .ah-play-cta {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          background: hsl(var(--accent));
          color: hsl(var(--bg));
          padding: 8px 14px;
          text-decoration: none;
          flex-shrink: 0;
          line-height: 1;
          transition: background 0.15s ease;
        }
        .ah-play-cta:hover {
          background: hsl(var(--ink));
          color: hsl(var(--bg));
        }

        .ah-username {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: hsl(var(--ink));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 160px;
          min-width: 0;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .ah-username:hover { color: hsl(var(--accent)); }

        .ah-admin-pill {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          background: hsl(var(--ink));
          color: hsl(var(--bg));
          padding: 5px 10px;
          line-height: 1;
          flex-shrink: 0;
        }

        .ah-signout {
          background: transparent;
          border: none;
          color: hsl(var(--ink) / 0.42);
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
          transition: color 0.15s ease;
        }
        .ah-signout:hover { color: hsl(var(--ink)); }

        .ah-signin {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: hsl(var(--ink));
          text-decoration: none;
          flex-shrink: 0;
        }
        .ah-signin:hover { color: hsl(var(--accent)); }

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
          .ah-username { max-width: 110px; font-size: 10px; }
        }
      `}</style>

      <header
        className="ah"
        data-expanded={expanded}
        data-minimal={minimalMode}
      >
        <div className="ah-inner">
          <Link href="/" className="ah-logo" aria-label="eFTBL home">
            <Logo height={22} />
          </Link>

          {isLoggedIn && (
            <nav className="ah-nav">
              <Link href="/" className={pathname === '/' ? 'active' : ''}>
                Home
              </Link>
              <Link
                href="/tournaments"
                className={pathname.startsWith('/tournaments') ? 'active' : ''}
              >
                Tournaments
              </Link>
              <Link
                href="/play"
                className={pathname.startsWith('/play') ? 'active' : ''}
              >
                My matches
              </Link>
            </nav>
          )}

          <div className="ah-right">
            {isLoggedIn && (
              <Link href="/play" className="ah-play-cta">
                ▸ PLAY
              </Link>
            )}
            {isLoggedIn && nameToShow && (
              <Link href="/profile" className="ah-username">
                {nameToShow}
              </Link>
            )}
            {isAdmin && <span className="ah-admin-pill">ADMIN</span>}
            {isLoggedIn ? (
              <form action={signOut}>
                <button type="submit" className="ah-signout">
                  Sign out
                </button>
              </form>
            ) : (
              <Link href="/signin" className="ah-signin">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
