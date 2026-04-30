'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname() ?? '/';

  const isHome = pathname === '/';
  const isPlay = pathname.startsWith('/play');
  const isFormations = pathname.startsWith('/formations');
  const isProfile = pathname.startsWith('/profile');
  const isTourneys =
    !isPlay &&
    !isFormations &&
    !isProfile &&
    (pathname.startsWith('/tournaments') ||
      pathname.startsWith('/admin/tournaments'));

  return (
    <>
      <style>{`
        .bn-wrap { display: none; }
        @media (max-width: 720px) {
          .bn-wrap { display: block; }
          body { padding-bottom: 80px; }
        }

        .bn {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: hsl(var(--bg));
          border-top: 1px solid hsl(var(--ink));
          padding-bottom: max(10px, env(safe-area-inset-bottom));
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
          padding: 12px 0 6px;
          color: hsl(var(--ink) / 0.42);
          text-decoration: none;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          position: relative;
          transition: color 0.15s ease;
        }
        .bn-tab:hover { color: hsl(var(--ink)); }
        .bn-tab.active { color: hsl(var(--ink)); }
        .bn-tab.active::before {
          content: '';
          position: absolute;
          top: 0;
          left: 30%;
          right: 30%;
          height: 3px;
          background: hsl(var(--accent));
        }

        .bn-play {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          text-decoration: none;
        }
        .bn-play-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: hsl(var(--accent));
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: -22px;
          box-shadow: 3px 3px 0 hsl(var(--ink));
          transition: transform 0.15s ease;
        }
        .bn-play:active .bn-play-circle {
          transform: scale(0.94);
        }
        .bn-play-label {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: hsl(var(--accent));
          padding-bottom: 6px;
        }
        .bn-play.active .bn-play-label { color: hsl(var(--ink)); }
      `}</style>

      <nav className="bn-wrap" aria-label="Primary navigation">
        <div className="bn">
          <div className="bn-inner">
            <Link href="/" className={`bn-tab ${isHome ? 'active' : ''}`}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12l9-9 9 9" />
                <path d="M5 10v10h14V10" />
              </svg>
              <span>Home</span>
            </Link>

            <Link
              href="/tournaments"
              className={`bn-tab ${isTourneys ? 'active' : ''}`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 4h12v3a6 6 0 01-12 0V4z" />
                <path d="M9 18h6" />
                <path d="M12 14v4" />
              </svg>
              <span>Tourneys</span>
            </Link>

            <Link
              href="/play"
              className={`bn-play ${isPlay ? 'active' : ''}`}
              aria-label="My matches"
            >
              <div className="bn-play-circle">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 35 35"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.8849 15.0961C17.8849 17.6611 15.8056 19.7404 13.2407 19.7404H4.7755C5.77462 24.7856 9.83702 28.9213 15.2539 29.7939C22.0724 30.8925 28.5054 26.4134 29.8213 19.7381H34.5688C34.5526 19.8507 34.5355 19.9635 34.5171 20.0762L34.4796 20.2966C32.8453 29.5332 24.077 35.7989 14.7257 34.4126L14.503 34.378C6.77966 33.1338 1.07039 27.0371 0.0262941 19.7381H4.77344V15.0961H17.8849ZM0.0827697 14.5283C1.62751 5.09763 10.5881 -1.30553 20.0968 0.22645C27.9002 1.48374 33.6477 7.69441 34.6046 15.0939H29.8679C28.9482 9.94481 24.8448 5.69657 19.346 4.81059C12.4503 3.6996 5.9487 8.29319 4.73549 15.0939H0C0.0149653 14.9791 0.0306881 14.8642 0.0480156 14.7492L0.0827697 14.5283Z"
                    fill="hsl(var(--bg))"
                  />
                </svg>
              </div>
              <span className="bn-play-label">Play</span>
            </Link>

            <Link
              href="/formations"
              className={`bn-tab ${isFormations ? 'active' : ''}`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="3" width="14" height="18" rx="1.5" />
                <line x1="5" y1="12" x2="19" y2="12" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <span>Formations</span>
            </Link>

            <Link
              href="/profile"
              className={`bn-tab ${isProfile ? 'active' : ''}`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
