// Shared SVG primitives. Everything renders on an integer pixel grid with
// shape-rendering="crispEdges" so nothing is ever anti-aliased into mush.

import { C, CORNER } from './theme.mjs';
import { glyphDefs, charsOf, digitUse, DIGIT_CELL, GLYPH_H, TRACKING, glyphWidth } from './font.mjs';

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]
  ));
}

export function commas(n) {
  return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 12345 -> "12.3K", 4200000 -> "4.2M". Used where space is tight. */
export function compact(n) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (Math.abs(v) >= 1e4) return (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return commas(v);
}

/**
 * Pixel plate: a rectangle with cut corners, the standard chrome for every
 * panel in this system.
 */
export function plate(x, y, w, h, {
  fill = C.white, stroke = C.ink, sw = 2, c = CORNER, cls, extra = '',
} = {}) {
  const d = [
    `M${x + c} ${y}`, `H${x + w - c}`, `L${x + w} ${y + c}`,
    `V${y + h - c}`, `L${x + w - c} ${y + h}`, `H${x + c}`,
    `L${x} ${y + h - c}`, `V${y + c}`, 'Z',
  ].join('');
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${cls ? ` class="${cls}"` : ''} ${extra}/>`;
}

/** Flat rectangle, no chrome. */
export function rect(x, y, w, h, fill, extra = '') {
  return `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${Math.max(0, h)}" fill="${fill}" ${extra}/>`;
}

/** A dashed pixel rule, drawn as discrete blocks rather than a stroke-dash. */
export function dottedRule(x, y, w, { fill = C.line, on = 2, off = 2, h = 2 } = {}) {
  const out = [];
  for (let i = 0; i < w; i += on + off) out.push(rect(x + i, y, Math.min(on, w - i), h, fill));
  return out.join('');
}

/**
 * Odometer digit column. The strip runs two full 0-9 cycles before the target
 * digit and slides upward to land on it, so numbers spin into place like a
 * mechanical counter. Columns are staggered so the number settles left to
 * right rather than all at once.
 */
export function odometer(value, { x, y, scale = 6, fill = C.ink, gap = 2, baseDelay = 0.15 } = {}) {
  const chars = String(value).split('');
  const cellH = GLYPH_H + gap;              // glyph units
  const stripH = GLYPH_H * scale;
  const parts = [];
  const clips = [];
  let cursor = 0;
  let col = 0;

  for (const ch of chars) {
    if (!/[0-9]/.test(ch)) {
      // Separators sit still; only digits spin.
      parts.push(`<g transform="translate(${x + cursor * scale} ${y}) scale(${scale})" fill="${fill}"><use href="#g${ch.codePointAt(0).toString(16)}" x="0"/></g>`);
      cursor += glyphWidth(ch) + TRACKING;
      continue;
    }
    const id = `od${col}-${Math.round(x)}-${Math.round(y)}`;
    const target = Number(ch);
    const cycles = 2;                       // full spins before landing
    const landIndex = cycles * 10 + target;
    const ty = -(landIndex * cellH * scale);

    const strip = [];
    for (let i = 0; i <= landIndex; i++) {
      strip.push(`<g transform="translate(0 ${i * cellH})">${digitUse(i % 10)}</g>`);
    }

    clips.push(`<clipPath id="${id}"><rect x="0" y="0" width="${DIGIT_CELL * scale}" height="${stripH}"/></clipPath>`);
    parts.push(
      `<g transform="translate(${x + cursor * scale} ${y})" clip-path="url(#${id})">` +
        `<g class="odo" style="--ty:${ty}px;--d:${(baseDelay + col * 0.09).toFixed(3)}s" fill="${fill}">` +
          `<g transform="scale(${scale})">${strip.join('')}</g>` +
        `</g>` +
      `</g>`,
    );
    cursor += DIGIT_CELL + TRACKING;
    col++;
  }
  return { markup: parts.join(''), defs: clips.join(''), width: cursor * scale };
}

/** Shared keyframes. Kept in one place so timings stay consistent. */
export const BASE_CSS = `
.grow{transform-box:fill-box;transform-origin:left center;animation:grow .85s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--d,0s)}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.pop{transform-box:fill-box;transform-origin:center;animation:pop .38s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--d,0s)}
@keyframes pop{0%{opacity:0;transform:scale(.4)}60%{opacity:1;transform:scale(1.12)}100%{opacity:1;transform:scale(1)}}
.rise{animation:rise .5s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--d,0s)}
@keyframes rise{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.fade{animation:fade .6s ease both;animation-delay:var(--d,0s)}
@keyframes fade{from{opacity:0}to{opacity:1}}
.odo{animation:odo 1.5s cubic-bezier(.16,1,.3,1) both;animation-delay:var(--d,0s)}
@keyframes odo{from{transform:translateY(0)}to{transform:translateY(var(--ty))}}
.blink{animation:blink 1s steps(1,end) infinite}
@keyframes blink{0%,50%{opacity:1}50.01%,100%{opacity:0}}
.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 1.8s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.72)}}
`;

/** CRT sweep used on the telemetry panel. */
export function scanCss(h) {
  return `
.scan{animation:scan 5.5s linear infinite}
@keyframes scan{from{transform:translateY(-14px)}to{transform:translateY(${h + 14}px)}}`;
}

/**
 * Verification build. Set PROFILE_STATIC=1 to freeze every animation at its
 * settled state so a headless screenshot shows what a reader ends up seeing
 * rather than the first frame.
 */
const SETTLE_CSS = `
*{animation:none !important}
.rise,.fade,.pop{opacity:1 !important;transform:none !important}
.grow{transform:none !important}
.wipe{transform:none !important}
.odo{transform:translateY(var(--ty)) !important}
.blink{opacity:1 !important}
[class^="type"]{transform:scaleX(0) !important}
.type0{transform:scaleX(1) !important}
`;

/**
 * Assemble a complete document. Pass every string that will be typeset via
 * `chars` so only the glyphs actually used get embedded.
 */
export function doc({ w, h, body, css = '', defs = '', chars, bg = 'none', title = '' }) {
  if (process.env.PROFILE_STATIC) css += SETTLE_CSS;
  const glyphs = glyphDefs(charsOf(...(chars || [])));
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" ` +
    `shape-rendering="crispEdges" text-rendering="geometricPrecision">` +
    (title ? `<title>${esc(title)}</title>` : '') +
    `<defs>${glyphs}${defs}</defs>` +
    `<style>${BASE_CSS}${css}</style>` +
    (bg === 'none' ? '' : rect(0, 0, w, h, bg)) +
    body +
    `</svg>`;
}
