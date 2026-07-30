"""Turn assets/scene.gif into a vertical sprite sheet the hero SVG can embed.

The hero and the scene have to be a single image: GitHub strips inline styles
from README HTML, so two stacked <img> tags always leave a few pixels of page
background between them, which would cut the sky in half. Embedding the frames
as a sprite and stepping through them with CSS keeps it one seamless image and
still animates.

Run this only when scene.gif changes:

    python scripts/build-sprite.py
"""

import json
import os
from PIL import Image, ImageSequence

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "scene.gif")
SHEET = os.path.join(ROOT, "assets", "scene-sprite.png")
META = os.path.join(ROOT, "scripts", "data", "scene.json")

im = Image.open(SRC)
frames = [f.convert("RGB") for f in ImageSequence.Iterator(im)]
durations = [f.info.get("duration", 100) for f in ImageSequence.Iterator(Image.open(SRC))]
w, h = frames[0].size

sheet = Image.new("RGB", (w, h * len(frames)))
for i, f in enumerate(frames):
    sheet.paste(f, (0, i * h))

colors = len(set(sheet.getdata()))
if colors > 256:
    raise SystemExit(f"sheet holds {colors} colours, too many for a lossless palette")

# Palettised at the exact colour count, so the sheet is bit-identical to the
# source frames rather than an approximation of them.
sheet = sheet.convert("P", palette=Image.ADAPTIVE, colors=256)
sheet.save(SHEET, format="PNG", optimize=True)

meta = {
    "width": w,
    "height": h,
    "frames": len(frames),
    "durationMs": int(sum(durations) / len(durations)),
    "sheet": "assets/scene-sprite.png",
}
os.makedirs(os.path.dirname(META), exist_ok=True)
with open(META, "w", encoding="utf-8") as fh:
    json.dump(meta, fh, indent=2)
    fh.write("\n")

print(f"frames      : {len(frames)} at {meta['durationMs']}ms")
print(f"colours     : {colors} (lossless)")
print(f"sheet       : {w}x{h * len(frames)}")
print(f"png bytes   : {os.path.getsize(SHEET)}")
print(f"base64 bytes: {int(os.path.getsize(SHEET) * 4 / 3)}")
