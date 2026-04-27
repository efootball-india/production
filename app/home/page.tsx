import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { signOut } from '@/app/actions/auth';

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const { data: player } = await supabase
    .from('players')
    .select('username, display_name, region, platform, role')
    .eq('id', user.id)
    .single();

  if (!player) {
    redirect('/onboarding');
  }

  return (
    <main className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 560 }}>
        <div className="auth-eyebrow">eFTBaller · Authenticated</div>
        <h1 className="auth-h1">
          Welcome,<br />
          <span style={{ color: 'var(--accent)', textShadow: '0 0 24px rgba(0,255,136,0.5)' }}>
            {player.username}
          </span>
        </h1>
        <p className="auth-sub">
          You&apos;re signed in. Tournament features are coming in the next phases — for now, here&apos;s your account info.
        </p>

        <div style={{
          padding: '16px 18px',
          background: 'var(--glass)',
          border: '1px solid var(--glass-border)',
          marginBottom: 20,
          fontFamily: 'ui-monospace, monospace',
          fontSize: 12,
          lineHeight: 1.8,
        }}>
          <div><span style={{ color: 'var(--text-3)' }}>EMAIL · </span>{user.email}</div>
          <div><span style={{ color: 'var(--text-3)' }}>IGN · </span>{player.username}</div>
          <div><span style={{ color: 'var(--text-3)' }}>DISPLAY · </span>{player.display_name}</div>
          <div><span style={{ color: 'var(--text-3)' }}>PLATFORM · </span>{player.platform || '—'}</div>
          <div><span style={{ color: 'var(--text-3)' }}>REGION · </span>{player.region || '—'}</div>
          <div><span style={{ color: 'var(--text-3)' }}>ROLE · </span>{player.role}</div>
        </div>

        <p className="auth-sub" style={{ marginBottom: 20 }}>
          <strong style={{ color: 'var(--accent)' }}>Coming next:</strong> the real home page — your next match, active tournaments, news, and more. We&apos;re building this in phases.
        </p>

        <form action={signOut}>
          <button type="submit" className="auth-oauth-btn">
            <span className="auth-oauth-icon">↺</span>
            <span>Sign Out</span>
          </button>
        </form>

        <p className="auth-foot">
          <a href="/prototype.html" className="welcome-preview-link">
            ⏵ View design preview →
          </a>
        </p>
      </div>
    </main>
  );
}
