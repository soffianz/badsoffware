#!/usr/bin/env python3
"""Repair Glitch's baked BSWV21 land/fall strips (art/robots/glitch_{land,fall}.png).

Same family of defect as tools/repair_bolt_v21.py: process_bswv21.py's column-run slicer found the wrong
frame count, hit the equal-width fallback, and cut poses at cell boundaries. Here the two strips also
look swapped at the source: glitch_land.png holds two arms-up falling poses (each cut into a left and a
right half), glitch_fall.png holds a crouch -> stand landing sequence (3 poses, the middle one split
across the cell boundary).

Rebuilt from pixels already in the repo (no new art): the falling poses are rejoined into
glitch_fall.png (2 frames), the landing poses into glitch_land.png (3 frames). Originals are kept in
art/robots/_orig_glitch_v21/ and read from there on re-runs.

Usage (project root): python3 tools/repair_glitch_v21.py && python3 tools/embed_art_v2.py
"""
import json, os, shutil
from PIL import Image

ART, BACKUP, F, FEET_Y = 'art/robots', 'art/robots/_orig_glitch_v21', 84, 82

def src(name):
    os.makedirs(BACKUP, exist_ok=True)
    b, live = os.path.join(BACKUP, name), os.path.join(ART, name)
    if not os.path.exists(b): shutil.copy(live, b)
    return Image.open(b).convert('RGBA')

def runs(im):
    px, (w, h) = im.load(), im.size
    has = [any(px[x, y][3] > 10 for y in range(h)) for x in range(w)]
    out, x = [], 0
    while x < w:
        if has[x]:
            s = x
            while x < w and has[x]: x += 1
            out.append((s, x))
        else: x += 1
    return out

def pieces(strip, n_expected):
    r = runs(strip); assert len(r) == n_expected, r
    out = []
    for a, b in r:
        c = strip.crop((a, 0, b, F)); out.append(c.crop(c.getbbox()))
    return out

def pose(parts):
    total = sum(p.width for p in parts); assert total <= F, total
    im, x = Image.new('RGBA', (F, F), (0, 0, 0, 0)), (F - total) // 2
    for p in parts:
        im.alpha_composite(p, (x, FEET_Y + 1 - p.height)); x += p.width
    return im

def strip(frames):
    out = Image.new('RGBA', (F * len(frames), F), (0, 0, 0, 0))
    for i, f in enumerate(frames): out.alpha_composite(f, (i * F, 0))
    return out

old_land, old_fall = src('glitch_land.png'), src('glitch_fall.png')
lp = pieces(old_land, 4)    # fall pose A left/right, fall pose B left/right
fp = pieces(old_fall, 4)    # landing pose 1, landing pose 2 left/right (split by the cell edge), landing pose 3
new_fall = [pose([lp[0], lp[1]]), pose([lp[2], lp[3]])]
new_land = [pose([fp[0]]), pose([fp[1], fp[2]]), pose([fp[3]])]
strip(new_fall).save(os.path.join(ART, 'glitch_fall.png'))
strip(new_land).save(os.path.join(ART, 'glitch_land.png'))
m = json.load(open('art/manifest.json'))
a = m['robots']['glitch']['anims']
a['fall']['frames'], a['land']['frames'] = len(new_fall), len(new_land)
json.dump(m, open('art/manifest.json', 'w'), indent=2)
print('glitch: fall', len(new_fall), 'land', len(new_land), 'frames written')
