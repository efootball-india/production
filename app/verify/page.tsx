import Link from 'next/link';

export default function VerifyPage() {
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link href="/" className="auth-back">← Back</Link>
        <div className="auth-eyebrow">📧 Check your inbox</div>
        <h1 className="auth-h1">One More Step</h1>
        <p className="auth-sub">
          We&apos;ve sent a verification link to your email. Click it to activate your account and finish setup.
        </p>
        <div style={{
          padding: '14px 16px',
          background: 'var(--glass)',
          border: '1px solid var(--glass-border)',
          fontSize: 13,
          color: 'var(--text-2)',
          marginBottom: 20,
          lineHeight: 1.5,
        }}>
          <strong style={{ color: 'var(--text)' }}>Tip:</strong> Check your spam folder if you don&apos;t see it within 2 minutes. Verification links expire after 1 hour.
        </div>

        <p className="auth-foot">
          Wrong email? <Link href="/signup">Sign up again →</Link>
        </p>
      </div>
    </main>
  );
}
