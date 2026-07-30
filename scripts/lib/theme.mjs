// Palette sampled directly out of assets/scene.gif so every panel and the
// animation share one set of colours. Do not hand-pick new blues here; pull
// them from the ramp below or the page stops reading as a single system.

export const C = {
  // Sky, top of the frame down to the horizon.
  skyDeep:   '#56A6FC',
  skyMid:    '#69BFFF',
  skyLight:  '#70D1FF',
  skyHaze:   '#97DEFF',
  skyPale:   '#D5ECFF',
  skyMist:   '#EAF5FF',

  white:     '#FFFFFF',
  offWhite:  '#F6FBFF',

  // Type and rules. Deep navy rather than black so it sits inside the blue
  // family instead of fighting it.
  ink:       '#123A5C',
  inkSoft:   '#4A7CA5',
  inkFaint:  '#8FB8D6',
  line:      '#C9E4FA',

  // Ground colours, reserved for live/positive signals only.
  grass:     '#63DC7B',
  grassDeep: '#44BCA2',
  grassLite: '#93F081',
  teal:      '#218683',

  warn:      '#F0925A',
};

/** Ordered ramp used for language bars and any other categorical series. */
export const RAMP = [
  '#123A5C', '#1F5A87', '#2E7FB4', '#3F9BD4', '#56A6FC',
  '#69BFFF', '#83D0FF', '#97DEFF', '#B6E6FF', '#D5ECFF',
];

/** Every asset is locked to the native width of the scene GIF. */
export const W = 550;
export const PAD = 16;
export const INNER = W - PAD * 2;

/** Type scale, in bitmap-font multiples. */
export const T = {
  micro: 1,   //  5x7  - dense tabular labels
  small: 2,   // 10x14 - body copy and stat labels
  mid:   3,   // 15x21 - section headings
  large: 4,   // 20x28 - secondary figures
  hero:  6,   // 30x42 - the name and headline figures
};

export const CORNER = 4;
