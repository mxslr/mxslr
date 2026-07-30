// A hand-authored variable-width 5x7 bitmap font.
// Every glyph is 7 rows tall. Width varies per glyph so text sets tightly
// instead of looking like a fixed-pitch terminal dump.
//
// Glyphs are emitted once into <defs> and referenced with <use>, which keeps
// the generated SVGs small even though every character is real pixel geometry.

const G = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  J: ['..##', '...#', '...#', '...#', '...#', '#..#', '.##.'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],

  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#...#', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '#...#', '.###.'],

  ' ': ['...', '...', '...', '...', '...', '...', '...'],
  '.': ['.', '.', '.', '.', '.', '.', '#'],
  ',': ['..', '..', '..', '..', '.#', '.#', '#.'],
  ':': ['.', '.', '#', '.', '.', '#', '.'],
  ';': ['..', '..', '.#', '..', '..', '.#', '#.'],
  '-': ['...', '...', '...', '###', '...', '...', '...'],
  '_': ['#####', '.....', '.....', '.....', '.....', '.....', '.....'],
  '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  '\\': ['#....', '#....', '.#...', '..#..', '...#.', '....#', '....#'],
  '(': ['.#', '#.', '#.', '#.', '#.', '#.', '.#'],
  ')': ['#.', '.#', '.#', '.#', '.#', '.#', '#.'],
  '[': ['##', '#.', '#.', '#.', '#.', '#.', '##'],
  ']': ['##', '.#', '.#', '.#', '.#', '.#', '##'],
  '<': ['..#', '.#.', '#..', '#..', '#..', '.#.', '..#'],
  '>': ['#..', '.#.', '..#', '..#', '..#', '.#.', '#..'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '=': ['....', '....', '####', '....', '####', '....', '....'],
  '@': ['.###.', '#...#', '#.###', '#.#.#', '#.###', '#....', '.###.'],
  '#': ['.#.#.', '.#.#.', '#####', '.#.#.', '#####', '.#.#.', '.#.#.'],
  '%': ['##..#', '##.#.', '...#.', '..#..', '.#...', '#.##.', '#.##.'],
  '&': ['.##..', '#..#.', '#..#.', '.##..', '#.#.#', '#..#.', '.##.#'],
  '*': ['.....', '#.#.#', '.###.', '#####', '.###.', '#.#.#', '.....'],
  "'": ['#', '#', '.', '.', '.', '.', '.'],
  '"': ['#.#', '#.#', '...', '...', '...', '...', '...'],
  '!': ['#', '#', '#', '#', '#', '.', '#'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '|': ['#', '#', '#', '#', '#', '#', '#'],
};

export const GLYPH_H = 7;
/** Blank columns inserted between two glyphs. */
export const TRACKING = 1;

const FALLBACK = '?';

function rows(ch) {
  return G[ch] || G[ch.toUpperCase()] || G[FALLBACK];
}

export function glyphWidth(ch) {
  return rows(ch)[0].length;
}

export function glyphId(ch) {
  return 'g' + ch.codePointAt(0).toString(16);
}

/** Width of a string in glyph units (before any scaling). */
export function measure(text) {
  let w = 0;
  for (const ch of text) w += glyphWidth(ch) + TRACKING;
  return text.length ? w - TRACKING : 0;
}

/** Width of a string in final SVG units. */
export function textWidth(text, scale) {
  return measure(text) * scale;
}

/**
 * Turn one glyph into a path by merging each row's lit pixels into horizontal
 * runs. Far fewer subpaths than one rect per pixel.
 */
function glyphPath(ch) {
  const r = rows(ch);
  const parts = [];
  for (let y = 0; y < GLYPH_H; y++) {
    const row = r[y];
    let x = 0;
    while (x < row.length) {
      if (row[x] !== '#') { x++; continue; }
      let len = 0;
      while (x + len < row.length && row[x + len] === '#') len++;
      parts.push(`M${x} ${y}h${len}v1h-${len}z`);
      x += len;
    }
  }
  return parts.join('');
}

/** Collect every distinct character used across the supplied strings. */
export function charsOf(...texts) {
  const set = new Set();
  for (const t of texts.flat(Infinity)) {
    if (t == null) continue;
    for (const ch of String(t)) set.add(ch);
  }
  return set;
}

/** <defs> body holding one <path> per distinct glyph. */
export function glyphDefs(chars) {
  const out = [];
  for (const ch of [...chars].sort()) {
    const d = glyphPath(ch);
    if (!d) continue; // space and other blanks need no geometry
    out.push(`<path id="${glyphId(ch)}" d="${d}"/>`);
  }
  return out.join('');
}

/**
 * Render a string as <use> references.
 *
 * x, y are in SVG units and mark the top-left of the text block.
 * `anchor` accepts 'start', 'middle' or 'end'.
 */
export function text(str, { x = 0, y = 0, scale = 2, fill, anchor = 'start', cls, opacity, style } = {}) {
  const s = String(str);
  const w = textWidth(s, scale);
  let ox = x;
  if (anchor === 'middle') ox = x - w / 2;
  else if (anchor === 'end') ox = x - w;
  // Snap to the pixel grid so glyph edges stay crisp.
  ox = Math.round(ox / scale) * scale;

  const uses = [];
  let cursor = 0;
  for (const ch of s) {
    if (glyphPath(ch)) uses.push(`<use href="#${glyphId(ch)}" x="${cursor}"/>`);
    cursor += glyphWidth(ch) + TRACKING;
  }

  // Position lives on its own <g>. Animation classes go on a wrapper instead,
  // because a CSS `transform` in a keyframe replaces the `transform`
  // attribute outright and would drop the text at the origin.
  const placed = `<g transform="translate(${ox} ${y}) scale(${scale})"` +
    (fill ? ` fill="${fill}"` : '') + `>${uses.join('')}</g>`;

  if (!cls && !style && opacity == null) return placed;

  const outer = [
    cls ? `class="${cls}"` : '',
    style ? `style="${style}"` : '',
    opacity != null ? `opacity="${opacity}"` : '',
  ].filter(Boolean).join(' ');

  return `<g ${outer}>${placed}</g>`;
}

/** Greedy word wrap against a measured pixel width. */
export function wrap(str, maxWidth, scale) {
  const words = String(str).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && textWidth(next, scale) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * A single digit drawn inside a fixed-width cell so numbers line up in
 * columns regardless of glyph width. Used by the odometer.
 */
export const DIGIT_CELL = 5;

export function digitUse(d, cellX = 0) {
  const ch = String(d);
  const pad = Math.floor((DIGIT_CELL - glyphWidth(ch)) / 2);
  return `<use href="#${glyphId(ch)}" x="${cellX + pad}"/>`;
}
