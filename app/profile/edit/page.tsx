import { getCurrentPlayer, PLATFORM_OPTIONS } from '@/lib/player';
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
          <div style={{ padding: '10px 12px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', color: 'var(--accent)', fontSize: 13, marginBottom: 14 }}>Profile saved.</div>
        )}

        {searchParams.error && (
          <div className="auth-error">{searchParams.error}</div>
        )}

        <form action={updateProfile} className="auth-form">
          <div className="auth-field">
            <label htmlFor="username" className="auth-label">In-game name</label>
            <input id="username" name="username" type="text" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" defaultValue={player.username} className="auth-input" />
          </div>

          <div className="auth-field">
            <label htmlFor="display_name" className="auth-label">Display name</label>
            <input id="display_name" name="display_name" type="text" maxLength={48} defaultValue={player.display_name} className="auth-input" />
          </div>

          <div className="auth-field">
            <label htmlFor="platform" className="auth-label">Platform</label>
            <select id="platform" name="platform" required className="auth-input" defaultValue={player.platform ?? ''}>
              <option value="">Select...</option>
              {PLATFORM_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="auth-field">
            <label htmlFor="region" className="auth-label">Country (optional)</label>
            <input id="region" name="region" type="text" maxLength={2} defaultValue={player.region ?? ''} className="auth-input" style={{ textTransform: 'uppercase' }} />
          </div>

          <button type="submit" className="auth-button">Save</button>
        </form>
      </div>
    </main>
  );
}
