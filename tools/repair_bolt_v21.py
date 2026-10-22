#!/usr/bin/env python3
"""Repair Bolt's baked BSWV21 strips (art/robots/bolt_{idle,run,fall}.png).

Cause: process_bswv21.py auto-slices a sheet by grouping non-transparent columns into runs and
only falls back to equal-width slicing when the run count != n. Bolt's run sheet has a clear
vertical gutter through every pose, so each pose became TWO runs and 4 poses produced exactly
8 runs (== n, so no fallback): every "frame" was one half of a robot, with a hard vertical edge
(and idle, which is run frame 0, inherited that). Bolt's fall sheet matched neither count, hit
the equal-width fallback, and had 4 poses crammed into each 84px frame.

This script rebuilds the strips from the pixels already baked into the repo (no new art is
drawn): run = left half + right half of each pose rejoined, idle = run pose 0 (the existing
code-driven bob stopgap), fall = the 8 tiny poses cut out and enlarged exactly 2x (nearest).
Originals are kept in art/robots/_orig_bolt_v21/ and read from there on re-runs.

Usage (project root): python3 tools/repair_bolt_v21.py && python3 tools/embed_art_v2.py
"""
import json, os, shutil
from PIL import Image

ART, BACKUP, F = 'art/robots', 'art/robots/_orig_bolt_v21', 84
FEET_Y = 82   # bottom row of content in every baked strip (process_bswv21.paste_pivot: ch - 2)

def src(name):
    os.makedirs(BACKUP, exist_ok=True)
    b, live = os.path.join(BACKUP, name), os.path.join(ART, name)
    if not os.path.exists(b): shutil.copy(live, b)
    return Image.open(b).convert('RGBA')

def cell(strip, i): return strip.crop((i * F, 0, (i + 1) * F, F))
def trim(im): return im.crop(im.getbbox())

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

def place(pieces, scale=1):
    """Paste pieces left to right, touching, centred as a group, feet on FEET_Y."""
    pieces = [p.resize((p.width * scale, p.height * scale), Image.NEAREST) if scale > 1 else p for p in pieces]
    total = sum(p.width for p in pieces)
    assert total <= F, f'pose {total}px wide does not fit {F}px frame'
    cell_im, x = Image.new('RGBA', (F, F), (0, 0, 0, 0)), (F - total) // 2
    for p in pieces:
        cell_im.alpha_composite(p, (x, FEET_Y + 1 - p.height)); x += p.width
    return cell_im

def strip(frames):
    out = Image.new('RGBA', (F * len(frames), F), (0, 0, 0, 0))
    for i, f in enumerate(frames): out.alpha_composite(f, (i * F, 0))
    return out

run_src = src('bolt_run.png')
assert run_src.size == (F * 8, F), run_src.size
run_frames = [place([trim(cell(run_src, 2 * k)), trim(cell(run_src, 2 * k + 1))]) for k in range(4)]
src('bolt_idle.png')   # back the old one up too
fall_src = src('bolt_fall.png')
r = runs(fall_src); assert len(r) == 8, r
fall_frames = [place([trim(fall_src.crop((a, 0, b, F)))], scale=2) for a, b in r]

strip(run_frames).save(os.path.join(ART, 'bolt_run.png'))
run_frames[0].save(os.path.join(ART, 'bolt_idle.png'))
strip(fall_frames).save(os.path.join(ART, 'bolt_fall.png'))

m = json.load(open('art/manifest.json'))
a = m['robots']['bolt']['anims']
a['run']['frames'], a['fall']['frames'] = len(run_frames), len(fall_frames)
a['idle'] = {'frames': 1, 'file': 'robots/bolt_idle.png', 'stopgap': 'bob'}
json.dump(m, open('art/manifest.json', 'w'), indent=2)
print('bolt: run', len(run_frames), 'idle 1 fall', len(fall_frames), 'frames written')
