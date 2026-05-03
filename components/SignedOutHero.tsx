import Link from 'next/link';

type Props = {
  liveCount: number;
};

export default function SignedOutHero({ liveCount }: Props) {
  return (
    <>
      <style>{`
     .so-hero {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          max-height: 68vh;
          min-height: 480px;
          overflow: hidden;
          background: #0a0a0a;
          border-bottom: 1px solid hsl(var(--ink));
        }
        @media (max-width: 720px) {
          .so-hero {
            aspect-ratio: 4 / 4.6;
            max-height: none;
            min-height: 0;
          }
        }

  .so-bg {
          position: absolute;
          inset: 0;
          z-index: 1;
          background:
            linear-gradient(135deg, rgba(10,10,10,0.65) 0%, rgba(10,10,10,0.15) 55%, rgba(10,10,10,0.40) 100%),
            url('/hero-bg.jpg') center/cover no-repeat,
            #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 720px) {
          .so-bg {
            background:
              linear-gradient(180deg, rgba(10,10,10,0.20) 0%, rgba(10,10,10,0.40) 45%, rgba(10,10,10,0.85) 100%),
              url('/hero-bg-mobile.jpg') center/cover no-repeat,
              #0a0a0a;
          }
        }



        .so-content {
          position: relative;
          z-index: 5;
          color: #fff;
          padding: 0 64px;
          max-width: 720px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        @media (max-width: 720px) {
          .so-content {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: auto;
            padding: 0 22px 28px;
            display: flex;
          }
        }

        .so-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: hsl(var(--live));
          color: #fff;
          padding: 7px 12px;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 22px;
          line-height: 1;
          align-self: flex-start;
          text-decoration: none;
        }
        @media (max-width: 720px) {
          .so-live-badge {
            font-size: 9px;
            padding: 6px 10px;
            margin-bottom: 16px;
          }
        }
        .so-live-badge .dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #fff;
          animation: so-blink 1.2s ease-in-out infinite;
        }
        @keyframes so-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .so-live-badge .arrow {
          margin-left: 4px;
          opacity: 0.8;
        }

        .so-title {
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 900;
          line-height: 0.92;
          letter-spacing: -0.04em;
          color: #fff;
          margin: 0 0 22px;
          font-size: 80px;
          text-shadow: 0 4px 28px rgba(0,0,0,0.45);
        }
        @media (max-width: 1024px) {
          .so-title { font-size: 60px; }
        }
        @media (max-width: 720px) {
          .so-title { font-size: 38px; margin-bottom: 14px; }
        }
        .so-title .accent {
          color: #10b981;
          font-style: italic;
        }

        .so-sub {
          font-family: var(--font-sans), system-ui, sans-serif;
          font-size: 17px;
          line-height: 1.5;
          color: rgba(255,255,255,0.85);
          margin: 0 0 30px;
          max-width: 480px;
          text-shadow: 0 1px 12px rgba(0,0,0,0.6);
        }
        @media (max-width: 720px) {
          .so-sub { font-size: 13px; margin-bottom: 18px; }
        }

        .so-ctas {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        @media (max-width: 720px) {
          .so-ctas { flex-wrap: nowrap; }
        }
        .so-cta {
          background: hsl(var(--accent));
          color: #fff;
          border: 1px solid hsl(var(--accent));
          padding: 15px 26px;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          line-height: 1;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .so-cta:hover {
          background: #10b981;
          border-color: #10b981;
        }
        @media (max-width: 720px) {
          .so-cta {
            padding: 12px 16px;
            font-size: 10px;
            flex: 1;
          }
        }
        .so-cta-ghost {
          background: rgba(255,255,255,0.10);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.50);
        }
        .so-cta-ghost:hover {
          background: rgba(255,255,255,0.18);
          border-color: #fff;
        }
      `}</style>

   <div className="so-hero">
        <div className="so-bg" />
        <div className="so-content">
          {liveCount > 0 && (
            <Link href="/tournaments" className="so-live-badge">
              <span className="dot" />
              <span>{liveCount} LIVE NOW</span>
              <span className="arrow">→</span>
            </Link>
          )}
          <h1 className="so-title">
            eFootball<br />
            tournaments,<br />
            <span className="accent">played for real.</span>
          </h1>
          <p className="so-sub">
            Verified results. Live brackets. A community that takes the game as seriously as you do.
          </p>
          <div className="so-ctas">
            <Link href="/signup" className="so-cta">Create account →</Link>
            <Link href="/signin" className="so-cta so-cta-ghost">Sign in</Link>
          </div>
        </div>
      </div>
    </>
  );
}
