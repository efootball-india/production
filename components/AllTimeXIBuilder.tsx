'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Slot = { id: string; label: string; x: number; y: number };
type Player = { name: string; number: string };
type FormationName = '4-3-3' | '4-4-2' | '4-2-3-1' | '3-5-2';

const FORMATIONS: Record<FormationName, Slot[]> = {
  '4-3-3': [
    { id: 'GK',  label: 'GK', x: 50, y: 132 },
    { id: 'LB',  label: 'LB', x: 14, y: 108 },
    { id: 'CBL', label: 'CB', x: 36, y: 112 },
    { id: 'CBR', label: 'CB', x: 64, y: 112 },
    { id: 'RB',  label: 'RB', x: 86, y: 108 },
    { id: 'CML', label: 'CM', x: 24, y: 76 },
    { id: 'CMC', label: 'CM', x: 50, y: 82 },
    { id: 'CMR', label: 'CM', x: 76, y: 76 },
    { id: 'LW',  label: 'LW', x: 16, y: 36 },
    { id: 'ST',  label: 'ST', x: 50, y: 26 },
    { id: 'RW',  label: 'RW', x: 84, y: 36 },
  ],
  '4-4-2': [
    { id: 'GK',  label: 'GK', x: 50, y: 132 },
    { id: 'LB',  label: 'LB', x: 14, y: 108 },
    { id: 'CBL', label: 'CB', x: 36, y: 112 },
    { id: 'CBR', label: 'CB', x: 64, y: 112 },
    { id: 'RB',  label: 'RB', x: 86, y: 108 },
    { id: 'LM',  label: 'LM', x: 14, y: 68 },
    { id: 'CML', label: 'CM', x: 38, y: 72 },
    { id: 'CMR', label: 'CM', x: 62, y: 72 },
    { id: 'RM',  label: 'RM', x: 86, y: 68 },
    { id: 'STL', label: 'ST', x: 36, y: 28 },
    { id: 'STR', label: 'ST', x: 64, y: 28 },
  ],
  '4-2-3-1': [
    { id: 'GK',  label: 'GK',  x: 50, y: 134 },
    { id: 'LB',  label: 'LB',  x: 14, y: 112 },
    { id: 'CBL', label: 'CB',  x: 36, y: 116 },
    { id: 'CBR', label: 'CB',  x: 64, y: 116 },
    { id: 'RB',  label: 'RB',  x: 86, y: 112 },
    { id: 'DML', label: 'DM',  x: 36, y: 86 },
    { id: 'DMR', label: 'DM',  x: 64, y: 86 },
    { id: 'LAM', label: 'LM',  x: 18, y: 50 },
    { id: 'CAM', label: 'AM',  x: 50, y: 54 },
    { id: 'RAM', label: 'RM',  x: 82, y: 50 },
    { id: 'ST',  label: 'ST',  x: 50, y: 22 },
  ],
  '3-5-2': [
    { id: 'GK',  label: 'GK',  x: 50, y: 134 },
    { id: 'CBL', label: 'CB',  x: 26, y: 114 },
    { id: 'CBC', label: 'CB',  x: 50, y: 116 },
    { id: 'CBR', label: 'CB',  x: 74, y: 114 },
    { id: 'LWB', label: 'LWB', x: 12, y: 74 },
    { id: 'CML', label: 'CM',  x: 32, y: 78 },
    { id: 'CMC', label: 'CM',  x: 50, y: 82 },
    { id: 'CMR', label: 'CM',  x: 68, y: 78 },
    { id: 'RWB', label: 'RWB', x: 88, y: 74 },
    { id: 'STL', label: 'ST',  x: 36, y: 28 },
    { id: 'STR', label: 'ST',  x: 64, y: 28 },
  ],
};

const STORAGE_KEY = 'eftbl_alltime_xi_v1';
const FORMATION_NAMES: FormationName[] = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2'];

type SavedState = {
  formation: FormationName;
  squadName: string;
  xi: Record<string, Player>;
};

export default function AllTimeXIBuilder() {
  const [formation, setFormation] = useState<FormationName>('4-3-3');
  const [squadName, setSquadName] = useState('Greatest XI of all time');
  const [xi, setXi] = useState<Record<string, Player>>({});
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [sheetName, setSheetName] = useState('');
  const [sheetNumber, setSheetNumber] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: SavedState = JSON.parse(saved);
        if (parsed.formation && FORMATIONS[parsed.formation]) setFormation(parsed.formation);
        if (typeof parsed.squadName === 'string') setSquadName(parsed.squadName);
        if (parsed.xi && typeof parsed.xi === 'object') setXi(parsed.xi);
      }
    } catch (e) {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const state: SavedState = { formation, squadName, xi };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore (private mode etc.)
    }
  }, [formation, squadName, xi, hydrated]);

  // Lock body scroll when sheet open
  useEffect(() => {
    if (editingSlot) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [editingSlot]);

  // Close sheet on Escape
  useEffect(() => {
    if (!editingSlot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSheet();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editingSlot]);

  const slots = FORMATIONS[formation];
  const filled = slots.filter((s) => xi[s.id]).length;
  const pct = Math.round((filled / 11) * 100);

  function openSheet(slotId: string) {
    const existing = xi[slotId];
    setSheetName(existing?.name ?? '');
    setSheetNumber(existing?.number ?? '');
    setEditingSlot(slotId);
  }

  function closeSheet() {
    setEditingSlot(null);
  }

  function saveSheet() {
    if (!editingSlot) return;
    const name = sheetName.trim();
    if (!name) {
      alert('Add a player name');
      return;
    }
    setXi((prev) => ({
      ...prev,
      [editingSlot]: { name, number: sheetNumber.trim() },
    }));
    closeSheet();
  }

  function removeSlot() {
    if (!editingSlot) return;
    setXi((prev) => {
      const copy = { ...prev };
      delete copy[editingSlot];
      return copy;
    });
    closeSheet();
  }

  function changeFormation(next: FormationName) {
    if (next === formation) return;
    if (Object.keys(xi).length > 0) {
      if (!confirm('Switching formation will clear your squad. Continue?')) return;
    }
    setFormation(next);
    setXi({});
    closeSheet();
  }

  function reset() {
    if (Object.keys(xi).length === 0) return;
    if (!confirm('Reset the XI?')) return;
    setXi({});
    closeSheet();
  }

  function shareXI() {
    alert('Image export coming soon — for now, screenshot your squad and share!');
  }

  const editingSlotData = editingSlot ? slots.find((s) => s.id === editingSlot) ?? null : null;
  const editingExists = editingSlot ? !!xi[editingSlot] : false;

  return (
    <>
      <Styles />
      <div className="atxi-page">
        <div className="atxi-chrome">
          <Link href="/" className="atxi-breadcrumb">← eFTBL</Link>
          <div className="atxi-eyebrow">★ Playground</div>
          <h1 className="atxi-title">
            Build your all-time XI<span className="accent">.</span>
          </h1>
          <p className="atxi-subtitle">
            Eleven slots. One squad. The greatest of all time, decided by you.
          </p>
        </div>

        <div className="atxi-squad">
          <input
            type="text"
            className="atxi-input"
            placeholder="Name your squad…"
            value={squadName}
            onChange={(e) => setSquadName(e.target.value)}
            maxLength={60}
          />
        </div>

        <div className="atxi-formations">
          {FORMATION_NAMES.map((f) => (
            <button
              key={f}
              type="button"
              className={`atxi-pill ${f === formation ? 'active' : ''}`}
              onClick={() => changeFormation(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="atxi-pitch-wrap">
          <svg viewBox="0 0 100 145" preserveAspectRatio="xMidYMid meet" className="atxi-pitch">
            <rect x="0" y="0" width="100" height="145" fill="#1B4A2D" />
            <rect x="0" y="0" width="100" height="14.5" fill="#1F5230" />
            <rect x="0" y="29" width="100" height="14.5" fill="#1F5230" />
            <rect x="0" y="58" width="100" height="14.5" fill="#1F5230" />
            <rect x="0" y="87" width="100" height="14.5" fill="#1F5230" />
            <rect x="0" y="116" width="100" height="14.5" fill="#1F5230" />
            <rect x="3" y="3" width="94" height="139" fill="none" stroke="rgba(244,239,231,0.5)" strokeWidth="0.4" />
            <line x1="3" y1="72.5" x2="97" y2="72.5" stroke="rgba(244,239,231,0.5)" strokeWidth="0.4" />
            <circle cx="50" cy="72.5" r="9" fill="none" stroke="rgba(244,239,231,0.5)" strokeWidth="0.4" />
            <circle cx="50" cy="72.5" r="0.8" fill="rgba(244,239,231,0.5)" />
            <rect x="28" y="3" width="44" height="14" fill="none" stroke="rgba(244,239,231,0.5)" strokeWidth="0.4" />
            <rect x="38" y="3" width="24" height="6" fill="none" stroke="rgba(244,239,231,0.5)" strokeWidth="0.4" />
            <rect x="28" y="128" width="44" height="14" fill="none" stroke="rgba(244,239,231,0.5)" strokeWidth="0.4" />
            <rect x="38" y="136" width="24" height="6" fill="none" stroke="rgba(244,239,231,0.5)" strokeWidth="0.4" />

            {slots.map((s) => {
              const player = xi[s.id];
              if (player) {
                return (
                  <g
                    key={s.id}
                    className="atxi-slot"
                    transform={`translate(${s.x},${s.y})`}
                    onClick={() => openSheet(s.id)}
                  >
                    <KitGlyph number={player.number} />
                    <text
                      className="atxi-name"
                      x="0"
                      y="14"
                      textAnchor="middle"
                      fontSize="3.8"
                    >
                      {player.name.toUpperCase()}
                    </text>
                  </g>
                );
              }
              return (
                <g
                  key={s.id}
                  className="atxi-slot"
                  transform={`translate(${s.x},${s.y})`}
                  onClick={() => openSheet(s.id)}
                >
                  <circle r="9" className="atxi-slot-empty" />
                  <text className="atxi-slot-plus" x="0" y="3" textAnchor="middle" fontSize="9" fontWeight="300">
                    +
                  </text>
                  <text className="atxi-role" x="0" y="16" textAnchor="middle" fontSize="3.8">
                    {s.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="atxi-progress">
          <div className="atxi-progress-row">
            <span className="atxi-progress-label">
              <span className="num">{filled}</span> / 11 placed
            </span>
            <span className="atxi-progress-pct">{pct}%</span>
          </div>
          <div className="atxi-progress-bar">
            <div className="atxi-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="atxi-actions">
          <button type="button" className="atxi-cta-ghost" onClick={reset}>
            Reset
          </button>
          <button type="button" className="atxi-cta" onClick={shareXI}>
            Share XI →
          </button>
        </div>
      </div>

      {/* Sheet + backdrop (fixed-position, real modal) */}
      <div
        className={`atxi-backdrop ${editingSlot ? 'open' : ''}`}
        onClick={closeSheet}
        aria-hidden="true"
      />
      <div className={`atxi-sheet ${editingSlot ? 'open' : ''}`} role="dialog" aria-modal="true">
        <div className="atxi-handle" />
        <div className="atxi-sheet-head">
          <div className="atxi-sheet-eye">
            {editingExists ? 'Edit player · ' : 'Add player · '}
            {editingSlotData?.label ?? ''}
          </div>
          <h3 className="atxi-sheet-title">
            {editingExists ? xi[editingSlot!].name : 'New slot'}
          </h3>
        </div>

        <div className="atxi-field">
          <label className="atxi-label" htmlFor="atxi-name">Player name</label>
          <input
            id="atxi-name"
            type="text"
            className="atxi-input"
            placeholder="e.g. Maradona"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            maxLength={40}
            autoFocus={!!editingSlot}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveSheet();
            }}
          />
        </div>

        <div className="atxi-field">
          <label className="atxi-label" htmlFor="atxi-number">Jersey number</label>
          <input
            id="atxi-number"
            type="number"
            inputMode="numeric"
            className="atxi-input atxi-input-num"
            placeholder="10"
            min={1}
            max={99}
            value={sheetNumber}
            onChange={(e) => setSheetNumber(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveSheet();
            }}
          />
        </div>

        <div className="atxi-sheet-actions">
          {editingExists && (
            <button type="button" className="atxi-cta-danger" onClick={removeSlot}>
              Remove
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button type="button" className="atxi-cta-ghost" onClick={closeSheet}>
            Cancel
          </button>
          <button type="button" className="atxi-cta" onClick={saveSheet}>
            Save
          </button>
        </div>
      </div>
    </>
  );
}

function KitGlyph({ number }: { number: string }) {
  const num = number != null && number !== '' ? number : '';
  return (
    <g transform="translate(0,0) scale(0.21)">
      <g transform="translate(-50,-52)">
        <path d="M 25 15 L 5 30 L 12 42 L 25 32 Z" fill="#0E0E0C" />
        <path d="M 75 15 L 95 30 L 88 42 L 75 32 Z" fill="#0E0E0C" />
        <path d="M 25 15 L 75 15 L 75 90 L 25 90 Z" fill="#0E0E0C" />
        <path d="M 25 15 L 75 15 L 75 90 L 25 90 Z" fill="none" stroke="rgba(244,239,231,0.40)" strokeWidth="0.7" />
        <path d="M 40 15 L 50 28 L 60 15" stroke="#D4A82A" strokeWidth="2.4" fill="none" />
        {num !== '' && (
          <text
            x="50"
            y="68"
            textAnchor="middle"
            fontWeight="900"
            fontSize="30"
            fill="#D4A82A"
            className="atxi-kit-num"
          >
            {num}
          </text>
        )}
      </g>
    </g>
  );
}

function Styles() {
  return <style dangerouslySetInnerHTML={{ __html: ATXI_CSS }} />;
}

const ATXI_CSS = `
  .atxi-page {
    max-width: 520px;
    margin: 0 auto;
    padding-bottom: 60px;
  }
  .atxi-chrome { padding: 18px 16px 4px; }
  .atxi-breadcrumb {
    display: inline-block;
    font-family: var(--font-mono), ui-monospace, monospace;
    font-size: 10px; font-weight: 700; letter-spacing: 0.16em;
    text-transform: uppercase; color: hsl(var(--ink) / 0.55);
    text-decoration: none; margin-bottom: 14px;
  }
  .atxi-breadcrumb:hover { color: hsl(var(--ink)); }
  .atxi-eyebrow {
    font-family: var(--font-mono), ui-monospace, monospace;
    font-size: 11px; font-weight: 700; letter-spacing: 0.20em;
    text-transform: uppercase; color: #D4A82A; margin-bottom: 6px;
  }
  .atxi-title {
    font-family: var(--font-sans), system-ui, sans-serif;
    font-weight: 900; font-size: 30px; line-height: 0.95;
    letter-spacing: -0.025em; margin: 0;
  }
  .atxi-title .accent { color: #D4A82A; font-style: italic; }
  .atxi-subtitle {
    font-family: var(--font-sans), system-ui, sans-serif;
    font-size: 13px; color: hsl(var(--ink) / 0.62);
    margin: 8px 0 0; line-height: 1.5; max-width: 420px;
  }

  .atxi-squad { padding: 14px 16px 0; }
  .atxi-input {
    width: 100%;
    padding: 11px 12px;
    border: 1px solid hsl(var(--ink) / 0.20);
    background: hsl(var(--bg));
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    color: hsl(var(--ink));
    outline: none;
    box-sizing: border-box;
    border-radius: 0;
  }
  .atxi-input:focus { border-color: #D4A82A; }
  .atxi-input-num { max-width: 110px; }

  .atxi-formations {
    display: flex; gap: 4px;
    padding: 12px 16px 0;
  }
  .atxi-pill {
    flex: 1; min-width: 0;
    font-family: var(--font-mono), ui-monospace, monospace;
    font-size: 11px; font-weight: 700; letter-spacing: 0.10em;
    text-transform: uppercase;
    padding: 9px 6px;
    border: 1px solid hsl(var(--ink) / 0.20);
    background: transparent;
    color: hsl(var(--ink) / 0.72);
    cursor: pointer;
    line-height: 1;
    text-align: center;
  }
  .atxi-pill:hover { border-color: hsl(var(--ink)); color: hsl(var(--ink)); }
  .atxi-pill.active {
    background: hsl(var(--ink));
    color: hsl(var(--bg));
    border-color: hsl(var(--ink));
  }

  .atxi-pitch-wrap {
    margin-top: 14px;
    width: 100%;
    aspect-ratio: 1 / 1.45;
    background: #1B4A2D;
    border-top: 2px solid hsl(var(--ink));
    border-bottom: 2px solid hsl(var(--ink));
    position: relative;
  }
  .atxi-pitch { width: 100%; height: 100%; display: block; }
  .atxi-slot { cursor: pointer; }
  .atxi-slot-empty {
    fill: rgba(244,239,231,0.06);
    stroke: rgba(244,239,231,0.65);
    stroke-width: 0.6;
    stroke-dasharray: 1.8 1.8;
    transition: fill 0.15s, stroke 0.15s;
  }
  .atxi-slot:hover .atxi-slot-empty,
  .atxi-slot:active .atxi-slot-empty {
    fill: rgba(212,168,42,0.20);
    stroke: #D4A82A;
  }
  .atxi-slot-plus { fill: rgba(244,239,231,0.78); pointer-events: none; }
  .atxi-role { fill: rgba(244,239,231,0.7); pointer-events: none; font-weight: 700; letter-spacing: 0.08em; }
  .atxi-name { fill: #F4EFE7; pointer-events: none; font-weight: 800; letter-spacing: -0.01em; }
  .atxi-kit-num { font-family: var(--font-sans), system-ui, sans-serif; }

  .atxi-progress { padding: 12px 16px 0; }
  .atxi-progress-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .atxi-progress-label {
    font-family: var(--font-mono), ui-monospace, monospace;
    font-size: 11px; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; color: hsl(var(--ink) / 0.55);
  }
  .atxi-progress-label .num {
    color: hsl(var(--ink));
    font-family: var(--font-sans), system-ui, sans-serif;
    font-weight: 900; font-size: 14px;
  }
  .atxi-progress-pct {
    font-family: var(--font-mono), ui-monospace, monospace;
    font-size: 11px; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; color: hsl(var(--ink) / 0.42);
  }
  .atxi-progress-bar {
    height: 4px; background: hsl(var(--ink) / 0.10);
    position: relative;
  }
  .atxi-progress-fill {
    position: absolute; top: 0; left: 0; height: 100%;
    background: hsl(var(--ink));
    transition: width 0.3s ease;
  }

  .atxi-actions {
    padding: 14px 16px 0;
    display: flex; gap: 8px;
  }
  .atxi-cta {
    background: hsl(var(--ink));
    color: #D4A82A;
    border: 1px solid hsl(var(--ink));
    padding: 12px 18px;
    font-family: var(--font-mono), ui-monospace, monospace;
    font-size: 11px; font-weight: 700; letter-spacing: 0.16em;
    text-transform: uppercase;
    cursor: pointer; line-height: 1;
    flex: 1.4;
  }
  .atxi-cta:hover { background: #D4A82A; color: hsl(var(--ink)); border-color: #D4A82A; }
  .atxi-cta-ghost {
    background: transparent;
    color: hsl(var(--ink));
    border: 1px solid hsl(var(--ink) / 0.30);
    padding: 12px 18px;
    font-family: var(--font-mono), ui-monospace, monospace;
    font-size: 11px; font-weight: 700; letter-spacing: 0.16em;
    text-transform: uppercase;
    cursor: pointer; line-height: 1;
    flex: 1;
  }
  .atxi-cta-ghost:hover { border-color: hsl(var(--ink)); background: hsl(var(--ink) / 0.04); }
  .atxi-cta-danger {
    background: transparent;
    color: hsl(var(--warn));
    border: 1px solid hsl(var(--warn) / 0.40);
    padding: 12px 18px;
    font-family: var(--font-mono), ui-monospace, monospace;
    font-size: 11px; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer; line-height: 1;
  }
  .atxi-cta-danger:hover { background: hsl(var(--warn)); color: #fff; }

  .atxi-backdrop {
    position: fixed; inset: 0;
    background: rgba(26, 26, 24, 0.55);
    z-index: 40;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
  }
  .atxi-backdrop.open { opacity: 1; pointer-events: auto; }
  .atxi-sheet {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%) translateY(100%);
    width: 100%;
    max-width: 520px;
    background: hsl(var(--bg));
    border-top: 2px solid hsl(var(--ink));
    padding: 18px 16px 24px;
    z-index: 50;
    transition: transform 0.32s cubic-bezier(0.34, 1.4, 0.64, 1);
    box-sizing: border-box;
  }
  .atxi-sheet.open { transform: translateX(-50%) translateY(0); }
  .atxi-handle {
    width: 36px; height: 4px;
    background: hsl(var(--ink) / 0.20);
    margin: 0 auto 14px;
    border-radius: 2px;
  }
  .atxi-sheet-head { margin-bottom: 16px; }
  .atxi-sheet-eye {
    font-family: var(--font-mono), ui-monospace, monospace;
    font-size: 11px; font-weight: 700; letter-spacing: 0.20em;
    text-transform: uppercase; color: #D4A82A;
  }
  .atxi-sheet-title {
    font-family: var(--font-sans), system-ui, sans-serif;
    font-weight: 900; font-size: 20px; line-height: 1;
    letter-spacing: -0.02em; margin: 4px 0 0;
  }
  .atxi-field { margin-bottom: 12px; }
  .atxi-field:last-of-type { margin-bottom: 18px; }
  .atxi-label {
    display: block;
    font-family: var(--font-mono), ui-monospace, monospace;
    font-size: 11px; font-weight: 700; letter-spacing: 0.16em;
    text-transform: uppercase; color: hsl(var(--ink) / 0.55);
    margin-bottom: 6px;
  }
  .atxi-sheet-actions {
    display: flex; gap: 8px; align-items: center;
    flex-wrap: wrap;
  }
  .atxi-sheet-actions .atxi-cta { flex: 0 0 auto; }
  .atxi-sheet-actions .atxi-cta-ghost { flex: 0 0 auto; }
`;
