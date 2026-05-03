import Link from 'next/link';
import type { ConsistencyEntry } from '@/lib/consistency';

type Props = {
  topPlayers: ConsistencyEntry[];
  totalPlayers: number;
  seasonLabel: string;
};

const MAX_AVATARS = 5;

export default function CommunityCard({ topPlayers, totalPlayers, seasonLabel }: Props) {
  if (totalPlayers === 0) return null;

  const visible = topPlayers.slice(0, MAX_AVATARS);
  const overflowCount = Math.max(0, totalPlayers - visible.length);

  return (
    <>
      <Styles />
      <Link href="/players" className="cmm-card" aria-label="Meet other players in the community">
        <div className="cmm-eye-row">
          <span className="cmm-eye">★ COMMUNITY</span>
          <span className="cmm-season">SEASON {seasonLabel}</span>
        </div>

        <div className="cmm-top-row">
          <div className="cmm-stat">
            <div className="cmm-num">{totalPlayers}</div>
            <div className="cmm-lbl">PLAYERS</div>
          </div>
          <div className="cmm-bubbles">
            {visible.map((p, i) => {
              const initial = (p.displayName ?? p.username ?? '?').charAt(0).toUpperCase();
              const hasAvatar = !!p.avatarUrl;
              return (
                <div
                  key={p.playerId}
                  className="cmm-bubble cmm-bubble-player"
                  style={{
                    marginLeft: i === 0 ? 0 : -12,
                    backgroundImage: hasAvatar ? `url(${p.avatarUrl})` : undefined,
                  }}
                >
                  {!hasAvatar && <span className="cmm-initial">{initial}</span>}
                </div>
              );
            })}
            {overflowCount > 0 && (
              <div
                className="cmm-bubble cmm-bubble-more"
                style={{ marginLeft: visible.length > 0 ? -12 : 0 }}
              >
                +{overflowCount}
              </div>
            )}
          </div>
        </div>

        <div className="cmm-cta-row">
          <div className="cmm-cta-text">
            <div className="cmm-headline">
              Meet other players<br />in the community.
            </div>
            <div className="cmm-sub">EVERY PLAYER ON EFTBL</div>
          </div>
          <span className="cmm-arrow">→</span>
        </div>
      </Link>
    </>
  );
}

function Styles() {
  return (
    <style>{`
      .cmm-card {
        display: block;
        background: hsl(var(--accent));
        color: hsl(var(--bg));
        border: 1px solid hsl(var(--ink));
        box-shadow: 4px 4px 0 hsl(var(--ink));
        padding: 14px 16px;
        text-decoration: none;
        margin-bottom: 24px;
        transition: transform 0.12s ease, box-shadow 0.12s ease;
      }
      .cmm-card:hover {
        transform: translate(-1px, -1px);
        box-shadow: 5px 5px 0 hsl(var(--ink));
      }
      .cmm-card:active {
        transform: translate(2px, 2px);
        box-shadow: 2px 2px 0 hsl(var(--ink));
      }

      .cmm-eye-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .cmm-eye {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.18em; text-transform: uppercase;
        color: hsl(var(--bg));
      }
      .cmm-season {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase;
        color: hsl(var(--bg) / 0.55);
      }

      .cmm-top-row {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 14px;
        align-items: center;
        padding-bottom: 12px;
        border-bottom: 1px solid hsl(var(--bg) / 0.20);
        margin-bottom: 12px;
      }
      .cmm-stat { min-width: 0; }
      .cmm-num {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 36px;
        line-height: 0.9; letter-spacing: -0.04em;
        color: hsl(var(--bg));
      }
      .cmm-lbl {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 700;
        letter-spacing: 0.16em; text-transform: uppercase;
        color: hsl(var(--bg) / 0.55);
        margin-top: 2px;
      }

      .cmm-bubbles {
        display: flex;
        align-items: center;
        justify-content: flex-end;
      }
      .cmm-bubble {
        width: 38px; height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background-size: cover;
        background-position: center;
      }
      .cmm-bubble-player {
        background-color: hsl(var(--bg));
        color: hsl(var(--accent));
        border: 2px solid hsl(var(--accent));
        box-shadow: 0 0 0 1px hsl(var(--bg));
      }
      .cmm-bubble-more {
        background-color: hsl(var(--ink));
        color: hsl(var(--bg));
        border: 2px solid hsl(var(--accent));
        box-shadow: 0 0 0 1px hsl(var(--bg));
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 10px; font-weight: 800;
        letter-spacing: 0.04em;
      }
      .cmm-initial {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 14px;
        letter-spacing: -0.03em;
        color: hsl(var(--accent));
      }

      .cmm-cta-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .cmm-cta-text { min-width: 0; flex: 1; }
      .cmm-headline {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 17px;
        letter-spacing: -0.02em;
        line-height: 1.15;
        margin-bottom: 4px;
        color: hsl(var(--bg));
      }
      .cmm-sub {
        font-family: var(--font-mono), ui-monospace, monospace;
        font-size: 9px; font-weight: 600;
        letter-spacing: 0.12em; text-transform: uppercase;
        color: hsl(var(--bg) / 0.65);
      }
      .cmm-arrow {
        font-family: var(--font-sans), system-ui, sans-serif;
        font-weight: 900; font-size: 22px;
        color: hsl(var(--bg));
        flex-shrink: 0;
      }
    `}</style>
  );
}
