#!/usr/bin/env node
// Renders every SVG in assets/ from scripts/data/profile.json plus live
// GitHub data. Run with no token to re-render the static panels only.
//
//   node scripts/generate.mjs
//   GH_TOKEN=... GH_LOGIN=mxslr node scripts/generate.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { collect } from './lib/github.mjs';
import { hero } from './lib/panels/hero.mjs';
import { telemetry } from './lib/panels/telemetry.mjs';
import { languages } from './lib/panels/languages.mjs';
import { activity } from './lib/panels/activity.mjs';
import { stack } from './lib/panels/stack.mjs';
import { about, button, footer } from './lib/panels/chrome.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'assets');
const CACHE = join(ROOT, 'data', 'stats.json');

const profile = JSON.parse(readFileSync(join(ROOT, 'scripts', 'data', 'profile.json'), 'utf8'));

// Scene frames, produced by scripts/build-sprite.py and embedded into the
// hero so the horizon is one uninterrupted image.
const scene = JSON.parse(readFileSync(join(ROOT, 'scripts', 'data', 'scene.json'), 'utf8'));
scene.sprite = readFileSync(join(ROOT, scene.sheet)).toString('base64');

function readCache() {
  if (!existsSync(CACHE)) return null;
  try {
    return JSON.parse(readFileSync(CACHE, 'utf8'));
  } catch {
    return null;
  }
}

async function resolveStats() {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const login = process.env.GH_LOGIN || profile.login;

  if (!token) {
    console.log('no token supplied, falling back to cached statistics');
    return readCache() || { ok: false };
  }
  try {
    return await collect(login, token);
  } catch (err) {
    console.error(`collection failed: ${err.message}`);
    // Keep the last good numbers rather than replacing them with dashes.
    const cached = readCache();
    if (cached) {
      console.error('reusing cached statistics');
      return cached;
    }
    return { ok: false };
  }
}

function write(name, svg) {
  writeFileSync(join(ASSETS, name), svg, 'utf8');
  console.log(`  ${name.padEnd(22)} ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`);
}

const stats = await resolveStats();

mkdirSync(ASSETS, { recursive: true });
mkdirSync(dirname(CACHE), { recursive: true });
if (stats.ok) writeFileSync(CACHE, JSON.stringify(stats, null, 2) + '\n', 'utf8');

console.log('rendering:');
write('hero.svg', hero(profile, scene));
write('telemetry.svg', telemetry(stats));
write('languages.svg', languages(stats));
write('activity.svg', activity(stats));
write('stack.svg', stack(profile));
write('about.svg', about(profile));
write('footer.svg', footer());
write('btn-linkedin.svg', button('LINKEDIN'));
write('btn-website.svg', button('MXSLR.MY.ID'));

console.log(stats.ok ? `done, synced ${stats.synced}` : 'done, no statistics yet');
