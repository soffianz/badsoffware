#!/usr/bin/env python3
"""Turn the BSW_RUMBLE_ARTWORK_QA.zip drafts into green-screen sheets in the layout
tools/process_bswv21.py expects (BSWV21_Rumble/rumble_<anim>_<n>_frames.png).

What it fixes, found by measuring the drafts:
- RUN: the delivered "8 frame" run sheet is a 4-frame copy of the idle sheet, not a run cycle. Until
  a real run strip exists, the run sheet is the 4 idle frames repeated to 8 (a heavy stomping shuffle).
- TAGGED: the dizzy stars / hit burst / motion lines are removed (small detached specks are dropped);
  the brief said no effects.
- Backgrounds are snapped to pure #00FF00 so the chroma key is clean (no dark-green fringe).
Zoom differences between sheets are handled in process_bswv21.py (RUMBLE_ZOOM).

Usage: python3 tools/prep_rumble_sheets.py <extracted zip dir> <out dir>
"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC = {'idle': ('01_RUMBLE_IDLE_4FRAMES.png', 4), 'run': ('02_RUMBLE_RUN_8FRAMES_DRAFT.png', 8),
       'jump': ('03_RUMBLE_JUMP_2FRAMES_DRAFT.png', 2), 'fall': ('04_RUMBLE_FALL_2FRAMES_DRAFT.png', 2),
       'land': ('05_RUMBLE_LAND_3FRAMES_DRAFT.png', 3), 'tagged': ('06_RUMBLE_TAGGED_4FRAMES_DRAFT.png', 4)}
GREEN = (0, 255, 0)

def is_bg(a):
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    return (g > r + 30) & (g > b + 30) & (g > 100)

def clean(im, drop_specks):
    """snap the background to pure green; optionally drop small detached specks (effects)"""
    a = np.array(im.convert('RGB')); fg = ~is_bg(a)
    if drop_specks:
        # the halo ring touches the head, so a plain size filter keeps the stars attached to it.
        # Open with a 7px element first (thin rings and lines vanish, limbs survive), keep the big
        # pieces, then grow them back a few px so the outline is restored but the effects are not.
        opened = ndi.binary_opening(fg, structure=np.ones((7, 7), bool))
        lab, n = ndi.label(opened)
        if n:
            sizes = ndi.sum(opened, lab, range(1, n + 1))
            keep = np.zeros(n + 1, bool); keep[1:] = sizes >= sizes.max() * 0.04
            fg = fg & ndi.binary_dilation(keep[lab], structure=np.ones((3, 3), bool), iterations=6)
    a[~fg] = GREEN
    return Image.fromarray(a)

def frame_runs(im, minw=40):
    fg = ~is_bg(np.array(im.convert('RGB'))); cols = fg.any(0); runs = []; x = 0
    while x < len(cols):
        if cols[x]:
            x0 = x
            while x < len(cols) and cols[x]: x += 1
            runs.append((x0, x))
        else: x += 1
    return [r for r in runs if r[1] - r[0] > minw]

def main():
    src_dir, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)
    idle = clean(Image.open(os.path.join(src_dir, SRC['idle'][0])), False)
    for anim, (fname, n) in SRC.items():
        if anim == 'run':
            runs = frame_runs(idle); assert len(runs) == 4, 'expected 4 idle frames, found %d' % len(runs)
            pad = 30; fw = max(b - a for a, b in runs) + pad * 2
            sheet = Image.new('RGB', (fw * 8, idle.height), GREEN)
            for i in range(8):
                a, b = runs[i % 4]; sheet.paste(idle.crop((a, 0, b, idle.height)), (i * fw + pad, 0))
            sheet.save(os.path.join(out_dir, 'rumble_run_8_frames.png')); print('run   : built from idle (stopgap), 8 frames')
            continue
        im = idle if anim == 'idle' else clean(Image.open(os.path.join(src_dir, fname)), anim == 'tagged')
        found = len(frame_runs(im))
        print('%-6s: %d frames expected, %d found' % (anim, n, found))
        im.save(os.path.join(out_dir, 'rumble_%s_%d_frames.png' % (anim, n)))

if __name__ == '__main__':
    main()
