import { getCurrentPlayer, PLATFORM_OPTIONS } from '@/lib/player';
import { updateProfile } from '../../actions/profile';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function EditProfilePage({
  searchParams,
}: {
  searchParams: { error?: string; incomplete?: string };
}) {
  const player = await getCurrentPlayer();

  if (!player) {
    redirect('/onboarding');
  }

  return (
    <main className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <Link href="/profile" className="auth-back">Back to profile</Link>
        <div className="auth-eyebrow">Edit profile</div>
        <h1 className="auth-h1">Update your details</h1>

        {searchParams.incomplete && (
          <div className="auth-error" style={{ marginBottom: 14 }}>
            Please complete your profile before registering for a tournament.
          </div>
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
            <label htmlFor="game_id" className="auth-label">eFootball friend code</label>
            <input id="game_id" name="game_id" type="text" required minLength={4} maxLength={32} defaultValue={player.game_id ?? ''} className="auth-input" />
          </div>

          <div className="auth-field">
            <label htmlFor="discord_handle" className="auth-label">Discord handle</label>
            <input id="discord_handle" name="discord_handle" type="text" required minLength={2} maxLength={32} pattern="\S+" defaultValue={player.discord_handle ?? ''} className="auth-input" />
          </div>

          <div className="auth-field">
            <label htmlFor="region" className="auth-label">Country (optional)</label>
            <input id="region" name="region" type="text" maxLength={2} defaultValue={player.region ?? ''} className="auth-input" style={{ textTransform: 'uppercase' }} />
          </div>

          <div className="auth-field">
            <label htmlFor="bio" className="auth-label">Bio (optional)</label>
            <textarea id="bio" name="bio" maxLength={280} defaultValue={player.bio ?? ''} className="auth-input" rows={3} />
          </div>

          <button type="submit" className="auth-button">Save changes</button>
        </form>
      </div>
    </main>
  );
}
