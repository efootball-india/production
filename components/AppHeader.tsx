// PASS-3-APP-HEADER
import Link from 'next/link';
import { getCurrentPlayer } from '@/lib/player';
import { signOut } from '../app/actions/auth';

export default async function AppHeader() {
  const player = await getCurrentPlayer();
  const isAdmin = player?.role === 'admin' || player?.role === 'super_admin';
  const username = player?.username ?? '';

  return (
    <>
      <style>{`
        .app-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(5, 10, 8, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .app-header-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 20px;
          height: 56px;
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .app-header-logo {
          font-size: 13px;
          color: var(--accent);
          font-weight: 500;
          letter-spacing: 0.14em;
          text-decoration: none;
        }
        .app-header-nav {
          display: flex;
          gap: 22px;
          flex: 1;
          height: 100%;
          align-items: center;
        }
        .app-header-nav a {
          font-size: 13px;
          color: var(--text-2);
          text-decoration: none;
          height: 100%;
          display: flex;
          align-items: center;
          border-bottom: 2px solid transparent;
          transition: color 0.15s ease;
        }
        .app-header-nav a:hover {
          color: var(--text);
        }
        .app-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-left: auto;
        }
        .app-header-admin-pill {
          font-size: 9px;
          color: var(--accent);
          border: 1px solid rgba(0, 255, 136, 0.5);
          padding: 3px 8px;
          border-radius: 3px;
          letter-spacing: 0.14em;
          font-weight: 500;
        }
        .app-header-user {
          position: relative;
        }
        .app-header-user > summary {
          font-size: 13px;
          color: var(--text-2);
          cursor: pointer;
          list-style: none;
          padding: 6px 0;
        }
        .app-header-user > summary::-webkit-details-marker { display: none; }
        .app-header-user > summary:hover { color: var(--text); }
        .app-header-user[open] > summary { color: var(--text); }
        .app-header-user-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 6px;
          min-width: 180px;
          background: rgba(15, 20, 18, 0.98);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 6px;
          display: flex;
          flex-direction: column;
        }
        .app-header-user-menu a,
        .app-header-user-menu button {
          font-size: 13px;
          color: var(--text-2);
          background: none;
          border: none;
          padding: 8px 10px;
          text-align: left;
          cursor: pointer;
          text-decoration: none;
          border-radius: 4px;
          font: inherit;
          width: 100%;
        }
        .app-header-user-menu a:hover,
        .app-header-user-menu button:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text);
        }
        .app-header-mobile { display: none; }
        .app-header-hamburger {
          width: 22px;
          height: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          list-style: none;
        }
        .app-header-hamburger::-webkit-details-marker { display: none; }
        .app-header-hamburger span {
          height: 1.5px;
          background: var(--text-2);
          border-radius: 1px;
          transition: all 0.2s ease;
        }
        .app-header-mobile[open] .app-header-hamburger span:nth-child(1) {
          transform: translateY(7px) rotate(45deg);
        }
        .app-header-mobile[open] .app-header-hamburger span:nth-child(2) {
          opacity: 0;
        }
        .app-header-mobile[open] .app-header-hamburger span:nth-child(3) {
          transform: translateY(-7px) rotate(-45deg);
        }
        .app-header-drawer {
          position: fixed;
          top: 56px;
          left: 0;
          right: 0;
          background: rgba(5, 10, 8, 0.98);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
        }
        .app-header-drawer-label {
          font-size: 9px;
          color: var(--text-3);
          letter-spacing: 0.18em;
          margin-bottom: 8px;
          margin-top: 12px;
          font-weight: 500;
        }
        .app-header-drawer-label:first-child { margin-top: 0; }
        .app-header-drawer a,
        .app-header-drawer button {
          font-size: 15px;
          color: var(--text-2);
          padding: 10px 0;
          text-decoration: none;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          font: inherit;
          display: block;
        }
        .app-header-drawer hr {
          border: none;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          margin: 8px 0;
        }
        @media (max-width: 720px) {
          .app-header-nav { display: none; }
          .app-header-user { display: none; }
          .app-header-mobile { display: block; }
        }
      `}</style>

      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/" className="app-header-logo">EFTBL</Link>

          {player && (
            <nav className="app-header-nav">
              <Link href="/">Home</Link>
              <Link href="/tournaments">Tournaments</Link>
            </nav>
          )}

          <div className="app-header-right">
            {isAdmin && <span className="app-header-admin-pill">ADMIN</span>}

            {player ? (
              <>
                <details className="app-header-user">
                  <summary>{username} ▾</summary>
                  <div className="app-header-user-menu">
                    <Link href="/profile/edit">Profile</Link>
                    <form action={signOut}>
                      <button type="submit">Sign out</button>
                    </form>
                  </div>
                </details>

                <details className="app-header-mobile">
                  <summary className="app-header-hamburger">
                    <span></span><span></span><span></span>
                  </summary>
                  <div className="app-header-drawer">
                    <div className="app-header-drawer-label">NAVIGATE</div>
                    <Link href="/">Home</Link>
                    <Link href="/tournaments">Tournaments</Link>
                    <hr />
                    <div className="app-header-drawer-label">ACCOUNT</div>
                    <Link href="/profile/edit">Profile</Link>
                    <form action={signOut}>
                      <button type="submit">Sign out</button>
                    </form>
                  </div>
                </details>
              </>
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
