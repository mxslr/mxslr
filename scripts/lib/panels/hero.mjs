// Hero banner, including the animated scene.
//
// The typography, the sky and the pixel scene are one SVG on purpose. GitHub
// strips inline styles from README HTML, so two stacked <img> tags always
// leave several pixels of page background between them, and that gap would cut
// straight through the sky. As a single image the horizon is continuous, and
// the scene still animates because its frames ride in an embedded sprite sheet
// that CSS steps through.

import { C, W, PAD, T } from '../theme.mjs';
import { doc, rect } from '../svg.mjs';
import { text, textWidth } from '../font.mjs';
import { skyStack, clouds, SKY_CSS } from '../sky.mjs';

const SKY_Y = 132;
const SKY_H = 76;
const SCENE_Y = SKY_Y + SKY_H;

/** One typing window per role, expressed as a share of the full loop. */
function typeCss(roles) {
  const share = 100 / roles.length;
  return roles.map((role, i) => {
    const start = i * share;
    const steps = Math.max(1, role.length);
    const frames = [];
    if (start > 0) frames.push(`0%{transform:scaleX(0)}`);
    frames.push(`${start.toFixed(2)}%{transform:scaleX(0);animation-timing-function:steps(${steps},end)}`);
    frames.push(`${(start + share * 0.3).toFixed(2)}%{transform:scaleX(1)}`);
    frames.push(`${(start + share * 0.88).toFixed(2)}%{transform:scaleX(1)}`);
    frames.push(`${(start + share * 0.94).toFixed(2)}%{transform:scaleX(0)}`);
    frames.push(`100%{transform:scaleX(0)}`);
    return `@keyframes type${i}{${frames.join('')}}\n` +
      `.type${i}{transform-box:fill-box;transform-origin:left center;` +
      `animation:type${i} ${roles.length * 5}s linear infinite}`;
  }).join('\n');
}

export function hero(profile, scene) {
  const { name, handle, roles } = profile;
  const H = SCENE_Y + scene.height;
  const sheetH = scene.height * scene.frames;
  const nameW = textWidth(name, T.hero);
  const roleY = 108;
  const roleX = PAD + 16;

  // The clip runs a little past the text so the cursor, which lives inside
  // it, only appears once that role has finished typing.
  const clipDefs = roles.map((r, i) =>
    `<clipPath id="t${i}"><rect class="type${i}" x="${roleX}" y="${roleY - 2}" width="${textWidth(r, T.small) + 16}" height="18"/></clipPath>`,
  ).join('');

  const body = [
    rect(0, 0, W, SKY_Y, C.white),

    // Sky, dithered band by band down to the exact blue the scene opens on.
    `<g clip-path="url(#skyclip)">`,
    skyStack(0, SKY_Y, W, SKY_H),
    clouds(W, [
      { shape: 2, px: 2, y: SKY_Y + 6,  dur: 96, phase: 0.10, opacity: 0.75 },
      { shape: 0, px: 2, y: SKY_Y + 20, dur: 74, phase: 0.55, opacity: 0.9 },
      { shape: 1, px: 3, y: SKY_Y + 34, dur: 52, phase: 0.25 },
      { shape: 0, px: 3, y: SKY_Y + 52, dur: 38, phase: 0.72 },
    ]),
    `</g>`,

    // The scene. One tall sprite sheet, stepped one frame at a time.
    `<g clip-path="url(#sceneclip)"><g class="film">` +
      `<image x="0" y="${SCENE_Y}" width="${W}" height="${sheetH}" ` +
      `image-rendering="pixelated" preserveAspectRatio="none" ` +
      `href="data:image/png;base64,${scene.sprite}" ` +
      `xlink:href="data:image/png;base64,${scene.sprite}"/>` +
    `</g></g>`,

    // Live marker plus handle.
    rect(PAD, 24, 6, 6, C.grass, 'class="pulse"'),
    text(handle, { x: PAD + 14, y: 22, scale: T.small, fill: C.inkSoft, cls: 'rise', style: '--d:.05s' }),

    // Name, dropped in with an offset shadow for depth.
    text(name, { x: PAD + 3, y: 49, scale: T.hero, fill: C.skyPale }),
    text(name, { x: PAD, y: 46, scale: T.hero, fill: C.ink, cls: 'rise', style: '--d:.12s' }),

    rect(PAD, 96, nameW, 3, C.skyDeep, 'class="grow" style="--d:.42s"'),

    // Role line: a chevron prompt, the typed role, and a resting cursor.
    text('>', { x: PAD, y: roleY, scale: T.small, fill: C.skyDeep }),
    ...roles.map((r, i) =>
      `<g clip-path="url(#t${i})">` +
        text(r, { x: roleX, y: roleY, scale: T.small, fill: C.inkSoft }) +
        rect(roleX + textWidth(r, T.small) + 5, roleY, 8, 14, C.skyDeep, 'class="blink"') +
      `</g>`,
    ),
  ].join('');

  return doc({
    w: W,
    h: H,
    title: `${name} ${handle}`,
    chars: [name, handle, '>', ...roles],
    defs:
      `<clipPath id="skyclip"><rect x="0" y="${SKY_Y}" width="${W}" height="${SKY_H}"/></clipPath>` +
      `<clipPath id="sceneclip"><rect x="0" y="${SCENE_Y}" width="${W}" height="${scene.height}"/></clipPath>` +
      clipDefs,
    css: SKY_CSS + `
.film{animation:film ${(scene.frames * scene.durationMs / 1000).toFixed(2)}s steps(${scene.frames}) infinite}
@keyframes film{from{transform:translateY(0)}to{transform:translateY(-${sheetH}px)}}
` + typeCss(roles),
    body,
  });
}
