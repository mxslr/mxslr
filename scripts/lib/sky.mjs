// Sky, dithering and cloud pixels. Shared by the hero and the footer so both
// ends of the page sit in the same weather as scene.gif.

import { C } from './theme.mjs';
import { rect } from './svg.mjs';

// Ordered 4x4 Bayer matrix. Using a fixed matrix instead of randomness keeps
// generated output byte-identical between runs, so the daily workflow only
// commits when the data actually changed.
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/**
 * Dither one colour into another over `h` pixels, in `bs`-sized blocks.
 * This is how the white type area melts into the sky without a gradient.
 *
 * Lit blocks are merged into horizontal runs and emitted as one <path>. A
 * per-block <rect> costs roughly three times the bytes for identical pixels,
 * and this band alone would otherwise dominate the file.
 */
export function ditherBand(x, y, w, h, from, to, bs = 2) {
  const cols = Math.ceil(w / bs);
  const rows = Math.ceil(h / bs);
  const d = [];
  for (let r = 0; r < rows; r++) {
    const t = (r + 1) / (rows + 1);
    const by = y + r * bs;
    const bh = Math.min(bs, y + h - by);
    if (bh <= 0) break;
    let run = -1;
    for (let cIdx = 0; cIdx <= cols; cIdx++) {
      const lit = cIdx < cols && t > (BAYER[r % 4][cIdx % 4] + 0.5) / 16;
      if (lit && run < 0) run = cIdx;
      if (!lit && run >= 0) {
        const bx = x + run * bs;
        const bw = Math.min((cIdx - run) * bs, x + w - bx);
        d.push(`M${bx} ${by}h${bw}v${bh}h-${bw}z`);
        run = -1;
      }
    }
  }
  return rect(x, y, w, h, from) + (d.length ? `<path d="${d.join('')}" fill="${to}"/>` : '');
}

/**
 * Sky built as solid bands joined by short dithered seams, ending on a flat
 * strip of the exact blue scene.gif opens on. Dithering only the seams keeps
 * the classic pixel-sky look without paying for a full-height dither.
 */
export function skyStack(x, y, w, h, { seam = 6, foot = 6 } = {}) {
  const ramp = [C.skyMist, C.skyPale, C.skyHaze, C.skyLight, C.skyMid, C.skyDeep];
  const steps = ramp.length - 1;
  const usable = h - foot;
  const seg = Math.floor(usable / steps);
  const out = [];
  let cy = y;
  for (let i = 0; i < steps; i++) {
    const segH = i === steps - 1 ? y + usable - cy : seg;
    const tH = Math.min(seam, segH);
    const sH = segH - tH;
    if (sH > 0) out.push(rect(x, cy, w, sH, ramp[i]));
    out.push(ditherBand(x, cy + sH, w, tH, ramp[i], ramp[i + 1]));
    cy += segH;
  }
  // Flat foot so the boundary with scene.gif is a single exact colour.
  out.push(rect(x, cy, w, y + h - cy, ramp[steps]));
  return out.join('');
}

const CLOUDS = [
  [
    '....####........',
    '..##########....',
    '.##############.',
    '################',
    '.--------------.',
  ],
  [
    '...####....',
    '.#########.',
    '###########',
    '.---------.',
  ],
  [
    '......######..........',
    '...##############.....',
    '.####################.',
    '######################',
    '.--------------------.',
  ],
];

function cloudMarkup(rows, px, body, shade) {
  const out = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    let i = 0;
    while (i < row.length) {
      const ch = row[i];
      if (ch === '.') { i++; continue; }
      let len = 0;
      while (i + len < row.length && row[i + len] === ch) len++;
      out.push(rect(i * px, r * px, len * px, px, ch === '#' ? body : shade));
      i += len;
    }
  }
  return out.join('');
}

/**
 * Drifting cloud layer. Three depths at different speeds and scales read as
 * parallax without any script.
 */
export function clouds(w, layers) {
  const out = [];
  layers.forEach((L) => {
    const rows = CLOUDS[L.shape % CLOUDS.length];
    const cw = rows[0].length * L.px;
    out.push(
      `<g class="drift" style="--x0:${-cw}px;--x1:${w + cw}px;--dur:${L.dur}s;--d:${(-L.dur * L.phase).toFixed(2)}s">` +
        `<g transform="translate(0 ${L.y})" opacity="${L.opacity ?? 1}">` +
          cloudMarkup(rows, L.px, L.body || C.white, L.shade || C.skyPale) +
        `</g>` +
      `</g>`,
    );
  });
  return out.join('');
}

export const SKY_CSS = `
.drift{animation:drift var(--dur,40s) linear infinite;animation-delay:var(--d,0s)}
@keyframes drift{from{transform:translateX(var(--x0))}to{transform:translateX(var(--x1))}}`;
