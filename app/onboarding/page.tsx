import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { completeOnboarding } from '../actions/profile';
import { PLATFORM_OPTIONS, SECURITY_QUESTIONS } from '@/lib/player';

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: existing } = await supabase
    .from('players')
    .select('username, platform, security_question')
    .eq('id', user.id)
    .maybeSingle();

  if (existing && existing.username && existing.platform && existing.security_question) {
    redirect('/home');
  }

  return (
    <main className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-eyebrow">eFTBaller · Profile setup</div>
        <h1 className="auth-h1">Set up your profile</h1>
        <p className="auth-sub">
          This is how you&apos;ll appear in tournaments. Opponents need your platform and in-game ID to play you.
        </p>

        {searchParams.error && (
          <div className="auth-error">⚠ {searchParams.error}</div>
        )}

        <form action={completeOnboarding} className="auth-form">
          <div className="auth-field">
            <label htmlFor="username" className="auth-label">In-game name *</label>
            <input
              id="username" name="username" type="text" required
              minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+"
              className="auth-input" placeholder="e.g. ragemode_99"
            />
            <small style={{ fontSize: 11, color: 'var(--text-3)' }}>
              3–24 characters · letters, numbers, underscore
            </small>
          </div>

          <div className="auth-field">
            <label htmlFor="display_name" className="auth-label">Display name</label>
            <input
              id="display_name" name="display_name" type="text" maxLength={48}
              className="auth-input" placeholder="Defaults to your in-game name"
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
            <label htmlFor="game_id" className="auth-label">eFootball friend code (optional)</label>
            <input
              id="game_id" name="game_id" type="text" maxLength={32}
              className="auth-input"
              placeholder="In-game ID for opponents to add you"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="whatsapp_contact" className="auth-label">WhatsApp number *</label>
            <input
              id="whatsapp_contact" name="whatsapp_contact" type="tel" required
              minLength={6} maxLength={32}
              pattern="[\d\s\+\-\(\)]+"
              className="auth-input"
              placeholder="+91 98765 43210"
              inputMode="tel"
              autoComplete="tel"
            />
            <small style={{ fontSize: 11, color: 'var(--text-3)' }}>
              Required · used by admins for match coordination · visible only to tournament admins
            </small>
          </div>
          <div className="auth-field">
            <label htmlFor="region" className="auth-label">Country (optional)</label>
            <input
              id="region" name="region" type="text" maxLength={2}
              className="auth-input"
              placeholder="e.g. IN, BR, ES"
              style={{ textTransform: 'uppercase' }}
            />
            <small style={{ fontSize: 11, color: 'var(--text-3)' }}>
              ISO 2-letter country code
            </small>
          </div>

          <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div className="auth-eyebrow" style={{ marginBottom: 8 }}>Password recovery</div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.5 }}>
              Pick a question and answer in case you forget your password. Only you should know the answer.
            </p>

            <div className="auth-field">
              <label htmlFor="security_question" className="auth-label">Security question *</label>
              <select id="security_question" name="security_question" required className="auth-input">
                <option value="">Select…</option>
                {SECURITY_QUESTIONS.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            <div className="auth-field">
              <label htmlFor="security_answer" className="auth-label">Answer *</label>
              <input
                id="security_answer" name="security_answer" type="text" required
                minLength={2} maxLength={64} className="auth-input"
                placeholder="Case-insensitive · keep it memorable"
              />
            </div>
          </div>

          <button type="submit" className="auth-button">Enter eFTBL →</button>
        </form>
      </div>
    </main>
  );
}
