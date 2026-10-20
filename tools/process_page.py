#!/usr/bin/env python3
"""
BSWV21 Page tileset pipeline: the scenery (far/mid background layers, platform skins,
rooftop/street props) that replaces the flat-colour greybox platforms and plain dark
background. Same green-screen chroma key as process_bswv21.py.

Usage: python3 tools/process_page.py <raw_dir> <out_dir>
"""
import sys, os, json
from PIL import Image

def chroma_key(im):
    im = im.convert('RGBA'); px = im.load(); w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if g > r + 30 and g > b + 30 and g > 100:
                px[x, y] = (r, g, b, 0)
    return im

def trim(im):
    bbox = im.getbbox()
    return im.crop(bbox) if bbox else im

def main():
    raw_dir, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)
    manifest = {}

    # Far background: already opaque (no green screen), a night skyline. Scale to playfield
    # width (390) keeping aspect, used as a slow-parallax backdrop tiled/clamped vertically.
    far = Image.open(os.path.join(raw_dir, 'BSWV21_Page_Far_Background.png')).convert('RGBA')
    fw, fh = far.size
    scale = 390 / fw
    far = far.resize((390, round(fh * scale)), Image.LANCZOS).convert('RGB')
    far.save(os.path.join(out_dir, 'bg_far.webp'), 'WEBP', quality=82, method=6)
    manifest['bg_far'] = {'w': far.width, 'h': far.height}
    print('bg_far', far.size)

    # Middle background: green screen flanking an open lane (where the tower sits). Chroma-key,
    # scale to playfield width, tiles vertically to cover the world height.
    mid = chroma_key(Image.open(os.path.join(raw_dir, 'BSWV21_Page_Middle_Background.png')))
    mw, mh = mid.size
    scale = 390 / mw
    mid = mid.resize((390, round(mh * scale)), Image.NEAREST)
    mid.save(os.path.join(out_dir, 'bg_mid.webp'), 'WEBP', quality=86, method=6, lossless=False)
    manifest['bg_mid'] = {'w': mid.width, 'h': mid.height}
    print('bg_mid', mid.size)

    # Platform tileset: 4 skins (rows) x 3 pieces (left cap / middle-repeat / right cap).
    tiles = chroma_key(Image.open(os.path.join(raw_dir, 'BSWV21_Page_Platform_Tileset.png')))
    tw, th = tiles.size
    cols, rows = 3, 4
    cw, ch = tw // cols, th // rows
    TARGET_H = 18  # in-game platform thickness
    skins = []
    for r in range(rows):
        pieces = []
        # normalize the whole skin to one scale, from the middle piece's trimmed height
        mid_cell = trim(tiles.crop((cw, r * ch, 2 * cw, (r + 1) * ch)))
        sc = TARGET_H / mid_cell.size[1]
        for c, tag in enumerate(['left', 'mid', 'right']):
            cell = trim(tiles.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch)))
            nw, nh = max(1, round(cell.size[0] * sc)), max(1, round(cell.size[1] * sc))
            cell = cell.resize((nw, nh), Image.NEAREST)
            fname = f'plat_skin{r}_{tag}.png'
            cell.save(os.path.join(out_dir, fname))
            pieces.append({'tag': tag, 'file': fname, 'w': nw, 'h': nh})
        skins.append(pieces)
        print('platform skin', r, [(p['tag'], p['w'], p['h']) for p in pieces])
    manifest['platform_skins'] = skins

    # Rooftop props: 8 items in a 4x2 grid. The billboard-frame prop (row 1, col 1) becomes the
    # actual billboard Badsoffwares spawn from, replacing the plain dark rectangle.
    props = chroma_key(Image.open(os.path.join(raw_dir, 'BSWV21_Page_Rooftop_Props.png')))
    pw, ph = props.size
    pcols, prows = 4, 2
    pcw, pch = pw // pcols, ph // prows
    names = ['ac_unit', 'dish', 'water_tank', 'antenna', 'neon_sign', 'billboard', 'street_lamp', 'crates']
    manifest['props'] = {}
    for i, name in enumerate(names):
        r, c = i // pcols, i % pcols
        cell = trim(props.crop((c * pcw, r * pch, (c + 1) * pcw, (r + 1) * pch)))
        target_h = 56 if name == 'billboard' else 40
        sc = target_h / cell.size[1]
        nw, nh = max(1, round(cell.size[0] * sc)), max(1, round(cell.size[1] * sc))
        cell = cell.resize((nw, nh), Image.NEAREST)
        fname = f'prop_{name}.png'
        cell.save(os.path.join(out_dir, fname))
        manifest['props'][name] = {'file': fname, 'w': nw, 'h': nh}
        print('prop', name, nw, nh)

    with open(os.path.join(out_dir, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=2)
    print('manifest written to', os.path.join(out_dir, 'manifest.json'))

if __name__ == '__main__':
    main()
