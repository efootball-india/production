import Link from 'next/link';
import { signInWithGoogle, signUpWithUsername } from '../actions/auth';

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

        <div className="auth-divider"><span>OR PICK A USERNAME</span></div>

        <form action={signUpWithUsername} className="auth-form">
          <div className="auth-field">
            <label htmlFor="username" className="auth-label">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              maxLength={24}
              pattern="[A-Za-z0-9_]+"
              autoComplete="username"
              className="auth-input"
              placeholder="e.g. ragemode_99"
            />
            <small style={{ fontSize: 11, color: 'var(--text-3)' }}>
              3–24 characters · letters, numbers, underscore
            </small>
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
