import Link from 'next/link';
import { signInWithGoogle, signInWithUsername } from '../actions/auth';

export default function SignInPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link href="/" className="auth-back">← Back</Link>
        <div className="auth-eyebrow">eFTBaller · Sign In</div>
        <h1 className="auth-h1">Welcome Back</h1>
        <p className="auth-sub">
          Sign in to register for tournaments, report scores, and check your standings.
        </p>

        {searchParams.error && (
          <div className="auth-error">⚠ {searchParams.error}</div>
        )}

        <form action={signInWithGoogle}>
          <button type="submit" className="auth-oauth-btn">
            <span className="auth-oauth-icon">G</span>
            <span>Continue with Google</span>
          </button>
        </form>

        <div className="auth-divider"><span>OR USE USERNAME</span></div>

        <form action={signInWithUsername} className="auth-form">
          <div className="auth-field">
            <label htmlFor="username" className="auth-label">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              className="auth-input"
              placeholder="Your eFTBaller username"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="auth-input"
              placeholder="Your password"
            />
            <Link href="/forgot-password" style={{ fontSize: 11, color: 'var(--text-3)', display: 'inline-block', marginTop: 4 }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="auth-button">
            ▸ Sign In
          </button>
        </form>

        <p className="auth-foot">
          New to eFTBL? <Link href="/signup">Create account →</Link>
        </p>
      </div>
    </main>
  );
}
