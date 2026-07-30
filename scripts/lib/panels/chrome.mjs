// Supporting furniture: the about plate, the link buttons and the closing
// ground strip that bookends the scene at the top of the page.

import { C, W, PAD, INNER, T } from '../theme.mjs';
import { doc, rect, plate } from '../svg.mjs';
import { text, wrap } from '../font.mjs';
import { ditherBand, clouds, SKY_CSS } from '../sky.mjs';

// ---------------------------------------------------------------- about ----

export function about(profile) {
  const chars = ['.', ',', '-', '/'];
  const lines = wrap(profile.summary.join(' '), INNER - 40, T.small);
  const H = 30 + lines.length * 20 + 22;
  const body = [];

  body.push(plate(1, 1, W - 2, H - 2, { fill: C.skyMist, stroke: C.ink, sw: 2 }));
  body.push(rect(3, 5, 5, H - 10, C.skyDeep));

  chars.push('PROFILE');
  body.push(text('PROFILE', { x: PAD + 8, y: 16, scale: T.small, fill: C.inkFaint, cls: 'fade' }));

  lines.forEach((l, i) => {
    chars.push(l);
    body.push(text(l, { x: PAD + 8, y: 40 + i * 20, scale: T.small, fill: C.ink, cls: 'rise', style: `--d:${(0.1 + i * 0.08).toFixed(2)}s` }));
  });

  return doc({ w: W, h: H, title: 'About', chars, body: body.join('') });
}

// --------------------------------------------------------------- button ----

const BTN_W = 172;
const BTN_H = 44;

export function button(label) {
  const chars = [label];
  const body = [];

  // Keycap: a hard shadow underneath, face on top.
  body.push(rect(3, 7, BTN_W - 6, BTN_H - 8, C.ink));
  body.push(plate(3, 3, BTN_W - 6, BTN_H - 10, { fill: C.skyDeep, stroke: C.ink, sw: 2, c: 3 }));
  body.push(text(label, { x: BTN_W / 2, y: 14, scale: T.small, fill: C.white, anchor: 'middle' }));

  // A single highlight sweeping across the face.
  body.push(
    `<g clip-path="url(#btn)">` +
      `<g class="shine"><path d="M-30 0h16l-22 40h-16z" fill="${C.white}" opacity="0.28"/></g>` +
    `</g>`,
  );

  return doc({
    w: BTN_W,
    h: BTN_H,
    title: label,
    chars,
    defs: `<clipPath id="btn"><rect x="5" y="5" width="${BTN_W - 10}" height="${BTN_H - 14}"/></clipPath>`,
    css: `
.shine{animation:shine 4.5s ease-in-out infinite}
@keyframes shine{0%{transform:translateX(0)}45%{transform:translateX(${BTN_W + 60}px)}100%{transform:translateX(${BTN_W + 60}px)}}`,
    body: body.join(''),
  });
}

// --------------------------------------------------------------- footer ----

export function footer() {
  const H = 104;
  const GROUND = 62;
  const body = [];

  body.push(rect(0, 0, W, GROUND, C.white));
  body.push(`<g clip-path="url(#fsky)">`);
  body.push(ditherBand(0, 10, W, 26, C.white, C.skyMist));
  body.push(ditherBand(0, 36, W, GROUND - 36, C.skyMist, C.skyLight));
  body.push(clouds(W, [
    { shape: 1, px: 2, y: 30, dur: 68, phase: 0.2, opacity: 0.85 },
    { shape: 0, px: 2, y: 42, dur: 46, phase: 0.66 },
  ]));
  body.push(`</g>`);

  // Ground. scene.gif runs teal at the horizon and green below it, so the
  // bands go in that order rather than the reverse.
  body.push(rect(0, GROUND, W, 3, C.grassLite));
  body.push(rect(0, GROUND + 3, W, 8, C.grassDeep));
  body.push(rect(0, GROUND + 11, W, H - GROUND - 11, C.grass));

  // Sparse tufts and petals so the band is not a flat slab.
  const seedRow = [11, 47, 83, 129, 168, 214, 251, 296, 334, 379, 418, 462, 503, 531];
  seedRow.forEach((x, i) => {
    const y = GROUND + 15 + (i % 3) * 7;
    body.push(rect(x, y, 2, 2, i % 2 ? C.grassLite : C.white));
    body.push(rect(x + 4, y + 5, 2, 2, C.grassDeep));
  });

  return doc({
    w: W,
    h: H,
    title: 'Footer',
    chars: [],
    defs: `<clipPath id="fsky"><rect x="0" y="0" width="${W}" height="${GROUND}"/></clipPath>`,
    css: SKY_CSS,
    body: body.join(''),
  });
}
