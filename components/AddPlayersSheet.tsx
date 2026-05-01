'use client';

import { useEffect, useState } from 'react';
import { addPlayersToTournament } from '../app/actions/tournaments';
import SubmitButton from './SubmitButton';

type PlayerOption = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type Props = {
  slug: string;
  allPlayers: PlayerOption[];
  alreadyRegisteredIds: string[];
};

export default function AddPlayersSheet({ slug, allPlayers, alreadyRegisteredIds }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const registeredSet = new Set(alreadyRegisteredIds);
  const available = allPlayers.filter((p) => !registeredSet.has(p.id));

  const filtered = search.trim()
    ? available.filter((p) => {
        const q = search.trim().toLowerCase();
        return (
          p.username.toLowerCase().includes(q) ||
          (p.displayName ?? '').toLowerCase().includes(q)
        );
      })
    : available;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <>
      <style>{`
        .aps-trigger {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          background: hsl(var(--ink));
          color: hsl(var(--bg));
          border: 1px solid hsl(var(--ink));
          padding: 10px 16px;
          cursor: pointer;
          line-height: 1;
        }
        .aps-trigger:hover {
          background: hsl(var(--accent));
          border-color: hsl(var(--accent));
        }

        .aps-backdrop {
          position: fixed; inset: 0; z-index: 100;
          background: hsl(var(--ink) / 0.55);
          animation: aps-fade 0.2s ease-out;
        }
        @keyframes aps-fade { from { opacity: 0; } to { opacity: 1; } }

        .aps-sheet {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 101;
          background: hsl(var(--bg));
          border-top: 1px solid hsl(var(--ink));
          max-height: 92vh;
          display: flex; flex-direction: column;
          animation: aps-slide 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes aps-slide {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @media (min-width: 720px) {
          .aps-sheet {
            left: 50%; transform: translateX(-50%);
            max-width: 520px;
            border-left: 1px solid hsl(var(--ink));
            border-right: 1px solid hsl(var(--ink));
          }
          @keyframes aps-slide {
            from { transform: translate(-50%, 100%); }
            to { transform: translate(-50%, 0); }
          }
        }

        .aps-handle { padding: 10px 0 4px; display: flex; justify-content: center; }
        .aps-handle .grip {
          width: 36px; height: 3px;
          background: hsl(var(--ink) / 0.20);
        }
        .aps-head {
          padding: 0 18px 14px;
          border-bottom: 1px solid hsl(var(--ink) / 0.08);
          display: flex; align-items: baseline; justify-content: space-between;
        }
        .aps-head .title {
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 900; font-size: 20px;
          letter-spacing: -0.025em;
        }
        .aps-head .close {
          background: transparent; border: none;
          font-size: 18px; color: hsl(var(--ink) / 0.42);
          cursor: pointer;
        }

        .aps-search-row {
          padding: 12px 18px;
          border-bottom: 1px solid hsl(var(--ink) / 0.08);
        }
        .aps-search-input {
          width: 100%;
          padding: 10px 12px;
          background: hsl(var(--surface));
          border: 1px solid hsl(var(--ink) / 0.20);
          font-family: var(--font-sans), system-ui, sans-serif;
          font-size: 14px;
          outline: none;
        }
        .aps-search-input:focus {
          border-color: hsl(var(--accent));
        }

        .aps-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
        }
        .aps-row {
          display: grid;
          grid-template-columns: 24px 32px 1fr;
          gap: 12px;
          align-items: center;
          padding: 10px 18px;
          cursor: pointer;
          border-bottom: 1px solid hsl(var(--ink) / 0.06);
          transition: background 0.1s ease;
        }
        .aps-row:hover { background: hsl(var(--ink) / 0.04); }
        .aps-row.selected {
          background: hsl(var(--accent) / 0.10);
          border-color: hsl(var(--accent) / 0.30);
        }

        .aps-checkbox {
          width: 18px; height: 18px;
          border: 2px solid hsl(var(--ink));
          background: hsl(var(--bg));
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .aps-row.selected .aps-checkbox {
          background: hsl(var(--accent));
          border-color: hsl(var(--accent));
        }
        .aps-row.selected .aps-checkbox::after {
          content: '✓';
          color: hsl(var(--bg));
          font-size: 12px; font-weight: 900;
          line-height: 1;
        }

        .aps-avatar {
          width: 28px; height: 28px;
          background: hsl(var(--ink));
          color: hsl(var(--bg));
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 800; font-size: 12px;
          flex-shrink: 0;
        }
        .aps-info { min-width: 0; }
        .aps-display {
          font-family: var(--font-sans), system-ui, sans-serif;
          font-weight: 700; font-size: 14px;
          color: hsl(var(--ink));
          letter-spacing: -0.005em;
          line-height: 1.2;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .aps-handle-text {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.10em; text-transform: uppercase;
          color: hsl(var(--ink) / 0.42);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .aps-empty {
          padding: 30px 20px; text-align: center;
          font-family: var(--font-sans), system-ui, sans-serif;
          font-size: 13px;
          color: hsl(var(--ink) / 0.62);
        }

        .aps-foot {
          padding: 14px 18px;
          border-top: 1px solid hsl(var(--ink) / 0.08);
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 8px;
        }
        .aps-cancel {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          background: transparent;
          border: 1px solid hsl(var(--ink) / 0.20);
          color: hsl(var(--ink) / 0.62);
          padding: 12px 18px;
          cursor: pointer;
        }
        .aps-add {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          background: hsl(var(--accent));
          border: 1px solid hsl(var(--accent));
          color: #fff;
          padding: 12px;
          cursor: pointer;
        }
        .aps-add:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: hsl(var(--ink));
          border-color: hsl(var(--ink));
        }
      `}</style>

      <button
        type="button"
        className="aps-trigger"
        onClick={() => setOpen(true)}
      >
        + Add players
      </button>

      {open && (
        <>
          <div className="aps-backdrop" onClick={() => setOpen(false)} />
          <div className="aps-sheet">
            <div className="aps-handle"><div className="grip" /></div>
            <div className="aps-head">
              <span className="title">Add players</span>
              <button type="button" className="close" onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className="aps-search-row">
              <input
                type="text"
                className="aps-search-input"
                placeholder="Search by username or name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <form action={addPlayersToTournament} className="aps-list" id="aps-form">
              <input type="hidden" name="slug" value={slug} />
              {Array.from(selected).map((id) => (
                <input key={id} type="hidden" name="player_ids" value={id} />
              ))}

              {filtered.length === 0 ? (
                <div className="aps-empty">
                  {available.length === 0
                    ? 'All platform players are already in this tournament.'
                    : 'No players match your search.'}
                </div>
              ) : (
                filtered.map((p) => {
                  const isSel = selected.has(p.id);
                  const initial = (p.displayName ?? p.username).charAt(0).toUpperCase();
                  return (
                    <div
                      key={p.id}
                      className={`aps-row ${isSel ? 'selected' : ''}`}
                      onClick={() => toggle(p.id)}
                    >
                      <div className="aps-checkbox" />
                      <div
                        className="aps-avatar"
                        style={p.avatarUrl ? {
                          backgroundImage: `url(${p.avatarUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        } : undefined}
                      >
                        {!p.avatarUrl && <span>{initial}</span>}
                      </div>
                      <div className="aps-info">
                        <div className="aps-display">{p.displayName ?? p.username}</div>
                        <div className="aps-handle-text">@{p.username}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </form>

            <div className="aps-foot">
              <button
                type="button"
                className="aps-cancel"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <AddPlayersSubmit selectedCount={selected.size} />
            </div>
          </div>
        </>
      )}
    </>
  );
}

function AddPlayersSubmit({ selectedCount }: { selectedCount: number }) {
  // SubmitButton must be inside <form> for useFormStatus to work, but our
  // button is in the foot OUTSIDE the form (uses form="aps-form"). To make
  // useFormStatus see the form, we wrap in a tiny one-button form that
  // submits the parent form via JS. Simpler: just use a local form here
  // with form-attribute on the button.
  return (
    <form
      action={(fd) => {
        // Forward submit to the actual form
        const realForm = document.getElementById('aps-form') as HTMLFormElement | null;
        if (realForm) realForm.requestSubmit();
      }}
    >
      <SubmitButton
        className="aps-add"
        disabled={selectedCount === 0}
        loadingChildren="Adding…"
      >
        Add {selectedCount > 0 ? selectedCount : ''} player{selectedCount === 1 ? '' : 's'} →
      </SubmitButton>
    </form>
  );
}
