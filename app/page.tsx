import Link from 'next/link';

export default function WelcomePage() {
  return (
    <main className="welcome">
      <div className="welcome-inner">
        <div className="welcome-mark">
          <span className="accent">e</span>FTBL
        </div>
        <p className="welcome-tag">A tournament platform for the eFootball 1v1 community.</p>
        <p className="welcome-sub">Where the community plays for real · v0.2</p>

        <div className="welcome-actions">
          <Link href="/signup" className="welcome-btn-primary">
            ▸ Join eFTBL
          </Link>
          <Link href="/signin" className="welcome-btn-secondary">
            Sign in
          </Link>
        </div>

        <p className="welcome-foot">
          Coming soon · Tournaments · Live brackets · Rankings
        </p>
        <p style={{ marginTop: 14 }}>
          <a href="/prototype.html" className="welcome-preview-link">
            ⏵ View design preview →
          </a>
        </p>
      </div>
    </main>
  );
}
