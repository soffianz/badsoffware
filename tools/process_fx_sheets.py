#!/usr/bin/env python3
"""Turn the weapon effect sheets (bsw_game_effects_sprite_sheets.zip) into transparent strips in art/fx/ and
add them to art/manifest.json under "fx". Run from the project root, then tools/embed_art_v2.py.

- pop_up_bomb_sprite_sheet.png        green screen, 6 frames: 2 armed, 1 warning flash, 3 explosion
- speed_dash_streak_sprite_sheet.png  magenta screen, 4 frames of a trail; every frame is right-aligned in
                                      its cell so the head of the streak sits on the dashing pilot
- weapon_unlock_starburst_sprite_sheet.png  green screen, 4 frames; the last one breaks into fragments so
                                      the sheet is cut in equal columns and each burst is centred

All frames of a sheet share one scale (so the bomb window does not change size between frames).

Usage: python3 tools/process_fx_sheets.py <extracted zip dir> [art dir]
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SHEETS = {
    # id: (file, frames, key colour, cell (w, h), cut, align)
    'popbomb': ('pop_up_bomb_sprite_sheet.png', 6, 'green', (128, 128), 'runs', 'centre'),
    'dashburst': ('speed_dash_streak_sprite_sheet.png', 4, 'magenta', (192, 64), 'runs', 'right'),
    'unlock': ('weapon_unlock_starburst_sprite_sheet.png', 4, 'green', (128, 128), 'equal', 'centre'),
}

def key_mask(a, colour):
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    if colour == 'green': return (g > r + 30) & (g > b + 30) & (g > 100)
    return (r > g + 60) & (b > g + 60)

def to_rgba(im, colour):
    """key the background out and despill the key colour on the anti-aliased outline"""
    a = np.array(im.convert('RGB')); bg = key_mask(a, colour)
    edge = ndi.binary_dilation(bg, structure=np.ones((3, 3), bool), iterations=2) & ~bg
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    if colour == 'green':
        g = np.where(edge & (g > np.maximum(r, b)), np.maximum(r, b), g)
    else:
        m = np.where(edge, np.maximum(np.minimum(r, b) - g, 0), 0); r, b = r - m, b - m
    out = np.dstack([r, g, b, np.where(bg, 0, 255)]).clip(0, 255).astype(np.uint8)
    # drop detached specks of the key colour's fringe (tiny islands) so no stray pixels float around
    lab, n = ndi.label(out[..., 3] > 0)
    if n:
        sizes = ndi.sum(out[..., 3] > 0, lab, range(1, n + 1))
        for i, s in enumerate(sizes, 1):
            if s < 12: out[lab == i, 3] = 0
    return Image.fromarray(out, 'RGBA')

def column_runs(im, minw=12):
    cols = (np.array(im)[..., 3] > 10).any(0); runs = []; x = 0
    while x < len(cols):
        if cols[x]:
            x0 = x
            while x < len(cols) and cols[x]: x += 1
            runs.append((x0, x))
        else: x += 1
    return [r for r in runs if r[1] - r[0] >= minw]

def cut(im, n, how):
    w = im.width
    if how == 'runs':
        runs = column_runs(im)
        if len(runs) == n: return [im.crop((a, 0, b, im.height)) for a, b in runs]
        print('  runs found %d, expected %d: falling back to equal columns' % (len(runs), n))
    # equal columns, but a burst can spill over a column edge: assign each connected piece to the column
    # its centre falls in instead of cutting through it
    a = np.array(im); lab, k = ndi.label(a[..., 3] > 0); out = [np.zeros_like(a) for _ in range(n)]
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        cx = (sl[1].start + sl[1].stop) / 2; j = min(n - 1, int(cx * n / w)); m = lab[sl] == i
        out[j][sl][m] = a[sl][m]
    return [Image.fromarray(o, 'RGBA') for o in out]

def process(sid, src_dir, out_dir):
    fname, n, colour, (cw, ch), how, align = SHEETS[sid]
    im = to_rgba(Image.open(os.path.join(src_dir, fname)), colour)
    frames = []
    for f in cut(im, n, how):
        bb = f.getbbox(); frames.append(f.crop(bb) if bb else f)
    m = 4   # margin in the cell
    scale = min(min((cw - 2 * m) / f.width, (ch - 2 * m) / f.height) for f in frames)
    strip = Image.new('RGBA', (cw * n, ch), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        nw, nh = max(1, round(f.width * scale)), max(1, round(f.height * scale))
        g = f.resize((nw, nh), Image.LANCZOS)
        x = cw - m - nw if align == 'right' else (cw - nw) // 2
        strip.alpha_composite(g, (i * cw + x, (ch - nh) // 2))
    path = os.path.join(out_dir, sid + '.png'); strip.save(path, optimize=True)
    print('%-9s %d frames, cell %dx%d, scale %.3f -> %s' % (sid, n, cw, ch, scale, path))
    return {'frames': n, 'w': cw, 'h': ch, 'file': 'fx/%s.png' % sid}

def main():
    src_dir = sys.argv[1]; art_dir = sys.argv[2] if len(sys.argv) > 2 else 'art'
    out_dir = os.path.join(art_dir, 'fx'); os.makedirs(out_dir, exist_ok=True)
    mpath = os.path.join(art_dir, 'manifest.json'); manifest = json.load(open(mpath))
    manifest['fx'] = {sid: process(sid, src_dir, out_dir) for sid in SHEETS}
    json.dump(manifest, open(mpath, 'w'), indent=2)

if __name__ == '__main__':
    main()
