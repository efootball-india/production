// PASS-33-FORMATIONS (editorial)
import { redirect } from 'next/navigation';
import { getCurrentPlayer } from '@/lib/player';

export default async function FormationsPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect('/signin');

  return (
    <>
      <Styles />
      <main className="eff-page">
        <div className="eff-head">
          <h1 className="eff-title">
            Formations<span className="dim">.</span>
          </h1>
          <div className="eff-sub">PLAN YOUR TACTICS</div>
        </div>

        <div className="eff-card">
          <div className="eff-pitch-wrap">
            <PitchSvg />
          </div>
          <div className="eff-copy-title">
            Coming <span className="accent">soon.</span>
          </div>
          <p className="eff-copy-body">
            Design your formations and lineups. Save different tactics for
            different opponents and switch between them when you play.
          </p>
          <span className="eff-pill">SOON</span>
        </div>
      </main>
    </>
  );
}

function PitchSvg() {
  return (
    <svg
      className="eff-pitch-svg"
      viewBox="0 0 200 280"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Football pitch with 4-3-3 formation"
    >
      <rect
        x="4"
        y="4"
        width="192"
        height="272"
        fill="none"
        stroke="hsl(var(--ink))"
        strokeWidth="1.5"
      />
      <line
        x1="4"
        y1="140"
        x2="196"
        y2="140"
        stroke="hsl(var(--ink))"
        strokeWidth="1"
      />
      <circle
        cx="100"
        cy="140"
        r="22"
        fill="none"
        stroke="hsl(var(--ink))"
        strokeWidth="1"
      />
      <circle cx="100" cy="140" r="2" fill="hsl(var(--ink))" />

      <rect
        x="50"
        y="4"
        width="100"
        height="40"
        fill="none"
        stroke="hsl(var(--ink))"
        strokeWidth="1"
      />
      <rect
        x="74"
        y="4"
        width="52"
        height="14"
        fill="none"
        stroke="hsl(var(--ink))"
        strokeWidth="1"
      />
      <circle cx="100" cy="32" r="2" fill="hsl(var(--ink))" />
      <path
        d="M 80 44 A 22 22 0 0 0 120 44"
        fill="none"
        stroke="hsl(var(--ink))"
        strokeWidth="1"
      />

      <rect
        x="50"
        y="236"
        width="100"
        height="40"
        fill="none"
        stroke="hsl(var(--ink))"
        strokeWidth="1"
      />
      <rect
        x="74"
        y="262"
        width="52"
        height="14"
        fill="none"
        stroke="hsl(var(--ink))"
        strokeWidth="1"
      />
      <circle cx="100" cy="248" r="2" fill="hsl(var(--ink))" />
      <path
        d="M 80 236 A 22 22 0 0 1 120 236"
        fill="none"
        stroke="hsl(var(--ink))"
        strokeWidth="1"
      />

      <circle cx="100" cy="252" r="6" fill="hsl(var(--accent))" />

      <circle cx="40" cy="200" r="6" fill="hsl(var(--accent))" />
      <circle cx="76" cy="210" r="6" fill="hsl(var(--accent))" />
      <circle cx="124" cy="210" r="6" fill="hsl(var(--accent))" />
      <circle cx="160" cy="200" r="6" fill="hsl(var(--accent))" />

      <circle cx="60" cy="150" r="6" fill="hsl(var(--accent))" />
      <circle cx="100" cy="160" r="6" fill="hsl(var(--accent))" />
      <circle cx="140" cy="150" r="6" fill="hsl(var(--accent))" />

      <circle cx="50" cy="80" r="6" fill="hsl(var(--accent))" />
      <circle cx="100" cy="60" r="6" fill="hsl(var(--accent))" />
      <circle cx="150" cy="80" r="6" fill="hsl(var(--accent))" />
    </svg>
  );
}

function Styles() {
  return (
    <style>{`
      .eff-page {
        max-width: 720px;
        margin: 0 auto;
        padding: 24px 20px 60px;
      }

      .eff-head { padding-bottom: 22px; }
      .eff-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 32px;
        line-height: 0.92;
        letter-spacing: -0.03em;
        color: hsl(var(--ink));
        margin: 0 0 6px;
      }
      @media (min-width: 768px) {
        .eff-title { font-size: 40px; }
      }
      .eff-title .dim {
        color: hsl(var(--ink) / 0.42);
        font-weight: 500;
      }
      .eff-sub {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
      }

      .eff-card {
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink));
        box-shadow: 4px 4px 0 hsl(var(--ink));
        padding: 28px 22px;
        text-align: center;
      }

      .eff-pitch-wrap {
        margin: 0 auto 24px;
        max-width: 220px;
      }

      .eff-pitch-svg {
        display: block;
        width: 100%;
        height: auto;
      }

      .eff-copy-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 22px;
        line-height: 1;
        letter-spacing: -0.025em;
        margin-bottom: 10px;
        color: hsl(var(--ink));
      }
      .eff-copy-title .accent {
        color: hsl(var(--accent));
        font-style: italic;
      }
      .eff-copy-body {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 13px;
        line-height: 1.55;
        color: hsl(var(--ink) / 0.62);
        max-width: 340px;
        margin: 0 auto 20px;
      }
      .eff-pill {
        display: inline-block;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        background: hsl(var(--ink));
        color: hsl(var(--bg));
        padding: 6px 12px;
      }
    `}</style>
  );
}
