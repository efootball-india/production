type Slot = { id: string; label: string; x: number; y: number };
type Player = { name: string; number: string };

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
        '<g transform="scale(0.17)">',
          '<g transform="translate(-50,-52)">',
            '<path d="M 25 15 L 5 30 L 12 42 L 25 32 Z" fill="#0E0E0C"/>',
            '<path d="M 75 15 L 95 30 L 88 42 L 75 32 Z" fill="#0E0E0C"/>',
            '<path d="M 25 15 L 75 15 L 75 90 L 25 90 Z" fill="#0E0E0C"/>',
            '<path d="M 25 15 L 75 15 L 75 90 L 25 90 Z" fill="none" stroke="rgba(244,239,231,0.40)" stroke-width="0.7"/>',
            '<path d="M 40 15 L 50 28 L 60 15" stroke="#D4A82A" stroke-width="2.4" fill="none"/>',
            numText,
          '</g>',
        '</g>',
        '<text x="0" y="11" text-anchor="middle" font-size="3.4" font-weight="800" fill="#F4EFE7" font-family="Archivo, system-ui, sans-serif">' +
          escapeXml(p.name.toUpperCase()) +
        '</text>',
      '</g>',
    ].join('');
  }
  return [
    '<g transform="translate(' + s.x + ',' + s.y + ')">',
      '<circle r="6.5" fill="rgba(244,239,231,0.06)" stroke="rgba(244,239,231,0.5)" stroke-width="0.5" stroke-dasharray="1.5 1.5"/>',
      '<text x="0" y="13" text-anchor="middle" font-size="3.4" font-weight="700" fill="rgba(244,239,231,0.55)" font-family="Archivo, system-ui, sans-serif">' +
        escapeXml(s.label) +
      '</text>',
    '</g>',
  ].join('');
}

export function buildExportSvg(
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
