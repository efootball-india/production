import { getCurrentPlayer, PLATFORM_OPTIONS, SECURITY_QUESTIONS } from '@/lib/player';
import { updateProfile } from '../../actions/profile';
import { redirect } from 'next/navigation';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const player = await getCurrentPlayer();
  if (!player) redirect('/onboarding');

  return (
    <main className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-eyebrow">Profile</div>
        <h1 className="auth-h1">Your details</h1>

        {searchParams.saved && (
          <div style={{ padding: '10px 12px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', color: 'var(--accent)', fontSize: 13, marginBottom: 14 }}>
            Profile saved.
          </div>
        )}
        {searchParams.error && (
          <div className="auth-error">{searchParams.error}</div>
        )}

        <form action={updateProfile} className="auth-form">
          <div className="auth-field">
            <label htmlFor="username" className="auth-label">In-game name</label>
            <input
              id="username" name="username" type="text" required
              minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+"
              defaultValue={player.username} className="auth-input"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="display_name" className="auth-label">Display name</label>
            <input
              id="display_name" name="display_name" type="text" maxLength={48}
              defaultValue={player.display_name} className="auth-input"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="platform" className="auth-label">Platform</label>
            <select
              id="platform" name="platform" required className="auth-input"
              defaultValue={player.platform ?? ''}
            >
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
              defaultValue={player.game_id ?? ''} className="auth-input"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="region" className="auth-label">Country (optional)</label>
            <input
              id="region" name="region" type="text" maxLength={2}
              defaultValue={player.region ?? ''} className="auth-input"
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div className="auth-eyebrow" style={{ marginBottom: 8 }}>Password recovery</div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.5 }}>
              Update your security question and answer. Leave blank to keep current values.
            </p>

            <div className="auth-field">
              <label htmlFor="security_question" className="auth-label">Security question</label>
              <select
                id="security_question" name="security_question" className="auth-input"
                defaultValue={player.security_question ?? ''}
              >
                <option value="">— keep current —</option>
                {SECURITY_QUESTIONS.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            <div className="auth-field">
              <label htmlFor="security_answer" className="auth-label">New answer</label>
              <input
                id="security_answer" name="security_answer" type="text"
                minLength={2} maxLength={64} className="auth-input"
                placeholder="Leave blank to keep current"
              />
            </div>
          </div>

          <button type="submit" className="auth-button">Save</button>
        </form>
      </div>
    </main>
  );
}
