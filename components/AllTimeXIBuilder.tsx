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

function escapeXml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return c;
    }
  });
}

function renderSlotXml(s: Slot, p: Player | undefined): string {
  if (p) {
    const numText =
      p.number !== ''
        ? '<text x="50" y="68" text-anchor="middle" font-weight="900" font-size="30" fill="#D4A82A" font-family="Archivo, system-ui, sans-serif">' +
          escapeXml(p.number) +
          '</text>'
        : '';
    return [
      '<g transform="translate(' + s.x + ',' + s.y + ')">',
        '<g transform="scale(0.15)">',
          '<g transform="translate(-50,-52)">',
            '<path d="M 25 15 L 5 30 L 12 42 L 25 32 Z" fill="#0E0E0C"/>',
            '<path d="M 75 15 L 95 30 L 88 42 L 75 32 Z" fill="#0E0E0C"/>',
            '<path d="M 25 15 L 75 15 L 75 90 L 25 90 Z" fill="#0E0E0C"/>',
            '<path d="M 25 15 L 75 15 L 75 90 L 25 90 Z" fill="none" stroke="rgba(244,239,231,0.40)" stroke-width="0.7"/>',
            '<path d="M 40 15 L 50 28 L 60 15" stroke="#D4A82A" stroke-width="2.4" fill="none"/>',
            numText,
          '</g>',
        '</g>',
        '<text x="0" y="10" text-anchor="middle" font-size="3.2" font-weight="800" fill="#F4EFE7" font-family="Archivo, system-ui, sans-serif">' +
          escapeXml(p.name.toUpperCase()) +
        '</text>',
      '</g>',
    ].join('');
  }
  return [
    '<g transform="translate(' + s.x + ',' + s.y + ')">',
      '<circle r="6" fill="rgba(244,239,231,0.06)" stroke="rgba(244,239,231,0.5)" stroke-width="0.5" stroke-dasharray="1.5 1.5"/>',
      '<text x="0" y="11" text-anchor="middle" font-size="3.2" font-weight="700" fill="rgba(244,239,231,0.55)" font-family="Archivo, system-ui, sans-serif">' +
        escapeXml(s.label) +
      '</text>',
    '</g>',
  ].join('');
}

function buildExportSvg(
  squadName: string,
  formation: string,
  slots: Slot[],
  xi: Record<string, Player>
): string {
  const slotsXml = slots.map((s) => renderSlotXml(s, xi[s.id])).join('');
  const safeSquad = escapeXml(squadName);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">',
      '<rect x="0" y="0" width="1080" height="200" fill="#F4EFE7"/>',
      '<text x="60" y="84" font-size="20" font-weight="700" letter-spacing="4" fill="#D4A82A" font-family="JetBrains Mono, ui-monospace, monospace">★ ALL-TIME XI &#183; ' + escapeXml(formation) + '</text>',
      '<text x="60" y="160" font-size="64" font-weight="900" letter-spacing="-1.5" fill="#1A1A18" font-family="Archivo, system-ui, sans-serif">' + safeSquad + '<tspan fill="#D4A82A" font-style="italic">.</tspan></text>',
      '<g transform="translate(0, 200) scale(10.8)">',
        '<rect x="0" y="0" width="100" height="145" fill="#1B4A2D"/>',
        '<rect x="0" y="0" width="100" height="14.5" fill="#1F5230"/>',
        '<rect x="0" y="29" width="100" height="14.5" fill="#1F5230"/>',
        '<rect x="0" y="58" width="100" height="14.5" fill="#1F5230"/>',
        '<rect x="0" y="87" width="100" height="14.5" fill="#1F5230"/>',
        '<rect x="0" y="116" width="100" height="14.5" fill="#1F5230"/>',
        '<rect x="3" y="3" width="94" height="139" fill="none" stroke="rgba(244,239,231,0.5)" stroke-width="0.4"/>',
        '<line x1="3" y1="72.5" x2="97" y2="72.5" stroke="rgba(244,239,231,0.5)" stroke-width="0.4"/>',
        '<circle cx="50" cy="72.5" r="9" fill="none" stroke="rgba(244,239,231,0.5)" stroke-width="0.4"/>',
        '<circle cx="50" cy="72.5" r="0.8" fill="rgba(244,239,231,0.5)"/>',
        '<rect x="28" y="3" width="44" height="14" fill="none" stroke="rgba(244,239,231,0.5)" stroke-width="0.4"/>',
        '<rect x="38" y="3" width="24" height="6" fill="none" stroke="rgba(244,239,231,0.5)" stroke-width="0.4"/>',
        '<rect x="28" y="128" width="44" height="14" fill="none" stroke="rgba(244,239,231,0.5)" stroke-width="0.4"/>',
        '<rect x="38" y="136" width="24" height="6" fill="none" stroke="rgba(244,239,231,0.5)" stroke-width="0.4"/>',
        slotsXml,
      '</g>',
      '<rect x="0" y="1768" width="1080" height="152" fill="#1A1A18"/>',
      '<text x="60" y="1832" font-size="22" font-weight="700" letter-spacing="6" fill="#D4A82A" font-family="JetBrains Mono, ui-monospace, monospace">EFTBL.IN</text>',
      '<text x="60" y="1880" font-size="22" font-weight="500" fill="#F4EFE7" font-family="Archivo, system-ui, sans-serif">Build your own all-time XI &#8594;</text>',
    '</svg>',
  ].join('');
}

export default function AllTimeXIBuilder() {
  const [formation, setFormation] = useState<FormationName>('4-3-3');
  const [squadName, setSquadName] = useState('Greatest XI of all time');
  const [xi, setXi] = useState<Record<string, Player>>({});
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [sheetName, setSheetName] = useState('');
  const [sheetNumber, setSheetNumber] = useState('');
  const [isExporting, setIsExporting] = useState(false);

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

  useEffect(() => {
    if (editingSlot) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [editingSlot]);

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

  async function shareXI() {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const slotsForExport = FORMATIONS[formation];
      const svgString = buildExportSvg(squadName || 'My All-Time XI', formation, slotsForExport, xi);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      const loaded = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('SVG load failed'));
      });
      img.src = svgUrl;
      await loaded;

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');
      ctx.fillStyle = '#F4EFE7';
      ctx.fillRect(0, 0, 1080, 1920);
      ctx.drawImage(img, 0, 0, 1080, 1920);
      URL.revokeObjectURL(svgUrl);

      await new Promise<void>((resolve, reject) => {
        canvas.toBlob((pngBlob) => {
          if (!pngBlob) {
            reject(new Error('PNG generation failed'));
            return;
          }
          const pngUrl = URL.createObjectURL(pngBlob);
          const a = document.createElement('a');
          a.href = pngUrl;
          const safe =
            (squadName || 'all-time-xi')
              .replace(/[^a-z0-9]+/gi, '-')
              .toLowerCase()
              .replace(/^-+|-+$/g, '')
              .slice(0, 40) || 'all-time-xi';
          a.download = safe + '.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(pngUrl), 2000);
          resolve();
        }, 'image/png');
      });
    } catch (e) {
      console.error(e);
      alert('Could not generate image. Try screenshotting your squad instead.');
    } finally {
      setIsExporting(false);
    }
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
                      y="10"
                      textAnchor="middle"
                      fontSize="3.2"
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
                  <circle r="6" className="atxi-slot-empty" />
                  <text className="atxi-slot-plus" x="0" y="2" textAnchor="middle" fontSize="6" fontWeight="300">
                    +
                  </text>
                  <text className="atxi-role" x="0" y="11" textAnchor="middle" fontSize="3.2">
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
          <button type="button" className="atxi-cta" onClick={shareXI} disabled={isExporting}>
            {isExporting ? 'Generating…' : 'Share XI →'}
          </button>
        </div>
      </div>

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
    <g transform="translate(0,0) scale(0.15)">
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
  .atxi-cta:disabled { opacity: 0.6; cursor: wait; }
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
