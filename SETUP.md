# Setup

This repository renders a GitHub profile README. The panels are generated SVG,
refreshed daily by GitHub Actions.

## 1. Publish the repository

A profile README lives in a repository named exactly after the account.

```bash
git init
git add .
git commit -m "feat: pixel telemetry profile"
git branch -M main
git remote add origin https://github.com/mxslr/mxslr.git
git push -u origin main
```

If `mxslr/mxslr` does not exist yet, create it on GitHub first, public, with no
README, no .gitignore and no licence.

## 2. Count private activity

Two things are needed before private repositories show up in the figures.

**Turn on private contributions.** Open
<https://github.com/settings/profile> and tick
"Include private contributions on my profile". Without this, the API withholds
private contribution counts even from your own token.

**Add a token.** Create a classic personal access token at
<https://github.com/settings/tokens> with the `repo` and `read:user` scopes.
Choose an expiry you are willing to renew; the workflow keeps running on public
data alone once a token lapses.

Then add it to the repository at
`Settings > Secrets and variables > Actions > New repository secret`:

- Name: `PROFILE_TOKEN`
- Value: the token

Skip this step entirely if public activity is enough. The workflow falls back
to the built-in `GITHUB_TOKEN` and reports public figures only.

## 3. First render

The workflow runs on push, so the panels fill in a minute or two after step 1.
You can also trigger it by hand from the `Actions` tab, `profile`, `Run
workflow`. Until the first successful run, the statistics panels read
`AWAITING FIRST SYNC` rather than showing invented numbers.

Note that GitHub caches images through its own proxy, so an updated panel can
take a few minutes to appear for other viewers.

## Working on it locally

```bash
node scripts/generate.mjs
```

With no token this re-renders the static panels and reuses the last cached
statistics from `data/stats.json`. To pull live data:

```bash
GH_TOKEN=ghp_yourtoken GH_LOGIN=mxslr node scripts/generate.mjs
```

Open `scripts/preview.html` in a browser to see every panel on one page.

Animations make a screenshot of the settled layout awkward to capture, so there
is a verification build that freezes every animation at its end state:

```bash
PROFILE_STATIC=1 node scripts/generate.mjs
```

Re-run without that variable before committing.

## What to edit

| Change | File |
|---|---|
| Name, handle, roles, summary, links | `scripts/data/profile.json` |
| Skills and tech stack tiles | `scripts/data/profile.json` |
| Colours | `scripts/lib/theme.mjs` |
| Panel layout | `scripts/lib/panels/*.mjs` |
| Letterforms | `scripts/lib/font.mjs` |
| Which metrics are collected | `scripts/lib/github.mjs` |
| Refresh schedule | `.github/workflows/profile.yml` |

Tech stack groups take a `style` of `solid` for tools or `outline` for
practices. Tiles measure themselves and wrap, so entries of any length are safe
to add.

## Replacing the scene

The header animation is embedded as a sprite sheet rather than referenced as a
GIF, because GitHub strips inline styles from README HTML and two stacked
images always leave a visible gap. To swap the artwork, replace
`assets/scene.gif` and rebuild the sheet:

```bash
python scripts/build-sprite.py
```

That regenerates `assets/scene-sprite.png` and `scripts/data/scene.json`. It
requires Pillow and refuses to run if the frames need more than 256 colours,
which keeps the sheet lossless. If the new artwork is not 550 pixels wide,
update `W` in `scripts/lib/theme.mjs` to match, since every panel is locked to
the scene width so the pixel art is never rescaled.
