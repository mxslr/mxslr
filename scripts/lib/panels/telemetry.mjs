// Telemetry console. The centrepiece panel: every figure here is pulled from
// the GitHub API by scripts/generate.mjs, never hand-written.

import { C, W, PAD, INNER, T } from '../theme.mjs';
import { doc, rect, plate, dottedRule, commas, odometer, scanCss } from '../svg.mjs';
import { text, textWidth } from '../font.mjs';

const H = 468;
const HEAD = 30;

// One vertical ruler for the whole panel. Every block is placed off these
// constants so a change in one section cannot silently overlap the next.
const Y = {
  headLabel: 44,
  headFigure: 64,
  headFigureSm: 78,
  headCaption: 112,
  rule1: 138,
  locLabel: 150,
  locCols: 176,
  locFigures: 196,
  locBar: 228,
  locRatio: 246,
  rule2: 272,
  grid: 284,
  gridStep: 56,
  rule3: 398,
  footLabel: 410,
  footValue: 430,
};

function sectionLabel(x, y, label, chars) {
  chars.push(label);
  return rect(x, y + 2, 3, 10, C.skyDeep) +
    text(label, { x: x + 9, y, scale: T.small, fill: C.inkSoft });
}

/** One cell of the four-across statistics grid. */
function cell(x, y, cw, label, value, delay, chars) {
  chars.push(label, value);
  return [
    text(label, { x, y, scale: T.small, fill: C.inkFaint, cls: 'rise', style: `--d:${delay}s` }),
    text(value, { x, y: y + 18, scale: T.mid, fill: C.ink, cls: 'rise', style: `--d:${(delay + 0.06).toFixed(2)}s` }),
    rect(x, y + 42, Math.min(cw - 6, textWidth(value, T.mid)), 2, C.line,
      `class="grow" style="--d:${(delay + 0.12).toFixed(2)}s"`),
  ].join('');
}

export function telemetry(stats) {
  const chars = ['0123456789', ',', '+', '-', '.'];
  const ok = stats.ok !== false;
  const dash = '----';
  const n = (v) => (ok ? commas(v) : dash);

  const defs = [];
  const body = [];

  body.push(plate(1, 1, W - 2, H - 2, { fill: C.white, stroke: C.ink, sw: 2 }));

  // Header strip.
  body.push(`<path d="M5 3H${W - 5}L${W - 3} 5V${HEAD}H3V5Z" fill="${C.ink}"/>`);
  body.push(rect(14, 12, 6, 6, C.grass, 'class="pulse"'));
  chars.push('TELEMETRY');
  body.push(text('TELEMETRY', { x: 26, y: 9, scale: T.small, fill: C.white }));
  const stamp = ok ? `SYNCED ${stats.synced} UTC` : 'AWAITING FIRST SYNC';
  chars.push(stamp);
  body.push(text(stamp, { x: W - 14, y: 9, scale: T.small, fill: C.skyHaze, anchor: 'end' }));

  // ---- Headline figures -------------------------------------------------
  chars.push('TOTAL COMMITS', 'ALL TIME', 'CONTRIBUTIONS', 'LAST 12 MONTHS');
  body.push(sectionLabel(PAD, Y.headLabel, 'TOTAL COMMITS', chars));
  body.push(sectionLabel(290, Y.headLabel, 'CONTRIBUTIONS', chars));

  if (ok) {
    const a = odometer(commas(stats.totalCommits), { x: PAD, y: Y.headFigure, scale: T.hero, fill: C.ink, baseDelay: 0.2 });
    const b = odometer(commas(stats.contributions12m), { x: 290, y: Y.headFigureSm, scale: T.large, fill: C.skyDeep, baseDelay: 0.45 });
    defs.push(a.defs, b.defs);
    body.push(a.markup, b.markup);
  } else {
    body.push(text(dash, { x: PAD, y: Y.headFigure, scale: T.hero, fill: C.inkFaint }));
    body.push(text(dash, { x: 290, y: Y.headFigureSm, scale: T.large, fill: C.inkFaint }));
  }
  body.push(text('ALL TIME', { x: PAD, y: Y.headCaption, scale: T.small, fill: C.inkFaint, cls: 'fade', style: '--d:.9s' }));
  body.push(text('LAST 12 MONTHS', { x: 290, y: Y.headCaption, scale: T.small, fill: C.inkFaint, cls: 'fade', style: '--d:.95s' }));

  body.push(dottedRule(PAD, Y.rule1, INNER));

  // ---- Lines of code ----------------------------------------------------
  const cols = [
    { x: PAD, label: 'WRITTEN', value: ok ? '+' + commas(stats.linesAdded) : dash, fill: C.ink },
    { x: 190, label: 'REMOVED', value: ok ? '-' + commas(stats.linesRemoved) : dash, fill: C.inkSoft },
    { x: 364, label: 'NET', value: ok ? (stats.linesNet >= 0 ? '+' : '-') + commas(Math.abs(stats.linesNet)) : dash, fill: C.skyDeep },
  ];
  body.push(sectionLabel(PAD, Y.locLabel, 'LINES OF CODE', chars));
  cols.forEach((c, i) => {
    chars.push(c.label, c.value);
    body.push(text(c.label, { x: c.x, y: Y.locCols, scale: T.small, fill: C.inkFaint, cls: 'rise', style: `--d:${0.5 + i * 0.07}s` }));
    body.push(text(c.value, { x: c.x, y: Y.locFigures, scale: T.mid, fill: c.fill, cls: 'rise', style: `--d:${0.56 + i * 0.07}s` }));
  });

  // Added versus removed, as one proportional track.
  const add = Math.max(0, stats.linesAdded || 0);
  const del = Math.max(0, stats.linesRemoved || 0);
  const tot = add + del || 1;
  const addW = ok ? Math.round((add / tot) * INNER) : 0;
  body.push(rect(PAD, Y.locBar, INNER, 12, C.line));
  if (ok) {
    body.push(rect(PAD, Y.locBar, addW, 12, C.skyDeep, 'class="grow" style="--d:.62s"'));
    body.push(rect(PAD + addW, Y.locBar, INNER - addW, 12, C.skyHaze, 'class="grow" style="--d:.78s"'));
  }
  const ratio = ok ? `${Math.round((add / tot) * 100)}% WRITTEN / ${100 - Math.round((add / tot) * 100)}% REMOVED` : 'NO DATA';
  chars.push(ratio, 'LINES OF CODE');
  body.push(text(ratio, { x: W - PAD, y: Y.locRatio, scale: T.small, fill: C.inkFaint, anchor: 'end', cls: 'fade', style: '--d:1s' }));

  body.push(dottedRule(PAD, Y.rule2, INNER));

  // ---- Four-across grid -------------------------------------------------
  const cw = 128;
  const gx = (i) => PAD + i * (cw + 2);
  const grid = [
    ['REPOS', n(stats.repos)],
    ['STARS', n(stats.stars)],
    ['PULL REQS', n(stats.prs)],
    ['ISSUES', n(stats.issues)],
    ['REVIEWS', n(stats.reviews)],
    ['FOLLOWERS', n(stats.followers)],
    ['STREAK NOW', ok ? `${commas(stats.currentStreak)}D` : dash],
    ['STREAK BEST', ok ? `${commas(stats.longestStreak)}D` : dash],
  ];
  grid.forEach(([label, value], i) => {
    const row = Math.floor(i / 4);
    body.push(cell(gx(i % 4), Y.grid + row * Y.gridStep, cw, label, value, 0.7 + i * 0.05, chars));
  });

  body.push(dottedRule(PAD, Y.rule3, INNER));

  // ---- Footer figures ---------------------------------------------------
  const day = ok ? String(stats.busiestWeekday || dash) : dash;
  const age = ok ? String(stats.accountAge || dash) : dash;
  chars.push('MOST ACTIVE DAY', 'ACCOUNT AGE', day, age);
  body.push(text('MOST ACTIVE DAY', { x: PAD, y: Y.footLabel, scale: T.small, fill: C.inkFaint }));
  body.push(text(day, { x: PAD, y: Y.footValue, scale: T.mid, fill: C.ink, cls: 'rise', style: '--d:1.15s' }));
  body.push(text('ACCOUNT AGE', { x: 290, y: Y.footLabel, scale: T.small, fill: C.inkFaint }));
  body.push(text(age, { x: 290, y: Y.footValue, scale: T.mid, fill: C.ink, cls: 'rise', style: '--d:1.2s' }));

  // CRT sweep, kept faint so it reads as texture rather than noise.
  body.push(
    `<g clip-path="url(#panel)">` +
      rect(0, 0, W, 14, C.skyDeep, 'class="scan" opacity="0.08"') +
    `</g>`,
  );

  defs.push(`<clipPath id="panel"><rect x="2" y="2" width="${W - 4}" height="${H - 4}"/></clipPath>`);

  return doc({
    w: W,
    h: H,
    title: 'GitHub telemetry',
    chars,
    defs: defs.join(''),
    css: scanCss(H),
    body: body.join(''),
  });
}
