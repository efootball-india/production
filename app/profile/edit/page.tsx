// PASS-39-PROFILE-EDIT (editorial)
import SaveButton from '../../../components/SaveButton';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  getCurrentPlayer,
  PLATFORM_OPTIONS,
  SECURITY_QUESTIONS,
} from '@/lib/player';
import { updateProfile } from '../../actions/profile';
import AvatarUpload from '../../../components/AvatarUpload';

export default async function EditProfilePage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const player = await getCurrentPlayer();
  if (!player) redirect('/onboarding');

  const initial = (player.display_name ?? player.username ?? '?')
    .charAt(0)
    .toUpperCase();

  return (
    <>
      <Styles />
      <main className="pe-page">
        <Link href="/profile" className="pe-back">
          ← Back to profile
        </Link>

        <header className="pe-head">
          <div className="pe-eyebrow">EDIT PROFILE</div>
          <h1 className="pe-title">
            Your <span className="accent">details.</span>
          </h1>
        </header>

      
        {searchParams.error && (
          <div className="pe-banner pe-banner-err">
            <span className="dot" />
            <span>{searchParams.error}</span>
          </div>
        )}

        <section className="pe-section">
          <div className="pe-section-head">PROFILE PHOTO</div>
          <div className="pe-avatar-wrap">
            <AvatarUpload
              currentUrl={player.avatar_url ?? null}
              initial={initial}
            />
          </div>
        </section>

        <form action={updateProfile} className="pe-form">
          <section className="pe-section">
            <div className="pe-section-head">IDENTITY</div>

            <div className="pe-field">
              <label htmlFor="username" className="pe-label">
                In-game name
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                minLength={3}
                maxLength={24}
                pattern="[A-Za-z0-9_]+"
                defaultValue={player.username}
                className="pe-input"
              />
              <div className="pe-hint">
                3–24 characters · letters, numbers, underscores only
              </div>
            </div>

            <div className="pe-field">
              <label htmlFor="display_name" className="pe-label">
                Display name
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                maxLength={48}
                defaultValue={player.display_name ?? ''}
                className="pe-input"
              />
            </div>
          </section>

          <section className="pe-section">
            <div className="pe-section-head">PLATFORM</div>

            <div className="pe-field">
              <label htmlFor="platform" className="pe-label">
                Platform
              </label>
              <select
                id="platform"
                name="platform"
                required
                className="pe-input"
                defaultValue={player.platform ?? ''}
              >
                <option value="">Select…</option>
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pe-field">
              <label htmlFor="game_id" className="pe-label">
                eFootball friend code
              </label>
              <input
                id="game_id"
                name="game_id"
                type="text"
                maxLength={32}
                defaultValue={player.game_id ?? ''}
                className="pe-input pe-input-mono"
                placeholder="Optional"
              />
            </div>

        <div className="pe-field">
              <label htmlFor="whatsapp_contact" className="pe-label">
                WhatsApp number *
              </label>
              <input
                id="whatsapp_contact"
                name="whatsapp_contact"
                type="tel"
                required
                minLength={6}
                maxLength={32}
                pattern="[\d\s\+\-\(\)]+"
                defaultValue={player.whatsapp_contact ?? ''}
                className="pe-input pe-input-mono"
                placeholder="+91 98765 43210"
                inputMode="tel"
                autoComplete="tel"
              />
              <div className="pe-hint">
                Required · for match coordination · visible only to tournament admins
              </div>
            </div>

            <div className="pe-field">
              <label htmlFor="region" className="pe-label">
                Country
              </label>
              <input
                id="region"
                name="region"
                type="text"
                maxLength={2}
                defaultValue={player.region ?? ''}
                className="pe-input pe-input-mono pe-input-upper"
                placeholder="Optional · 2-letter code"
              />
            </div>
          </section>

          <section className="pe-section">
            <div className="pe-section-head">SECURITY</div>
            <p className="pe-section-body">
              Update your security question and answer. Leave blank to keep
              current values.
            </p>

            <div className="pe-field">
              <label htmlFor="security_question" className="pe-label">
                Security question
              </label>
              <select
                id="security_question"
                name="security_question"
                className="pe-input"
                defaultValue={player.security_question ?? ''}
              >
                <option value="">— keep current —</option>
                {SECURITY_QUESTIONS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            <div className="pe-field">
              <label htmlFor="security_answer" className="pe-label">
                New answer
              </label>
              <input
                id="security_answer"
                name="security_answer"
                type="text"
                minLength={2}
                maxLength={64}
                className="pe-input"
                placeholder="Leave blank to keep current"
              />
            </div>
          </section>

          <div className="pe-actions">
            <Link href="/profile" className="pe-cancel">
              Cancel
            </Link>
            <SaveButton />
          </div>
        </form>
      </main>
    </>
  );
}

function Styles() {
  return (
    <style>{`
      .pe-page {
        max-width: 560px;
        margin: 0 auto;
        padding: 24px 20px 60px;
      }

      .pe-back {
        display: inline-block;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.62);
        text-decoration: none;
        margin-bottom: 18px;
      }
      .pe-back:hover { color: hsl(var(--ink)); }

      .pe-head { padding-bottom: 22px; }
      .pe-eyebrow {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        margin-bottom: 6px;
      }
      .pe-title {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900;
        font-size: 32px;
        line-height: 0.92;
        letter-spacing: -0.03em;
        color: hsl(var(--ink));
        margin: 0;
      }
      @media (min-width: 768px) {
        .pe-title { font-size: 40px; }
      }
      .pe-title .accent { color: hsl(var(--accent)); font-style: italic; }

      .pe-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        margin-bottom: 22px;
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.10em;
        text-transform: uppercase;
      }
      .pe-banner .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        flex-shrink: 0;
      }
      .pe-banner-ok {
        background: hsl(var(--accent) / 0.08);
        border: 1px solid hsl(var(--accent) / 0.30);
        color: hsl(var(--accent));
      }
      .pe-banner-err {
        background: hsl(var(--live) / 0.08);
        border: 1px solid hsl(var(--live) / 0.30);
        color: hsl(var(--live));
      }

      .pe-section { margin-bottom: 28px; }
      .pe-section-head {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.42);
        margin-bottom: 14px;
        padding-bottom: 8px;
        border-bottom: 1px solid hsl(var(--ink));
      }
      .pe-section-body {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 13px;
        line-height: 1.5;
        color: hsl(var(--ink) / 0.62);
        margin-bottom: 16px;
      }

      .pe-avatar-wrap {
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink) / 0.20);
        padding: 20px 16px;
        display: flex;
        justify-content: center;
      }

      .pe-form { display: block; }

      .pe-field {
        margin-bottom: 16px;
      }
      .pe-field:last-child { margin-bottom: 0; }

      .pe-label {
        display: block;
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 13px;
        font-weight: 700;
        color: hsl(var(--ink));
        margin-bottom: 6px;
      }
      .pe-hint {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 0.04em;
        color: hsl(var(--ink) / 0.42);
        margin-top: 5px;
      }

      .pe-input {
        width: 100%;
        background: hsl(var(--surface));
        border: 1px solid hsl(var(--ink) / 0.20);
        color: hsl(var(--ink));
        font-family: var(--font-sans), system-ui, sans-serif;
        font-size: 14px;
        font-weight: 500;
        padding: 11px 12px;
        line-height: 1.3;
      }
      .pe-input:focus {
        outline: none;
        border-color: hsl(var(--ink));
        box-shadow: 0 0 0 3px hsl(var(--accent) / 0.20);
      }
      .pe-input::placeholder {
        color: hsl(var(--ink) / 0.42);
      }
      .pe-input-mono {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 13px;
      }
      .pe-input-upper { text-transform: uppercase; }

      select.pe-input {
        appearance: none;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none' stroke='%230A0A0A' stroke-width='1.5'><path d='M3 4.5l3 3 3-3'/></svg>");
        background-repeat: no-repeat;
        background-position: right 12px center;
        background-size: 12px;
        padding-right: 32px;
      }

      .pe-actions {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 10px;
        align-items: stretch;
        margin-top: 8px;
        padding-top: 22px;
        border-top: 1px solid hsl(var(--ink));
      }
      .pe-cancel {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: hsl(var(--ink) / 0.62);
        background: transparent;
        border: 1px solid hsl(var(--ink) / 0.20);
        padding: 12px 18px;
        text-decoration: none;
        text-align: center;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .pe-cancel:hover {
        color: hsl(var(--ink));
        border-color: hsl(var(--ink));
      }
      .pe-save {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        background: hsl(var(--ink));
        color: hsl(var(--bg));
        border: 1px solid hsl(var(--ink));
        padding: 12px;
        cursor: pointer;
        font-family: var(--font-mono), ui-monospace, monospace;
      }
      .pe-save:hover {
        background: hsl(var(--accent));
        border-color: hsl(var(--accent));
      }
      .pe-save:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
      .pe-save:disabled:hover {
        background: hsl(var(--ink));
        border-color: hsl(var(--ink));
      }
      .pe-save-loading {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .pe-save-spinner {
        width: 12px;
        height: 12px;
        border: 2px solid hsl(var(--bg) / 0.3);
        border-top-color: hsl(var(--bg));
        border-radius: 50%;
        animation: pe-spin 0.8s linear infinite;
      }
      @keyframes pe-spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  );
}
