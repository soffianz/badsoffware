#!/usr/bin/env python3
"""Repairs for broken frames in the processed robot strips (art/robots), for cases where the original
raw sheets are not in the repo so process_bswv21.py cannot simply be rerun. Idempotent: run from the
project root, then python3 tools/embed_art_v2.py.

- bolt fall   : each cell held four squeezed poses (a mis-cut source). Rebuilt from his airborne jump frame.
- glitch fall : three poses had been cut into 2 cells at the wrong place, splitting one in half. The strip
                is continuous, so the three poses are re-found and re-cut as 3 frames (manifest updated).
- glitch land : frames were sliced through his body (two half-figures per cell). Rebuilt from his crouch
                (jump frame 1) and idle frame, which read correctly as a landing squash.
- bolt run/idle: the run sheet had each of his four poses cut in two (a left half and a right half, each in its
                own cell, with a straight cut edge), so he ran as 8 half-bodies. The halves are rejoined into 4
                full poses (the run becomes a 4 frame cycle); idle is the first pose.
- patch idle/run : a detached teal sliver floats beside him in several frames; detached specks are removed.
"""
import json, sys
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

def rejoin_bolt_run(manifest):
    """Pair up the 8 half-body cells of bolt_run into 4 full poses. Each half was trimmed to its own bounding
    box and bottom-aligned at the same scale, so butting the left half's right edge against the right half's
    left edge, feet on one baseline, restores the pose."""
    info = manifest['robots']['bolt']['anims']['run']
    if info['frames'] != 8:
        print('bolt run: already', info['frames'], 'frames, left alone'); return
    im = load('bolt', 'run'); poses = []
    for k in range(4):
        l, r = cell(im, 2 * k), cell(im, 2 * k + 1); lb, rb = l.getbbox(), r.getbbox()
        lc, rc = l.crop(lb), r.crop(rb)
        base = max(lb[3], rb[3])                     # shared feet baseline (the cells were bottom-aligned)
        w = lc.width + rc.width
        pose = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0)); x0 = (CELL - w) // 2
        pose.alpha_composite(lc, (x0, base - lc.height)); pose.alpha_composite(rc, (x0 + lc.width, base - rc.height))
        poses.append(pose)
    strip(poses).save('art/robots/bolt_run.png'); info['frames'] = 4
    strip([poses[0]]).save('art/robots/bolt_idle.png')
    print('bolt run: rejoined 8 half-bodies into 4 full poses; idle is pose 1')

def main():
    manifest = json.load(open('art/manifest.json'))
    if len(sys.argv) > 1 and sys.argv[1] == 'bolt-run':
        rejoin_bolt_run(manifest); json.dump(manifest, open('art/manifest.json', 'w'), indent=2); return
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
    rejoin_bolt_run(manifest)
    json.dump(manifest, open('art/manifest.json', 'w'), indent=2)
    print('repaired: bolt fall + run + idle, glitch fall + land, patch idle + run')

if __name__ == '__main__':
    main()
