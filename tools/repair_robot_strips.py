#!/usr/bin/env python3
"""Repairs for broken frames in the processed robot strips (art/robots), for cases where the original
raw sheets are not in the repo so process_bswv21.py cannot simply be rerun. Idempotent: run from the
project root, then python3 tools/embed_art_v2.py.

- bolt fall   : each cell held four squeezed poses (a mis-cut source). Rebuilt from his airborne jump frame.
- glitch fall : three poses had been cut into 2 cells at the wrong place, splitting one in half. The strip
                is continuous, so the three poses are re-found and re-cut as 3 frames (manifest updated).
- glitch land : frames were sliced through his body (two half-figures per cell). Rebuilt from his crouch
                (jump frame 1) and idle frame, which read correctly as a landing squash.
- patch idle/run : a detached teal sliver floats beside him in several frames; detached specks are removed.
"""
import json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

CELL = 84

def load(n, a): return Image.open(f'art/robots/{n}_{a}.png').convert('RGBA')
def cell(im, i): return im.crop((i * CELL, 0, (i + 1) * CELL, CELL))
def strip(frames):
    out = Image.new('RGBA', (CELL * len(frames), CELL), (0, 0, 0, 0))
    for i, f in enumerate(frames): out.alpha_composite(f, (i * CELL, 0))
    return out

def column_runs(im, gap=1):
    cols = (np.array(im)[..., 3] > 10).any(0); runs = []; x = 0
    while x < len(cols):
        if cols[x]:
            x0 = x
            while x < len(cols) and (cols[x] or (x + gap < len(cols) and cols[x:x + gap + 1].any())): x += 1
            runs.append((x0, x))
        else: x += 1
    return runs

def drop_specks(im, frac=0.25):
    a = np.array(im); fg = a[..., 3] > 10
    lab, n = ndi.label(ndi.binary_dilation(fg, structure=np.ones((3, 3), bool), iterations=1))
    if n <= 1: return im
    sizes = ndi.sum(fg, lab, range(1, n + 1)); keep = np.zeros(n + 1, bool); keep[1:] = sizes >= sizes.max() * frac
    a[~keep[lab]] = 0
    return Image.fromarray(a)

def main():
    manifest = json.load(open('art/manifest.json'))
    # bolt fall
    jump = load('bolt', 'jump'); strip([cell(jump, 1), cell(jump, 1)]).save('art/robots/bolt_fall.png')
    # glitch fall: the strip holds three poses, but the middle one was cut in half at the cell border
    # (two pieces a few px apart). Find the pieces, close the gap, re-cut as 3 frames.
    gf = load('glitch', 'fall'); runs = column_runs(gf, gap=0)
    if len(runs) == 4 and runs[2][0] - runs[1][1] <= 8:
        a0, b0, b1, c0 = runs
        poseB = Image.new('RGBA', (runs[2][1] - runs[2][0] + 1 + runs[1][1] - runs[1][0], CELL), (0, 0, 0, 0))
        poseB.alpha_composite(gf.crop((runs[1][0], 0, runs[1][1] + 1, CELL)), (0, 0))
        poseB.alpha_composite(gf.crop((runs[2][0], 0, runs[2][1] + 1, CELL)), (runs[1][1] - runs[1][0], 0))   # overlap 1px so no seam is left
        poses = [gf.crop((a0[0], 0, a0[1] + 1, CELL)), poseB, gf.crop((c0[0], 0, c0[1] + 1, CELL))]
        frames = []
        for p in poses:
            f = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0)); f.alpha_composite(p, ((CELL - p.width) // 2, 0)); frames.append(f)
        strip(frames).save('art/robots/glitch_fall.png'); manifest['robots']['glitch']['anims']['fall']['frames'] = 3
        print('glitch fall: stitched the split pose, 3 frames')
    else:
        print('glitch fall: unexpected layout', runs, '- left alone (already repaired?)')
    # glitch land
    gj, gi = load('glitch', 'jump'), load('glitch', 'idle')
    strip([cell(gj, 0), cell(gj, 0), cell(gi, 0)]).save('art/robots/glitch_land.png')
    # patch slivers
    for a in ('idle', 'run'):
        im = load('patch', a); n = im.width // CELL
        strip([drop_specks(cell(im, i)) for i in range(n)]).save(f'art/robots/patch_{a}.png')
    json.dump(manifest, open('art/manifest.json', 'w'), indent=2)
    print('repaired: bolt fall, glitch fall + land, patch idle + run')

if __name__ == '__main__':
    main()
