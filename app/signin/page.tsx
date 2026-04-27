import Link from 'next/link';
import { signInWithGoogle, signInWithEmail } from '@/app/actions/auth';

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

        <div className="auth-divider"><span>OR USE EMAIL</span></div>

        <form action={signInWithEmail} className="auth-form">
          <div className="auth-field">
            <label htmlFor="email" className="auth-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="auth-input"
              placeholder="you@example.com"
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
