import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { lookupSecurityQuestion, verifyAnswerAndContinue, setNewPassword } from '../actions/recover';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { username?: string; verified?: string; error?: string };
}) {
  const username = searchParams.username?.trim();
  const verified = searchParams.verified === '1';
  const error = searchParams.error;

  // Step 1: ask for username
  if (!username) {
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <Link href="/signin" className="auth-back">← Sign in</Link>
          <div className="auth-eyebrow">Recover account</div>
          <h1 className="auth-h1">Forgot password?</h1>
          <p className="auth-sub">
            Enter your username. We&apos;ll show you the security question you set up at signup.
          </p>

          {error && <div className="auth-error">⚠ {error}</div>}

          <form action={lookupSecurityQuestion} className="auth-form">
            <div className="auth-field">
              <label htmlFor="username" className="auth-label">Username</label>
              <input
                id="username" name="username" type="text" required
                minLength={3} maxLength={24}
                className="auth-input"
                placeholder="Your eFTBaller username"
              />
            </div>
            <button type="submit" className="auth-button">Continue →</button>
          </form>
        </div>
      </main>
    );
  }

  // Step 3: set new password
  if (verified) {
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <Link href="/signin" className="auth-back">← Sign in</Link>
          <div className="auth-eyebrow">Recover account</div>
          <h1 className="auth-h1">Set new password</h1>
          <p className="auth-sub">
            Identity verified. Pick a new password for <strong style={{ color: 'var(--text)' }}>{username}</strong>.
          </p>

          {error && <div className="auth-error">⚠ {error}</div>}

          <form action={setNewPassword} className="auth-form">
            <input type="hidden" name="username" value={username} />
            {/* answer is required by the action for re-verification — pass through */}
            <AnswerHidden username={username} />

            <div className="auth-field">
              <label htmlFor="password" className="auth-label">New password</label>
              <input
                id="password" name="password" type="password" required
                minLength={8} autoComplete="new-password"
                className="auth-input" placeholder="8+ characters"
              />
            </div>
            <div className="auth-field">
              <label htmlFor="password2" className="auth-label">Confirm</label>
              <input
                id="password2" name="password2" type="password" required
                minLength={8} autoComplete="new-password"
                className="auth-input" placeholder="Type it again"
              />
            </div>

            <button type="submit" className="auth-button">Save new password</button>
          </form>
        </div>
      </main>
    );
  }

  // Step 2: show security question, ask for answer
  const supabase = createClient();
  const { data: player } = await supabase
    .from('players')
    .select('security_question')
    .eq('username', username)
    .maybeSingle();

  // Don't reveal whether the user exists. If they don't, just show a generic question
  // and let them fail the answer check silently.
  const question = player?.security_question ?? 'What is your favorite real-life football club?';

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link href="/forgot-password" className="auth-back">← Different username</Link>
        <div className="auth-eyebrow">Recover account</div>
        <h1 className="auth-h1">Verify identity</h1>
        <p className="auth-sub">
          Answer your security question to reset the password for <strong style={{ color: 'var(--text)' }}>{username}</strong>.
        </p>

        {error && <div className="auth-error">⚠ {error}</div>}

        <form action={verifyAnswerAndContinue} className="auth-form">
          <input type="hidden" name="username" value={username} />

          <div className="auth-field">
            <label className="auth-label">Your security question</label>
            <div style={{
              padding: '10px 12px',
              background: 'var(--glass)',
              border: '1px solid var(--glass-border)',
              fontSize: 13,
              color: 'var(--text-2)',
            }}>
              {question}
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="answer" className="auth-label">Your answer</label>
            <input
              id="answer" name="answer" type="text" required
              minLength={2} maxLength={64}
              className="auth-input"
              placeholder="Case-insensitive"
            />
          </div>

          <button type="submit" className="auth-button">Verify →</button>
        </form>
      </div>
    </main>
  );
}

// In step 3, the answer is already verified once, but the setNewPassword action
// re-verifies it. We need to pass it through. To avoid a hidden plaintext answer
// in the URL, we make the user re-type it on the new-password screen.
// Component below adds the answer field inline so the action has access.
function AnswerHidden({ username }: { username: string }) {
  return (
    <div className="auth-field">
      <label htmlFor="answer" className="auth-label">Confirm your security answer</label>
      <input
        id="answer" name="answer" type="text" required
        minLength={2} maxLength={64}
        className="auth-input"
        placeholder="Same answer as before"
      />
      <small style={{ fontSize: 11, color: 'var(--text-3)' }}>
        Re-enter for verification.
      </small>
    </div>
  );
}
