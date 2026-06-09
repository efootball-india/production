// components/WorldCupCard.tsx
// Host the .ics file at /public/fifa-wc-2026.ics in your repo.
// Both calendar links resolve off eftbl.in — no third-party dependency.

const ICS_PUBLIC_URL = "https://eftbl.in/fifa-wc-2026.ics";
const APPLE_CAL_URL = `webcal://eftbl.in/fifa-wc-2026.ics`;
const GOOGLE_CAL_URL = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(ICS_PUBLIC_URL)}`;

export default function WorldCupCard() {
  return (
    <div className="border border-black bg-[#FAFAF7] shadow-[6px_6px_0px_#0A0A0A] p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span
            className="text-[10px] uppercase tracking-widest text-[#047857]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            FIFA World Cup 2026
          </span>
          <h3
            className="text-xl font-black uppercase leading-tight tracking-tight text-[#0A0A0A]"
            style={{ fontFamily: "'Archivo', sans-serif" }}
          >
            Full Schedule
          </h3>
          <p
            className="text-xs text-[#0A0A0A]/50 mt-0.5"
            style={{ fontFamily: "'Archivo', sans-serif" }}
          >
            104 matches · 11 Jun – 19 Jul · USA, Canada &amp; Mexico
          </p>
        </div>

        {/* Trophy mark */}
        <div className="w-10 h-10 bg-[#047857] flex items-center justify-center shrink-0">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path d="M7 4h8v7a4 4 0 0 1-8 0V4Z" stroke="#FAFAF7" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M7 6.5H5a2 2 0 0 0 2 2M15 6.5h2a2 2 0 0 1-2 2" stroke="#FAFAF7" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M11 11v3M9 17h4" stroke="#FAFAF7" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M8.5 14.5h5" stroke="#FAFAF7" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-black/10" />

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <a
          href={APPLE_CAL_URL}
          className="flex-1 flex items-center justify-center gap-2 border border-black px-4 py-2.5 text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#FAFAF7] transition-colors duration-150 text-xs font-bold uppercase tracking-wider"
          style={{ fontFamily: "'Archivo', sans-serif" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <rect x="1" y="2" width="12" height="11" stroke="currentColor" strokeWidth="1.3" />
            <path d="M1 5h12" stroke="currentColor" strokeWidth="1.3" />
            <path d="M4.5 1v2.5M9.5 1v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M4 8h2M8 8h2M4 10.5h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          Add to Apple Calendar
        </a>

        <a
          href={GOOGLE_CAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-[#047857] border border-[#047857] px-4 py-2.5 text-[#FAFAF7] hover:bg-[#065f46] hover:border-[#065f46] transition-colors duration-150 text-xs font-bold uppercase tracking-wider"
          style={{ fontFamily: "'Archivo', sans-serif" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <rect x="1" y="2" width="12" height="11" stroke="currentColor" strokeWidth="1.3" />
            <path d="M1 5h12" stroke="currentColor" strokeWidth="1.3" />
            <path d="M4.5 1v2.5M9.5 1v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M4 8h2M8 8h2M4 10.5h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          Add to Google Calendar
        </a>
      </div>

      {/* Footer */}
      <p
        className="text-[10px] text-[#0A0A0A]/35 leading-snug"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        All times in IST · 30-min match reminders included
      </p>
    </div>
  );
}
