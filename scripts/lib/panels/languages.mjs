// Language distribution. Measured in bytes because that is the only unit the
// GitHub API exposes for languages; the caption says so rather than dressing
// bytes up as lines.

import { C, W, PAD, INNER, T, RAMP } from '../theme.mjs';
import { doc, rect, plate, commas } from '../svg.mjs';
import { text, textWidth } from '../font.mjs';

const H = 302;
const HEAD = 30;
const ROWS = 8;

export function languages(stats) {
  const chars = ['0123456789', '.', '%', ',', '-', '/', '+'];
  const ok = stats.ok !== false && Array.isArray(stats.languages) && stats.languages.length > 0;
  const list = ok ? stats.languages.slice(0, ROWS) : [];
  const body = [];

  body.push(plate(1, 1, W - 2, H - 2, { fill: C.white, stroke: C.ink, sw: 2 }));
  body.push(`<path d="M5 3H${W - 5}L${W - 3} 5V${HEAD}H3V5Z" fill="${C.ink}"/>`);
  chars.push('LANGUAGES');
  body.push(text('LANGUAGES', { x: 14, y: 9, scale: T.small, fill: C.white }));
  const totalLabel = ok ? `${commas(Math.round(stats.languageBytes / 1024))} KB` : 'NO DATA';
  chars.push(totalLabel, 'KB');
  body.push(text(totalLabel, { x: W - 14, y: 9, scale: T.small, fill: C.skyHaze, anchor: 'end' }));

  const caption = 'CODE VOLUME IN BYTES, OWNED REPOSITORIES';
  chars.push(caption);
  body.push(text(caption, { x: PAD, y: 42, scale: T.small, fill: C.inkFaint }));

  // Full-width spectrum: one segment per language, laid end to end.
  body.push(rect(PAD, 64, INNER, 14, C.line));
  let cursor = PAD;
  list.forEach((l, i) => {
    const seg = Math.max(2, Math.round((l.pct / 100) * INNER));
    const w = Math.min(seg, PAD + INNER - cursor);
    if (w > 0) {
      body.push(rect(cursor, 64, w, 14, RAMP[i % RAMP.length],
        `class="grow" style="--d:${(0.15 + i * 0.07).toFixed(2)}s"`));
    }
    cursor += w;
  });

  // Rows. The name column is measured rather than fixed, because entries like
  // "Jupyter Notebook" are wide enough to run into a hard-coded bar position.
  const rowY = 100;
  const rowH = 24;
  const PCT_COL = 56;
  const names = list.map((l) => String(l.name).toUpperCase());
  const nameW = names.length ? Math.max(...names.map((s) => textWidth(s, T.small))) : 0;
  const barX = Math.min(300, Math.max(186, PAD + 18 + nameW + 14));
  const barW = W - PAD - PCT_COL - barX;
  const maxPct = list.length ? Math.max(...list.map((l) => l.pct)) : 1;

  list.forEach((l, i) => {
    const y = rowY + i * rowH;
    const d = (0.3 + i * 0.06).toFixed(2);
    const name = names[i];
    const pct = `${l.pct.toFixed(1)}%`;
    chars.push(name, pct);
    body.push(rect(PAD, y + 2, 10, 10, RAMP[i % RAMP.length], `class="pop" style="--d:${d}s"`));
    body.push(text(name, { x: PAD + 18, y, scale: T.small, fill: C.ink, cls: 'rise', style: `--d:${d}s` }));
    body.push(rect(barX, y + 3, barW, 8, C.skyMist));
    body.push(rect(barX, y + 3, Math.max(3, Math.round((l.pct / maxPct) * barW)), 8,
      RAMP[i % RAMP.length], `class="grow" style="--d:${(Number(d) + 0.1).toFixed(2)}s"`));
    body.push(text(pct, { x: W - PAD, y, scale: T.small, fill: C.inkSoft, anchor: 'end', cls: 'fade', style: `--d:${(Number(d) + 0.2).toFixed(2)}s` }));
  });

  if (!list.length) {
    // Distinguish "not collected yet" from "collected, nothing to report".
    const msg = stats.ok === false ? 'AWAITING FIRST SYNC' : 'NO LANGUAGE DATA';
    chars.push(msg);
    body.push(text(msg, { x: W / 2, y: 150, scale: T.small, fill: C.inkFaint, anchor: 'middle' }));
  }

  return doc({ w: W, h: H, title: 'Language distribution', chars, body: body.join('') });
}
