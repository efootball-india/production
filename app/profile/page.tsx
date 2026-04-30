// PASS-30-PROFILE-VIEW (editorial)
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentPlayer, PLATFORM_LABELS } from '@/lib/player';
import { getPlayerStats } from '@/lib/stats';
import { signOut } from '../actions/auth';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { saved?: string; welcome?: string };
}) {
  const player = await getCurrentPlayer();
  if (!player) redirect('/signin');

  const stats = await getPlayerStats(player.id);
  // ...rest stays the same

  const displayName =
    player.display_name ?? player.username ?? '';
  const initial = (displayName.charAt(0) || '?').toUpperCase();
  const handle = player.username ? `@${player.username.toUpperCase()}` : '';

  const platformLabel = player.platform
    ? (PLATFORM_LABELS as any)[player.platform] ?? player.platform
    : null;
  const region = player.region ? player.region.toUpperCase() : null;

  const metaParts: Array<{ text: string; strong: boolean }> = [];
  if (platformLabel) metaParts.push({ text: platformLabel, strong: false });
  if (region) metaParts.push({ text: region, strong: true });

  return (
    <>
      <Styles />
      <main className="pf-page">
        {searchParams.saved && (
          <div className="pf-banner pf-banner-ok">
            <span className="dot" />
            <span>Profile saved.</span>
          </div>
        )}
        {searchParams.welcome && (
          <div className="pf-banner pf-banner-ok">
            <span className="dot" />
            <span>Welcome to eFTBL.</span>
          </div>
        )}
        <div className="pf-hero">
          <div className="pf-top">
            <div
              className="pf-avatar"
              style={
                player.avatar_url
                  ? {
                      backgroundImage: `url(${player.avatar_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              {!player.avatar_url && (
                <span className="initial">{initial}</span>
              )}
            </div>
            <div className="pf-id">
              <h1 className="pf-name">{displayName}</h1>
              {handle && <div className="pf-handle">{handle}</div>}
              {metaParts.length > 0 && (
                <div className="pf-meta">
                  {metaParts.map((p, i) => (
                    <span key={i}>
                      {i > 0 ? ' · ' : ''}
                      {p.strong ? (
                        <span className="strong">{p.text}</span>
                      ) : (
                        p.text
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pf-stats">
            <div className="pf-cell w">
              <span className="lbl">Wins</span>
              <span className="val">{stats.wins}</span>
            </div>
            <div className="pf-cell">
              <span className="lbl">Draws</span>
              <span className="val">{stats.draws}</span>
            </div>
            <div className="pf-cell l">
              <span className="lbl">Losses</span>
              <span className="val">{stats.losses}</span>
            </div>
          </div>

          <Link href="/profile/edit" className="pf-edit">
            Edit profile →
          </Link>
        </div>

        {player.bio && (
          <div className="pf-bio">
            <div className="lbl">BIO</div>
            <div className="body">{player.bio}</div>
          </div>
        )}

        <div className="pf-section">
          <div className="pf-section-head">CONNECTIONS</div>
          <div className="pf-row">
              <span className="lbl">WhatsApp</span>
              <span className="val mono">{(player as any).whatsapp_contact ?? '—'}</span>
            </div>
          <div className="pf-info">
            <div className="pf-row">
              <span className="lbl">Friend code</span>
              <span className="val mono">{player.game_id ?? '—'}</span>
            </div>
            <div className="pf-row">
              <span className="lbl">Discord</span>
              <span className="val mono">{player.discord_handle ?? '—'}</span>
            </div>
          </div>
        </div>

        <div className="pf-section">
          <div className="pf-section-head">SECURITY</div>
          <div className="pf-info">
            <div className="pf-row">
              <span className="lbl">Recovery Q</span>
              <span className="val small">
                {player.security_question ?? '—'}
              </span>
            </div>
          </div>
        </div>

        <form action={signOut} className="pf-signout">
          <button type="submit" className="pf-signout-btn">
            Sign out
          </button>
        </form>
      </main>
    </>
  );
}

function Styles() {
  return (
    <style>{`
    .pf-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        margin-bottom: 18px;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.10em;
        text-transform: uppercase;
      }
      .pf-banner .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        flex-shrink: 0;
      }
      .pf-banner-ok {
        background: hsl(var(--accent) / 0.08);
        border: 1px solid hsl(var(--accent) / 0.30);
        color: hsl(var(--accent));
      }
      .pf-page {
        max-width: 560px;
        margin: 0 auto;
        padding: 24px 20px 60px;
      }

      .pf-hero {
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink));
        box-shadow: 4px 4px 0 hsl(var(--ink));
        padding: 22px 20px;
        margin-bottom: 22px;
      }
      .pf-top {
        display: grid;
        grid-template-columns: 80px minmax(0, 1fr);
        gap: 16px;
        align-items: center;
        margin-bottom: 20px;
      }
      .pf-avatar {
        width: 80px;
        height: 80px;
        background: hsl(var(--ink));
        color: hsl(var(--bg));
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .pf-avatar .initial {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 40px;
        letter-spacing: -0.04em;
        line-height: 1;
      }
      .pf-id { min-width: 0; }
      .pf-name {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 26px;
        line-height: 0.95;
        letter-spacing: -0.03em;
        color: hsl(var(--ink));
        margin: 0 0 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .pf-handle {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.16em;
        color: hsl(var(--ink) / 0.42);
        text-transform: uppercase;
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .pf-meta {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px;
        font-weight: 500;
        letter-spacing: 0.14em;
        color: hsl(var(--ink) / 0.42);
        text-transform: uppercase;
      }
      .pf-meta .strong {
        color: hsl(var(--ink));
        font-weight: 700;
      }

      .pf-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1px;
        background: hsl(var(--ink));
        border: 1px solid hsl(var(--ink));
        margin-bottom: 18px;
      }
      .pf-cell {
        background: hsl(var(--surface));
        padding: 12px;
        text-align: center;
      }
      .pf-cell .lbl {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 8px;
        font-weight: 500;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        margin-bottom: 6px;
        display: block;
      }
      .pf-cell .val {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 24px;
        line-height: 1;
        letter-spacing: -0.025em;
        color: hsl(var(--ink));
        font-variant-numeric: tabular-nums;
      }
      .pf-cell.w .val { color: hsl(var(--accent)); }
      .pf-cell.l .val { color: hsl(var(--ink) / 0.42); }

      .pf-edit {
        display: block;
        width: 100%;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        text-align: center;
        background: hsl(var(--ink));
        color: hsl(var(--bg));
        padding: 12px;
        text-decoration: none;
      }
      .pf-edit:hover {
        background: hsl(var(--accent));
      }

      .pf-bio {
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink) / 0.20);
        border-left: 3px solid hsl(var(--accent));
        padding: 14px 16px;
        margin-bottom: 22px;
      }
      .pf-bio .lbl {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.18em;
        color: hsl(var(--ink) / 0.42);
        text-transform: uppercase;
        margin-bottom: 6px;
      }
      .pf-bio .body {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: hsl(var(--ink) / 0.62);
      }

      .pf-section { margin-bottom: 22px; }
      .pf-section-head {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid hsl(var(--ink));
      }
      .pf-info {
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink) / 0.20);
      }
      .pf-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        padding: 12px 14px;
        gap: 12px;
        border-bottom: 1px solid hsl(var(--ink) / 0.08);
      }
      .pf-row:last-child { border-bottom: none; }
      .pf-row .lbl {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px;
        font-weight: 500;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        flex-shrink: 0;
      }
      .pf-row .val {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 14px;
        font-weight: 700;
        color: hsl(var(--ink));
        text-align: right;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 60%;
      }
      .pf-row .val.mono {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 12px;
        word-break: break-all;
        white-space: normal;
      }
      .pf-row .val.small {
        font-size: 12px;
        max-width: 65%;
      }

      .pf-signout {
        margin-top: 8px;
        text-align: center;
      }
      .pf-signout-btn {
        background: transparent;
        border: 1px solid hsl(var(--ink) / 0.20);
        color: hsl(var(--live));
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        padding: 12px 24px;
        cursor: pointer;
      }
      .pf-signout-btn:hover {
        border-color: hsl(var(--live));
      }
    `}</style>
  );
}
