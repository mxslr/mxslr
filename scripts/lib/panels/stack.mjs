// Stack panel. Tiles flow and wrap on their own measured width, so long names
// stay on one line instead of being abbreviated to fit a rigid grid.
//
// Two tile styles carry meaning: filled tiles are tools, outlined tiles are
// practices. Same panel, different kind of claim.

import { C, W, PAD, INNER, T } from '../theme.mjs';
import { doc, rect, plate } from '../svg.mjs';
import { text, textWidth } from '../font.mjs';

const HEAD = 30;
const TILE_H = 26;
const GAP = 6;
const PADX = 10;

function tile(x, y, label, style, delay) {
  const w = textWidth(label, T.small) + PADX * 2;
  const solid = style !== 'outline';
  const parts = [];
  if (solid) {
    parts.push(rect(x, y, w, TILE_H, C.skyMist));
    parts.push(rect(x, y + TILE_H - 3, w, 3, C.skyDeep));
    parts.push(text(label, { x: x + PADX, y: y + 6, scale: T.small, fill: C.ink }));
  } else {
    parts.push(rect(x, y, w, TILE_H, C.white));
    parts.push(rect(x, y, w, 2, C.line));
    parts.push(rect(x, y + TILE_H - 2, w, 2, C.line));
    parts.push(rect(x, y, 2, TILE_H, C.line));
    parts.push(rect(x + w - 2, y, 2, TILE_H, C.line));
    parts.push(text(label, { x: x + PADX, y: y + 6, scale: T.small, fill: C.inkSoft }));
  }
  return {
    w,
    markup: `<g class="rise" style="--d:${delay.toFixed(2)}s">${parts.join('')}</g>`,
  };
}

export function stack(profile) {
  const chars = ['0123456789', '.', '/', '-', ',', '+'];
  const body = [];
  let y = HEAD + 16;
  let seq = 0;
  let count = 0;

  for (const group of profile.stack) {
    chars.push(group.title);
    body.push(rect(PAD, y + 2, 3, 10, C.skyDeep));
    body.push(text(group.title, { x: PAD + 9, y, scale: T.small, fill: C.inkSoft, cls: 'fade', style: `--d:${(seq * 0.02).toFixed(2)}s` }));
    y += 22;

    let x = PAD;
    for (const item of group.items) {
      chars.push(item);
      count++;
      const probe = textWidth(item, T.small) + PADX * 2;
      if (x + probe > PAD + INNER) {
        x = PAD;
        y += TILE_H + GAP;
      }
      const t = tile(x, y, item, group.style, 0.1 + seq * 0.025);
      body.push(t.markup);
      x += t.w + GAP;
      seq++;
    }
    y += TILE_H + 18;
  }

  const H = y + 2;
  const head = [];
  head.push(plate(1, 1, W - 2, H - 2, { fill: C.white, stroke: C.ink, sw: 2 }));
  head.push(`<path d="M5 3H${W - 5}L${W - 3} 5V${HEAD}H3V5Z" fill="${C.ink}"/>`);
  chars.push('STACK');
  head.push(text('STACK', { x: 14, y: 9, scale: T.small, fill: C.white }));
  const tally = `${count} ENTRIES`;
  chars.push(tally);
  head.push(text(tally, { x: W - 14, y: 9, scale: T.small, fill: C.skyHaze, anchor: 'end' }));

  return doc({ w: W, h: H, title: 'Skills and tech stack', chars, body: head.join('') + body.join('') });
}
