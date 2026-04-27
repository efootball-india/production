import Link from 'next/link';
import { signInWithGoogle, signUpWithEmail } from '@/app/actions/auth';

export default function SignUpPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link href="/" className="auth-back">← Back</Link>
        <div className="auth-eyebrow">eFTBaller · Sign Up</div>
        <h1 className="auth-h1">Join the Cup</h1>
        <p className="auth-sub">
          Create your eFTBaller account to register for tournaments, report scores, and climb the ladder.
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

        <form action={signUpWithEmail} className="auth-form">
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
              minLength={8}
              autoComplete="new-password"
              className="auth-input"
              placeholder="8+ characters"
            />
          </div>
          <button type="submit" className="auth-button">
            ▸ Create Account
          </button>
        </form>

        <p className="auth-foot">
          Already an eFTBaller? <Link href="/signin">Sign in →</Link>
        </p>
      </div>
    </main>
  );
}
