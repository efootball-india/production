// PASS-41-TOURNAMENT-TABS (with Rules)
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Props = {
  slug: string;
  hasRules?: boolean;
};

export default function TournamentTabs({ slug, hasRules = false }: Props) {
  const pathname = usePathname() ?? '';
  const base = `/tournaments/${slug}`;

  const tabs: { href: string; label: string; match: (p: string) => boolean }[] = [
    { href: base, label: 'Fixtures', match: (p) => p === base },
    { href: `${base}/standings`, label: 'Standings', match: (p) => p.startsWith(`${base}/standings`) },
    { href: `${base}/bracket`, label: 'Bracket', match: (p) => p.startsWith(`${base}/bracket`) },
    { href: `${base}/stats`, label: 'Stats', match: (p) => p.startsWith(`${base}/stats`) },
    { href: `${base}/players`, label: 'Players', match: (p) => p.startsWith(`${base}/players`) },
  ];

  if (hasRules) {
    tabs.push({
      href: `${base}/rules`,
      label: 'Rules',
      match: (p) => p.startsWith(`${base}/rules`),
    });
  }

  return (
    <>
      <style>{`
        .tt-wrap {
          position: sticky;
          top: 0;
          z-index: 40;
          background: hsl(var(--bg));
          border-bottom: 1px solid hsl(var(--ink));
          margin-left: -20px;
          margin-right: -20px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        @media (min-width: 768px) {
          .tt-wrap {
            margin-left: -32px;
            margin-right: -32px;
          }
        }
        .tt-wrap::-webkit-scrollbar { display: none; }
        .tt-wrap { scrollbar-width: none; }
        .tt-inner {
          display: flex;
          gap: 24px;
          padding: 0 20px;
          min-width: max-content;
        }
        @media (min-width: 768px) {
          .tt-inner { padding: 0 32px; }
        }
        .tt-tab {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: hsl(var(--ink) / 0.42);
          text-decoration: none;
          padding: 16px 0;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          white-space: nowrap;
          transition: color 0.15s ease;
        }
        .tt-tab:hover { color: hsl(var(--ink)); }
        .tt-tab[data-active="true"] {
          color: hsl(var(--ink));
          border-bottom-color: hsl(var(--ink));
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
