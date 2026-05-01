'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { removePlayerFromTournament, withdrawPlayer, changePlayerRole } from '../app/actions/tournaments';

type Props = {
  slug: string;
  participantId: string;
  playerId: string;
  username: string;
  currentRole: string;
  isCurrentUser: boolean;
  status: string;
};

export default function PlayerRowActions({
  slug,
  participantId,
  playerId,
  username,
  currentRole,
  isCurrentUser,
  status,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isWithdrawn = status === 'withdrawn';

  const handleRemove = (e: React.MouseEvent) => {
    if (!confirm(`Remove @${username} from this tournament? Pending matches will auto-walkover.`)) {
      e.preventDefault();
    }
  };

  const handleWithdraw = (e: React.MouseEvent) => {
    if (!confirm(`Withdraw @${username}? Pending matches will auto-walkover. Their match history is preserved.`)) {
      e.preventDefault();
    }
  };

  const handleRoleChange = (e: React.MouseEvent, newRole: string) => {
    if (!confirm(`Change @${username}'s role to ${newRole.toUpperCase()}? This affects all tournaments globally.`)) {
      e.preventDefault();
    }
  };

  return (
    <>
      <style>{`
        .pra-trigger {
          background: transparent;
          border: 1px solid hsl(var(--ink) / 0.20);
          padding: 4px 8px;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 14px; font-weight: 700;
          color: hsl(var(--ink) / 0.62);
          cursor: pointer;
          line-height: 1;
        }
        .pra-trigger:hover {
          color: hsl(var(--ink));
          border-color: hsl(var(--ink));
        }

        .pra-menu-backdrop {
          position: fixed; inset: 0; z-index: 90;
          background: hsl(var(--ink) / 0.55);
        }
        .pra-menu {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 91;
          background: hsl(var(--bg));
          border-top: 1px solid hsl(var(--ink));
          max-height: 80vh;
          overflow-y: auto;
          padding: 8px 0;
        }
        @media (min-width: 720px) {
          .pra-menu {
            left: 50%; transform: translateX(-50%);
            max-width: 380px;
            border: 1px solid hsl(var(--ink));
            bottom: auto;
            top: 50%; transform: translate(-50%, -50%);
          }
        }

        .pra-menu-head {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: hsl(var(--ink) / 0.42);
          padding: 12px 18px 8px;
          border-bottom: 1px solid hsl(var(--ink) / 0.08);
        }
        .pra-menu-section {
          padding: 4px 0 8px;
          border-bottom: 1px solid hsl(var(--ink) / 0.08);
        }
        .pra-menu-section:last-of-type { border-bottom: none; }
        .pra-menu-section-label {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 8px; font-weight: 700;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: hsl(var(--ink) / 0.42);
          padding: 8px 18px 4px;
        }
        .pra-menu-item {
          display: block;
          width: 100%;
          background: transparent;
          border: none;
          padding: 10px 18px;
          text-align: left;
          font-family: var(--font-sans), system-ui, sans-serif;
          font-size: 14px; font-weight: 600;
          color: hsl(var(--ink));
          cursor: pointer;
          letter-spacing: -0.005em;
        }
        .pra-menu-item:hover:not(:disabled) {
          background: hsl(var(--ink) / 0.04);
        }
        .pra-menu-item:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        .pra-menu-item.danger {
          color: hsl(var(--live));
        }
        .pra-menu-item.current {
          background: hsl(var(--accent) / 0.06);
          color: hsl(var(--accent));
        }
        .pra-menu-item.current::after {
          content: ' · current';
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 10px; font-weight: 500;
          letter-spacing: 0.10em;
          color: hsl(var(--accent) / 0.7);
        }
        .pra-menu-cancel {
          padding: 12px 18px;
          background: hsl(var(--ink));
          color: hsl(var(--bg));
          border: none;
          width: 100%;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          cursor: pointer;
        }
        .pra-form {
          display: contents;
        }
      `}</style>

      <button
        type="button"
        className="pra-trigger"
        onClick={() => setMenuOpen(true)}
        aria-label={`Actions for ${username}`}
      >
        ⋯
      </button>

      {menuOpen && (
        <>
          <div className="pra-menu-backdrop" onClick={() => setMenuOpen(false)} />
          <div className="pra-menu">
            <div className="pra-menu-head">@{username}</div>

            {!isWithdrawn && (
              <div className="pra-menu-section">
                <form action={withdrawPlayer} className="pra-form">
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="participant_id" value={participantId} />
                  <MenuItemSubmit className="pra-menu-item" onClick={handleWithdraw}>
                    Withdraw player
                  </MenuItemSubmit>
                </form>

                <form action={removePlayerFromTournament} className="pra-form">
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="participant_id" value={participantId} />
                  <MenuItemSubmit className="pra-menu-item danger" onClick={handleRemove}>
                    Remove from tournament
                  </MenuItemSubmit>
                </form>
              </div>
            )}

            {!isCurrentUser && (
              <div className="pra-menu-section">
                <div className="pra-menu-section-label">CHANGE ROLE (GLOBAL)</div>
                {(['player', 'moderator', 'admin'] as const).map((role) => {
                  const isCurrent = role === currentRole;
                  return (
                    <form key={role} action={changePlayerRole} className="pra-form">
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="player_id" value={playerId} />
                      <input type="hidden" name="role" value={role} />
                      <MenuItemSubmit
                        className={`pra-menu-item ${isCurrent ? 'current' : ''}`}
                        onClick={(e) => !isCurrent && handleRoleChange(e, role)}
                        disabled={isCurrent}
                      >
                        Set as {role}
                      </MenuItemSubmit>
                    </form>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              className="pra-menu-cancel"
              onClick={() => setMenuOpen(false)}
            >
              Close
            </button>
          </div>
        </>
      )}
    </>
  );
}

function MenuItemSubmit({
  className,
  onClick,
  disabled,
  children,
}: {
  className: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      onClick={onClick}
      disabled={pending || disabled}
      aria-busy={pending}
    >
      {pending ? 'Working…' : children}
    </button>
  );
}
