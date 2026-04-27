import { getCurrentPlayer, PLATFORM_OPTIONS } from '@/lib/player';
import { updateProfile } from '@/app/actions/profile';
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
        <Link href="/profile" className="auth-back">← Back to profile</Link>
        <div className="auth-eyebrow">Edit profile</div>
        <h1 className="auth-h1">Update your details</h1>

        {searchParams.incomplete && (
          <div className="auth-error" style={{ marginBottom: 14 }}>
            Please complete your profile before registering for a tournament.
          </div>
        )}

        {searchParams.error && (
          <div className="auth-error">⚠ {searchParams.error}</div>
        )}

        <form action={updateProfile} className="auth-form">

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
              defaultValue={player.username}
              className="auth-input"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="display_name" className="auth-label">Display name</label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              maxLength={48}
              defaultValue={player.display_name}
              c
