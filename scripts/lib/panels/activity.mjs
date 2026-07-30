// Activity terrain. The contribution year drawn as stepped ground rather than
// the usual heat grid, so it reads like a training curve and still sits in the
// same landscape as scene.gif.

import { C, W, PAD, T } from '../theme.mjs';
import { doc, rect, plate, dottedRule, commas, compact } from '../svg.mjs';
import { text } from '../font.mjs';

const H = 224;
const HEAD = 30;
const COLS = 52;
// 9px columns leave a 41px gutter each side, which is what the scale labels
// need. At 10px they ran off the left edge of the panel.
const COL_W = 9;
const X0 = Math.round((W - COLS * COL_W) / 2);
// The plot starts at 78 rather than 64 so the top scale label and the peak
// flag both clear the caption above them.
const TOP = 78;
const BASE = 182;
const PLOT_H = BASE - TOP;

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function activity(stats) {
  const chars = ['0123456789', ',', '.', '-', '/', '%'];
  const weeks = Array.isArray(stats.weeks) ? stats.weeks.slice(-COLS) : [];
  const ok = stats.ok !== false && weeks.length > 0;
  const peak = ok ? Math.max(1, ...weeks.map((w) => w.total)) : 1;
  const body = [];

  body.push(plate(1, 1, W - 2, H - 2, { fill: C.white, stroke: C.ink, sw: 2 }));
  body.push(`<path d="M5 3H${W - 5}L${W - 3} 5V${HEAD}H3V5Z" fill="${C.ink}"/>`);
  chars.push('ACTIVITY TERRAIN');
  body.push(text('ACTIVITY TERRAIN', { x: 14, y: 9, scale: T.small, fill: C.white }));
  const peakLabel = ok ? `PEAK ${commas(peak)} / WEEK` : 'AWAITING FIRST SYNC';
  chars.push(peakLabel);
  body.push(text(peakLabel, { x: W - 14, y: 9, scale: T.small, fill: C.skyHaze, anchor: 'end' }));

  const caption = 'CONTRIBUTIONS PER WEEK, LAST 52 WEEKS';
  chars.push(caption);
  body.push(text(caption, { x: PAD, y: 42, scale: T.small, fill: C.inkFaint }));

  // Horizontal guides, labelled with the value they represent.
  [1, 0.5].forEach((f) => {
    const y = BASE - Math.round(PLOT_H * f);
    body.push(dottedRule(X0, y, COLS * COL_W, { fill: C.skyMist, on: 2, off: 4, h: 2 }));
    const lab = compact(Math.round(peak * f));
    chars.push(lab);
    body.push(text(lab, { x: X0 - 6, y: y - 7, scale: T.small, fill: C.inkFaint, anchor: 'end' }));
  });

  // Terrain columns, revealed left to right one week at a time.
  const terrain = [];
  let peakIdx = 0;
  weeks.forEach((wk, i) => {
    if (wk.total >= weeks[peakIdx].total) peakIdx = i;
    const h = wk.total > 0 ? Math.max(3, Math.round((wk.total / peak) * PLOT_H)) : 2;
    const x = X0 + i * COL_W;
    const y = BASE - h;
    terrain.push(rect(x, y + 3, COL_W, h - 3, C.skyLight));
    terrain.push(rect(x, y, COL_W, 3, C.skyDeep));
  });
  body.push(`<g clip-path="url(#reveal)">${terrain.join('')}</g>`);

  // Ground line, echoing the grass in scene.gif.
  body.push(rect(X0, BASE, COLS * COL_W, 3, C.grassDeep));
  body.push(rect(X0, BASE + 3, COLS * COL_W, 3, C.grass));

  // Peak flag.
  if (ok) {
    const px = X0 + peakIdx * COL_W + Math.floor(COL_W / 2) - 1;
    const ph = Math.max(3, Math.round((weeks[peakIdx].total / peak) * PLOT_H));
    body.push(rect(px, BASE - ph - 9, 2, 9, C.ink, 'class="fade" style="--d:1.9s"'));
    body.push(rect(px, BASE - ph - 13, 8, 5, C.grass, 'class="pop" style="--d:2s"'));
  }

  // Month ruler.
  let lastX = -99;
  let lastMonth = -1;
  weeks.forEach((wk, i) => {
    const d = new Date(wk.date + 'T00:00:00Z');
    const m = d.getUTCMonth();
    if (m === lastMonth) return;
    lastMonth = m;
    const x = X0 + i * COL_W;
    // A month is only ~39px wide here and a label is ~34px, so labelling
    // every month leaves them touching. Every other month reads cleanly.
    if (x - lastX < 62) return;
    lastX = x;
    chars.push(MONTHS[m]);
    body.push(rect(x, BASE + 8, 2, 4, C.inkFaint));
    body.push(text(MONTHS[m], { x, y: BASE + 16, scale: T.small, fill: C.inkFaint, cls: 'fade', style: `--d:${(1 + i * 0.01).toFixed(2)}s` }));
  });

  return doc({
    w: W,
    h: H,
    title: 'Contribution activity',
    chars,
    defs: `<clipPath id="reveal"><rect class="wipe" x="${X0}" y="0" width="${COLS * COL_W}" height="${H}"/></clipPath>`,
    css: `
.wipe{transform-box:fill-box;transform-origin:left center;animation:wipe 1.9s steps(${COLS},end) both;animation-delay:.2s}
@keyframes wipe{from{transform:scaleX(0)}to{transform:scaleX(1)}}`,
    body: body.join(''),
  });
}
