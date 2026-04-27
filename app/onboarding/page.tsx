import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { completeOnboarding } from '../actions/profile';
import { PLATFORM_OPTIONS } from '@/lib/player';

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  // If profile already exists with required fields, send to home.
  // Otherwise show onboarding (or let them complete missing fields).
  const { data: existing } = await supabase
    .from('players')
    .select('username, platform, game_id, discord_handle')
    .eq('id', user.id)
    .maybeSingle();

  if (
    existing &&
    existing.username &&
    existing.platform &&
    existing.game_id &&
    existing.discord_handle
  ) {
    redirect('/home');
  }

  return (
    <main className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-eyebrow">eFTBaller · Profile setup</div>
        <h1 className="auth-h1">Set up your profile</h1>
        <p className="auth-sub">
          This is how you&apos;ll appear in tournaments. Opponents need your platform,
          in-game ID, and Discord handle to actually play you.
        </p>

        {searchParams.error && (
          <div className="auth-error">⚠ {searchParams.error}</div>
        )}

        <form action={completeOnboarding} className="auth-form">

          <div className="auth-field">
            <label htmlFor="username" className="auth-label">In-game name *</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              maxLength={24}
              pattern="[A-Za-z0-9_]+"
              className="auth-input"
              placeholder="e.g. ragemode_99"
            />
            <small style={{ fontSize: 11, color: 'var(--text-3)' }}>
              3–24 characters · letters, numbers, underscore
            </small>
          </div>

          <div className="auth-field">
            <label htmlFor="display_name" className="auth-label">Display name</label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              maxLength={48}
              className="auth-input"
              placeholder="Defaults to your in-game name"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="platform" className="auth-label">Platform *</label>
            <select id="platform" name="platform" required className="auth-input">
              <option value="">Select…</option>
              {PLATFORM_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="auth-field">
            <label htmlFor="game_id" className="auth-label">eFootball friend code *</label>
            <input
              id="game_id"
              name="game_id"
              type="text"
              required
              minLength={4}
              maxLength={32}
              className="auth-input"
              placeholder="Your in-game ID for opponents to add you"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="discord_handle" className="auth-label">Discord handle *</label>
            <input
              id="discord_handle"
              name="discord_handle"
              type="text"
              required
              minLength={2}
              maxLength={32}
              pattern="\S+"
              className="auth-input"
              placeholder="e.g. ragemode99"
            />
            <small style={{ fontSize: 11, color: 'var(--text-3)' }}>
              For coordinating match times with your opponent
            </small>
          </div>

          <div className="auth-field">
            <label htmlFor="region" className="auth-label">Country (optional)</label>
            <input
              id="region"
              name="region"
              type="text"
              maxLength={2}
              className="auth-input"
              placeholder="e.g. IN, BR, ES"
              style={{ textTransform: 'uppercase' }}
            />
            <small style={{ fontSize: 11, color: 'var(--text-3)' }}>
              ISO 2-letter country code
            </small>
          </div>

          <button type="submit" className="auth-button">
            Enter eFTBL →
          </button>
        </form>
      </div>
    </main>
  );
}
