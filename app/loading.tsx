// PASS-1-LOADING (editorial · pitch + formation)
export default function Loading() {
  return (
    <>
      <style>{`
        .ld-screen {
          position: fixed;
          inset: 0;
          background: hsl(var(--bg));
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 100;
          gap: 24px;
        }
        .ld-pitch-wrap {
          width: 160px;
          height: 220px;
          position: relative;
        }
        .ld-pitch-svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        .ld-line {
          stroke: hsl(var(--ink));
          fill: none;
          stroke-dasharray: 600;
          stroke-dashoffset: 600;
          animation: ld-stroke 3s ease-in-out infinite;
        }
        .ld-line-frame { stroke-width: 1.5; animation-delay: 0s; }
        .ld-line-mid { stroke-width: 1; animation-delay: 0.3s; }
        .ld-line-circle { stroke-width: 1; animation-delay: 0.5s; }
        .ld-line-box-top { stroke-width: 1; animation-delay: 0.6s; }
        .ld-line-box-bot { stroke-width: 1; animation-delay: 0.8s; }

        @keyframes ld-stroke {
          0% { stroke-dashoffset: 600; }
          50%, 100% { stroke-dashoffset: 0; }
        }

        .ld-player {
          fill: hsl(var(--accent));
          opacity: 0;
          animation: ld-pop 3s ease-out infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        @keyframes ld-pop {
          0%, 30% { opacity: 0; transform: scale(0); }
          50%, 95% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0); }
        }
        .ld-p-1 { animation-delay: 1.1s; }
        .ld-p-2 { animation-delay: 1.2s; }
        .ld-p-3 { animation-delay: 1.3s; }
        .ld-p-4 { animation-delay: 1.4s; }
        .ld-p-5 { animation-delay: 1.5s; }
        .ld-p-6 { animation-delay: 1.6s; }
        .ld-p-7 { animation-delay: 1.7s; }
        .ld-p-8 { animation-delay: 1.8s; }
        .ld-p-9 { animation-delay: 1.9s; }
        .ld-p-10 { animation-delay: 2.0s; }
        .ld-p-11 { animation-delay: 2.1s; }

        .ld-label {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: hsl(var(--ink) / 0.42);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .ld-label .dots span {
          display: inline-block;
          animation: ld-dot 1.4s ease-in-out infinite;
        }
        .ld-label .dots span:nth-child(2) { animation-delay: 0.2s; }
        .ld-label .dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes ld-dot {
          0%, 80%, 100% { opacity: 0.3; }
          40% { opacity: 1; }
        }
      `}</style>

      <div className="ld-screen" aria-label="Loading">
        <div className="ld-pitch-wrap">
          <svg
            className="ld-pitch-svg"
            viewBox="0 0 160 220"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect className="ld-line ld-line-frame" x="3" y="3" width="154" height="214" />
            <line className="ld-line ld-line-mid" x1="3" y1="110" x2="157" y2="110" />
            <circle className="ld-line ld-line-circle" cx="80" cy="110" r="20" />
            <rect className="ld-line ld-line-box-top" x="40" y="3" width="80" height="32" />
            <rect className="ld-line ld-line-box-top" x="58" y="3" width="44" height="12" />
            <rect className="ld-line ld-line-box-bot" x="40" y="185" width="80" height="32" />
            <rect className="ld-line ld-line-box-bot" x="58" y="205" width="44" height="12" />

            <circle className="ld-player ld-p-1" cx="80" cy="200" r="4" />
            <circle className="ld-player ld-p-2" cx="34" cy="160" r="4" />
            <circle className="ld-player ld-p-3" cx="62" cy="166" r="4" />
            <circle className="ld-player ld-p-4" cx="98" cy="166" r="4" />
            <circle className="ld-player ld-p-5" cx="126" cy="160" r="4" />
            <circle className="ld-player ld-p-6" cx="48" cy="118" r="4" />
            <circle className="ld-player ld-p-7" cx="80" cy="124" r="4" />
            <circle className="ld-player ld-p-8" cx="112" cy="118" r="4" />
            <circle className="ld-player ld-p-9" cx="42" cy="62" r="4" />
            <circle className="ld-player ld-p-10" cx="80" cy="48" r="4" />
            <circle className="ld-player ld-p-11" cx="118" cy="62" r="4" />
          </svg>
        </div>

        <div className="ld-label">
          <span>LINEUPS</span>
          <span className="dots">
            <span>·</span>
            <span>·</span>
            <span>·</span>
          </span>
        </div>
      </div>
    </>
  );
}
