import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { completeOnboarding } from '../actions/auth';

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  // If already onboarded, send to home
  const { data: existing } = await supabase
    .from('players')
    .select('username')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) {
    redirect('/home');
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="auth-eyebrow">eFTBaller · Profile Setup · 1 of 1</div>
        <h1 className="auth-h1">Set Up Your eFTBaller</h1>
        <p className="auth-sub">
          This is how you&apos;ll appear in tournaments, scoreboards, and the leaderboard.
        </p>

        {searchParams.error && (
          <div className="auth-error">⚠ {searchParams.error}</div>
        )}

        <form action={completeOnboarding} className="auth-form">
          <div className="auth-field">
            <label htmlFor="username" className="auth-label">In-Game Name (IGN) *</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              maxLength={24}
              pattern="[A-Za-z0-9_]+"
              className="auth-input"
              placeholder="e.g. RAGEMODE_99"
            />
            <small style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'ui-monospace, monospace' }}>
              3–24 chars · letters, numbers, underscore
            </small>
          </div>

          <div className="auth-field">
            <label htmlFor="display_name" className="auth-label">Display Name (optional)</label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              maxLength={48}
              className="auth-input"
              placeholder="Defaults to your IGN"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="platform" className="auth-label">Platform *</label>
            <select id="platform" name="platform" required className="auth-input">
              <option value="">Select…</option>
              <option value="ps5">PlayStation 5</option>
              <option value="ps4">PlayStation 4</option>
              <option value="xbox">Xbox</option>
              <option value="pc">PC · Steam</option>
              <option value="mobile">Mobile</option>
            </select>
          </div>

          <div className="auth-field">
            <label htmlFor="region" className="auth-label">Country (optional)</label>
            <input
              id="region"
              name="region"
              type="text"
              maxLength={2}
              className="auth-input"
              placeholder="e.g. IN, BR, ES (ISO 2-letter code)"
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <button type="submit" className="auth-button">
            ▸ Enter eFTBL
          </button>
        </form>
      </div>
    </main>
  );
}
