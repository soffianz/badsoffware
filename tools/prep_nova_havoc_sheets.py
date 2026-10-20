#!/usr/bin/env python3
"""Turn the Nova and Havoc artwork packs (BSW_Nova_Artwork_Pack.zip, Havoc_All_Artworks.zip) into the
green-screen sheets tools/process_bswv21.py expects (BSWV21_<Name>/<name>_<anim>_<n>_frames.png), and
write the two 512px character-select portraits into art/pilots/.

What it does, found by measuring the packs:
- Nova's jump strip is launch variant B (thrusters lit in both frames). The 'Complete Moves' sheet is
  not used.
- Havoc's plunge/slam frames touch each other, so the strip is split at the thinnest column between
  them and re-spaced with a clear gap (otherwise the frame finder sees one wide blob).
- Backgrounds are snapped to pure #00FF00 and the green fringe on the anti-aliased outline is
  despilled, so the chroma key leaves no lime edge.
Per-animation zoom differences are handled in process_bswv21.py (ROBOT_ZOOM).

Usage: python3 tools/prep_nova_havoc_sheets.py <nova pack dir> <havoc pack dir> <raw out dir> [art dir]
"""
import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

GREEN = (0, 255, 0)
NOVA = {'idle': ('Nova_Idle_4_Frames.png', 4), 'run': ('Nova_Run_8_Frames.png', 8),
        'jump': ('Nova_Launch_2_Frames_Variant_B.png', 2), 'fall': ('Nova_Fall_and_Impact_2_Frames.png', 2),
        'land': ('Nova_Landing_Recovery_Stand_3_Frames.png', 3), 'tagged': ('Nova_Tagged_Dazed_4_Frames.png', 4)}
HAVOC = {'idle': ('Havoc_04_Menacing_Idle_4_Frames.png', 4), 'run': ('Havoc_03_Run_8_Frames.png', 8),
         'jump': ('Havoc_05_Crouch_and_Leap_2_Frames.png', 2), 'fall': ('Havoc_06_Plunging_and_Slam_2_Frames.png', 2),
         'land': ('Havoc_07_Landing_and_Rise_3_Frames.png', 3), 'tagged': ('Havoc_08_Tagged_Reaction_4_Frames.png', 4)}

def is_bg(a):
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    return (g > r + 30) & (g > b + 30) & (g > 100)

def clean(im):
    """snap the background to pure green and despill the green fringe on the outline"""
    a = np.array(im.convert('RGB')); bg = is_bg(a)
    edge = ndi.binary_dilation(bg, structure=np.ones((3, 3), bool), iterations=2) & ~bg
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    cap = np.maximum(r, b)
    a[..., 1] = np.where(edge & (g > cap), cap, g).astype(np.uint8)
    a[bg] = GREEN
    return Image.fromarray(a)

def drop_specks(im):
    """remove small detached effects (motion lines): open with a 7px element so thin lines vanish and
    limbs survive, keep the big pieces, grow them back so the outline is restored but the lines are not"""
    a = np.array(im.convert('RGB')); fg = ~is_bg(a)
    opened = ndi.binary_opening(fg, structure=np.ones((7, 7), bool))
    lab, n = ndi.label(opened)
    if n:
        sizes = ndi.sum(opened, lab, range(1, n + 1))
        keep = np.zeros(n + 1, bool); keep[1:] = sizes >= sizes.max() * 0.04
        fg = fg & ndi.binary_dilation(keep[lab], structure=np.ones((3, 3), bool), iterations=6)
    a[~fg] = GREEN
    return Image.fromarray(a)

def split_touching(im, gap=60):
    """two frames that touch: cut at the column with the least character in the middle third, re-space"""
    a = np.array(im.convert('RGB')); fg = ~is_bg(a); w = a.shape[1]
    lo, hi = int(w * 0.35), int(w * 0.65)
    cut = lo + int(np.argmin(fg[:, lo:hi].sum(0)))
    out = Image.new('RGB', (w + gap, im.height), GREEN)
    out.paste(im.crop((0, 0, cut, im.height)), (0, 0)); out.paste(im.crop((cut, 0, w, im.height)), (cut + gap, 0))
    return out

def frame_count(im, minw=40):
    fg = ~is_bg(np.array(im.convert('RGB'))); cols = fg.any(0); n = 0; x = 0
    while x < len(cols):
        if cols[x]:
            while x < len(cols) and cols[x]: x += 1
            n += 1
        else: x += 1
    return n

def build(name, src_dir, spec, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    for anim, (fname, n) in spec.items():
        im = clean(Image.open(os.path.join(src_dir, fname)))
        if name == 'havoc' and anim == 'fall' and frame_count(im) != n: im = split_touching(im)
        if anim == 'tagged' and frame_count(im) != n: im = drop_specks(im)
        found = frame_count(im)
        print('%-6s %-6s: %d frames expected, %d found' % (name, anim, n, found))
        im.save(os.path.join(out_dir, '%s_%s_%d_frames.png' % (name, anim, n)))

def portrait(src, dst):
    Image.open(src).convert('RGB').resize((512, 512), Image.LANCZOS).save(dst)
    print('portrait ->', dst)

def main():
    nova_dir, havoc_dir, raw_dir = sys.argv[1:4]
    art_dir = sys.argv[4] if len(sys.argv) > 4 else 'art'
    build('nova', nova_dir, NOVA, os.path.join(raw_dir, 'BSWV21_Nova'))
    build('havoc', havoc_dir, HAVOC, os.path.join(raw_dir, 'BSWV21_Havoc'))
    os.makedirs(os.path.join(art_dir, 'pilots'), exist_ok=True)
    portrait(os.path.join(nova_dir, 'Nova_Profile_Bust_512.png'), os.path.join(art_dir, 'pilots', 'nova_portrait.png'))
    portrait(os.path.join(havoc_dir, 'Havoc_02_Character_Bust_Portrait.png'), os.path.join(art_dir, 'pilots', 'havoc_portrait.png'))

if __name__ == '__main__':
    main()
