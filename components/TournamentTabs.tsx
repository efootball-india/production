// PASS-39-TOURNAMENT-TABS
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Props = { slug: string };

export default function TournamentTabs({ slug }: Props) {
  const pathname = usePathname() ?? '';
  const base = `/tournaments/${slug}`;

  const tabs = [
    { href: base, label: 'Fixtures', match: (p: string) => p === base },
    { href: `${base}/standings`, label: 'Standings', match: (p: string) => p.startsWith(`${base}/standings`) },
    { href: `${base}/bracket`, label: 'Bracket', match: (p: string) => p.startsWith(`${base}/bracket`) },
    { href: `${base}/stats`, label: 'Stats', match: (p: string) => p.startsWith(`${base}/stats`) },
    { href: `${base}/players`, label: 'Players', match: (p: string) => p.startsWith(`${base}/players`) },
  ];

  return (
    <>
      <style>{`
        .tt-wrap {
          position: sticky;
          top: 56px;
          z-index: 40;
          background: rgba(5, 10, 8, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin: 0 -20px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .tt-inner {
          display: flex;
          gap: 24px;
          padding: 0 20px;
          min-width: max-content;
        }
        .tt-tab {
          font-size: 12px;
          color: var(--text-2);
          text-decoration: none;
          padding: 14px 0;
          letter-spacing: 0.04em;
          font-weight: 600;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          white-space: nowrap;
          transition: color 0.15s ease;
        }
        .tt-tab:hover { color: var(--text); }
        .tt-tab[data-active="true"] {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }
      `}</style>

      <nav className="tt-wrap" aria-label="Tournament sections">
        <div className="tt-inner">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="tt-tab"
              data-active={t.match(pathname) ? 'true' : 'false'}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
