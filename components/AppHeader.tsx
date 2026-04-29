// PASS-7-APP-HEADER
import Link from 'next/link';
import { getCurrentPlayer } from '@/lib/player';
import { getActiveTournamentSlug } from '@/lib/match';
import { signOut } from '../app/actions/auth';
import BottomNav from './BottomNav';

export default async function AppHeader() {
  const player = await getCurrentPlayer();
  const isAdmin = player?.role === 'admin' || player?.role === 'super_admin';
  const username = player?.username ?? '';
  const activeSlug = player ? await getActiveTournamentSlug(player.id) : null;
  const playHref = activeSlug ? `/play/${activeSlug}` : '/tournaments';

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
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .ah-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 20px;
          height: 56px;
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .ah-logo {
          font-size: 13px;
          color: var(--accent);
          font-weight: 500;
          letter-spacing: 0.14em;
          text-decoration: none;
          flex-shrink: 0;
        }
        .ah-nav {
          display: flex;
          gap: 22px;
          flex: 1;
          height: 100%;
          align-items: center;
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
        }
        .ah-play-cta {
          font-size: 12px;
          color: #050a08 !important;
          background: var(--accent);
          padding: 7px 14px;
          border-radius: 4px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-decoration: none;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .ah-play-cta:hover {
          color: #050a08 !important;
          box-shadow: 0 0 16px rgba(0, 255, 136, 0.4);
          transform: translateY(-1px);
        }
        .ah-admin-pill {
          font-size: 9px;
          color: var(--accent);
          border: 1px solid rgba(0, 255, 136, 0.5);
          padding: 3px 8px;
          border-radius: 3px;
          letter-spacing: 0.14em;
          font-weight: 500;
          flex-shrink: 0;
        }
        .ah-user > summary {
          font-size: 13px;
          color: var(--text-2);
          cursor: pointer;
          list-style: none;
          padding: 6px 0;
        }
        .ah-user > summary::-webkit-details-marker { display: none; }
        .ah-user > summary:hover { color: var(--text); }
        .ah-user[open] > summary { color: var(--text); }
        .ah-user-menu {
          position: absolute;
          top: 56px;
          right: 20px;
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
        .ah-user-menu a,
        .ah-user-menu button {
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
        .ah-user-menu a:hover,
        .ah-user-menu button:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text);
        }
        @media (max-width: 720px) {
          .ah-nav { display: none; }
          .ah-play-cta { display: none; }
          .ah-user { display: none; }
        }
      `}</style>

      <header className="ah">
        <div className="ah-inner">
          <Link href="/" className="ah-logo">EFTBL</Link>

          {player && (
            <nav className="ah-nav">
              <Link href="/">Home</Link>
              <Link href="/tournaments">Tournaments</Link>
              <Link href={playHref}>My matches</Link>
            </nav>
          )}

          <div className="ah-right">
            {player && <Link href={playHref} className="ah-play-cta">▸ PLAY</Link>}
            {isAdmin && <span className="ah-admin-pill">ADMIN</span>}

            {player ? (
              <details className="ah-user">
                <summary>{username} ▾</summary>
                <div className="ah-user-menu">
                  <Link href="/profile/edit">Profile</Link>
                  <form action={signOut}>
                    <button type="submit">Sign out</button>
                  </form>
                </div>
              </details>
            ) : (
              <Link href="/signin" style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {player && <BottomNav activeSlug={activeSlug} />}
    </>
  );
}
