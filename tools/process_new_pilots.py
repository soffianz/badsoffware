#!/usr/bin/env python3
"""
Adds the Havoc (replacement) and Nova (new, 5th pilot) art to the BSWV21 art pack. Same job as
tools/process_bswv21.py (chroma-key, auto-slice, one scale per animation, foot-anchored on an 84x84
canvas) but only for these two pilots, and it MERGES into art/manifest.json instead of rebuilding it,
because the other pilots' raw sheets are not in the repo.

Usage: python3 tools/process_new_pilots.py <havoc_raw_dir> <nova_raw_dir> art
Then:  python3 tools/embed_art_v2.py
"""
import sys, os, json, importlib.util
from PIL import Image

here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('bswv21', os.path.join(here, 'process_bswv21.py'))
base = importlib.util.module_from_spec(spec); spec.loader.exec_module(base)

CANVAS, TARGET_H, MARGIN = base.ROBOT_CANVAS, base.ROBOT_TARGET_H, base.MARGIN

def key(im):
    """Green-screen key plus despill. These sheets are soft JPEG-ish renders, so the plain threshold
    in process_bswv21 leaves a green halo on pale armour (Nova). Drop the fringe pixels and clamp any
    remaining green cast to the red/blue level."""
    im = im.convert('RGBA'); px = im.load(); w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if g > r + 30 and g > b + 30 and g > 100:
                px[x, y] = (0, 0, 0, 0)
    # one-pixel erode of anything still greenish next to a keyed pixel
    kill = []
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            r, g, b, a = px[x, y]
            if a and g > r + 12 and g > b + 12 and (px[x-1, y][3] == 0 or px[x+1, y][3] == 0 or px[x, y-1][3] == 0 or px[x, y+1][3] == 0):
                kill.append((x, y))
    for p in kill: px[p] = (0, 0, 0, 0)
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a:
                m = max(r, b)
                if g > m: px[x, y] = (r, m + (g - m) // 5, b, 255)
                else: px[x, y] = (r, g, b, 255)
    return im

def frames_of(path, n):
    return base.split_into_frames(key(Image.open(path)), n)

def place(frame, scale):
    cw, ch = CANVAS; fw, fh = frame.size
    s = min(scale, (cw - MARGIN) / fw, (ch - MARGIN) / fh)
    nw, nh = max(1, round(fw * s)), max(1, round(fh * s))
    small = frame.resize((nw, nh), Image.BOX)
    a = small.getchannel('A').point(lambda v: 255 if v > 110 else 0)   # crisp edge, like the rest of the pack
    small.putalpha(a)
    c = Image.new('RGBA', CANVAS, (0, 0, 0, 0))
    c.alpha_composite(small, ((cw - nw) // 2, max(0, ch - 2 - nh)))
    return c

PILOTS = {
    'havoc': ('havoc', {
        'idle':   ('Havoc_04_Menacing_Idle_4_Frames.png', 4),
        'run':    ('Havoc_03_Run_8_Frames.png', 8),
        'jump':   ('Havoc_05_Crouch_and_Leap_2_Frames.png', 2),
        'fall':   ('Havoc_06_Plunging_and_Slam_2_Frames.png', 2),
        'land':   ('Havoc_07_Landing_and_Rise_3_Frames.png', 3),
        'tagged': ('Havoc_08_Tagged_Reaction_4_Frames.png', 4)}),
    'nova': ('nova', {
        'idle':   ('Nova_Idle_4_Frames.png', 4),
        'run':    ('Nova_Run_8_Frames.png', 8),
        'jump':   ('Nova_Launch_2_Frames_Variant_A.png', 2),
        'fall':   ('Nova_Fall_and_Impact_2_Frames.png', 2),
        'land':   ('Nova_Landing_Recovery_Stand_3_Frames.png', 3),
        'tagged': ('Nova_Tagged_Dazed_4_Frames.png', 4)}),
}

def main():
    raw = {'havoc': sys.argv[1], 'nova': sys.argv[2]}; out = sys.argv[3]
    man_path = os.path.join(out, 'manifest.json'); man = json.load(open(man_path))
    for name, (_, anims) in PILOTS.items():
        entry = {'frame': CANVAS[0], 'scale': 0, 'anims': {}}
        for anim, (file, n) in anims.items():
            fr = frames_of(os.path.join(raw[name], file), n)
            if len(fr) != n: sys.exit(f'{name} {anim}: expected {n} frames, got {len(fr)}')
            scale = TARGET_H / base.median(f.size[1] for f in fr)
            if anim == 'run': entry['scale'] = round(scale, 4)
            strip = Image.new('RGBA', (CANVAS[0] * n, CANVAS[1]), (0, 0, 0, 0))
            for i, f in enumerate(fr): strip.alpha_composite(place(f, scale), (i * CANVAS[0], 0))
            strip.save(os.path.join(out, 'robots', f'{name}_{anim}.png'))
            entry['anims'][anim] = {'frames': n, 'file': f'robots/{name}_{anim}.png'}
            print(name, anim, n, 'frames, scale', round(scale, 4))
        man['robots'][name] = entry
    json.dump(man, open(man_path, 'w'), indent=2)

if __name__ == '__main__':
    main()
