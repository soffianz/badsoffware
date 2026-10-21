#!/usr/bin/env python3
"""
Control panel art (Option B, the clean console). Takes the ChatGPT magenta-background pieces,
keys the magenta out, crops each piece and writes game-sized WebP sprites to art/panel/ at 2x
logical px (the canvas is DPR-capped at 2). Then run tools/embed_panel.py.

Usage: python3 tools/process_panel.py <extracted Badsoffware_Artwork dir> art/panel
"""
import sys, os
import numpy as np
from PIL import Image

def key_magenta(im):
    a = np.array(im.convert('RGBA')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mag = (r > g + 70) & (b > g + 70)
    alpha = np.where(mag, 0, 255)
    # two passes: drop pinkish fringe pixels that touch a keyed pixel (outline blended with magenta)
    for _ in range(2):
        t = alpha == 0
        near = np.zeros_like(t)
        near[1:] |= t[:-1]; near[:-1] |= t[1:]; near[:, 1:] |= t[:, :-1]; near[:, :-1] |= t[:, 1:]
        pink = ((r + b) / 2 > g + 22) & (alpha > 0) & near
        alpha = np.where(pink, 0, alpha)
    a[..., 3] = alpha
    # despill what is left of the magenta cast on the dark outline
    m = (r + b) // 2
    a[..., 0] = np.where((alpha > 0) & (r > m) & (r > g + 14), (r + g) // 2, r)
    a[..., 2] = np.where((alpha > 0) & (b > m) & (b > g + 14), (b + g) // 2, b)
    return Image.fromarray(a.astype('uint8'), 'RGBA')

def largest_piece(im):
    """Drop stray specks: keep only the biggest connected blob of opaque pixels."""
    a = np.array(im); opaque = a[..., 3] > 0
    seen = np.zeros(opaque.shape, bool); best = []
    h, w = opaque.shape
    for y0, x0 in zip(*np.nonzero(opaque)):
        if seen[y0, x0]: continue
        blob, stack = [], [(y0, x0)]; seen[y0, x0] = True
        while stack:
            y, x = stack.pop(); blob.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and opaque[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; stack.append((ny, nx))
        if len(blob) > len(best): best = blob
    keep = np.zeros(opaque.shape, bool)
    for y, x in best: keep[y, x] = True
    a[..., 3] = np.where(keep, a[..., 3], 0)
    return Image.fromarray(a, 'RGBA')

def keyed_crop(im, box=None):
    k = largest_piece(key_magenta(im.crop(box) if box else im))
    return k.crop(k.getbbox())

def ball_only(k):
    """Square-crop the glossy ball and mask off the stem peeking out underneath."""
    from PIL import ImageDraw
    k = k.crop((0, 0, k.width, k.width))
    m = Image.new('L', k.size, 0); ImageDraw.Draw(m).ellipse((0, 0, k.width - 1, k.width - 1), fill=255)
    a = np.array(k); a[..., 3] = np.minimum(a[..., 3], np.array(m)); return Image.fromarray(a, 'RGBA')

def fit(im, w=None, h=None):
    if w is None: w = round(im.width * h / im.height)
    if h is None: h = round(im.height * w / im.width)
    return im.resize((w, h), Image.LANCZOS)

def build_base(frame, out_w, out_h, cw, ch):
    """9-slice the console frame onto the fixed 780x480 panel (the panel is always 390x240 logical)."""
    W, H = frame.size
    s = out_w / W
    ocw, och = round(cw * s), round(ch * s)
    src = lambda x0, y0, x1, y1: frame.crop((x0, y0, x1, y1))
    out = Image.new('RGBA', (out_w, out_h), (0, 0, 0, 0))
    xs, ys = [0, cw, W - cw, W], [0, ch, H - ch, H]
    xo, yo = [0, ocw, out_w - ocw, out_w], [0, och, out_h - och, out_h]
    for j in range(3):
        for i in range(3):
            piece = src(xs[i], ys[j], xs[i + 1], ys[j + 1])
            tw, th = xo[i + 1] - xo[i], yo[j + 1] - yo[j]
            out.alpha_composite(piece.resize((tw, th), Image.LANCZOS), (xo[i], yo[j]))
    return out

def tint_ready(cap):
    """Greyscale the (yellow) cap and stretch it so the game can tint it per power with multiply."""
    a = np.array(cap).astype(float)
    lum = 0.30 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]
    vis = a[..., 3] > 0
    lo, hi = np.percentile(lum[vis], 3), np.percentile(lum[vis], 99)
    g = np.clip((lum - lo) / (hi - lo), 0, 1) * 0.65 + 0.35
    a[..., 0] = a[..., 1] = a[..., 2] = g * 255
    return Image.fromarray(a.astype('uint8'), 'RGBA')

def main():
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    P = lambda n: Image.open(os.path.join(src, n))
    save = lambda im, n: (im.save(os.path.join(out, n + '.webp'), 'WEBP', lossless=True, quality=100, method=6), print(n, im.size))

    frame = keyed_crop(P('a_clean_flat_vector_cartoon_sci_fi_ui_panel_illu.png'))
    save(build_base(frame, 780, 480, 215, 215), 'base')
    save(fit(keyed_crop(P('a_clean_flat_styled_vector_cel_shaded_sci_fi_illu.png')), w=280), 'well')
    # knob: just the glossy ball (the stem and base are part of the well socket in-game)
    ball = P('a_clean_vibrant_cartoon_vector_style_illustratio.png').crop((255, 130, 998, 840))
    save(fit(ball_only(keyed_crop(ball)), w=104), 'knob')
    ball2 = P('a_clean_vector_style_illustration_on_a_solid_brigh.png').crop((255, 130, 998, 840))
    save(fit(ball_only(keyed_crop(ball2)), w=104), 'knob_down')
    sheet = P('a_clean_graphic_illustration_on_a_bright_magenta_m.png')
    save(fit(keyed_crop(sheet, (565, 795, 1020, 1105)), w=208), 'jump')
    save(fit(keyed_crop(sheet, (20, 1030, 365, 1365)), w=184), 'pwr_bezel')
    save(fit(tint_ready(keyed_crop(sheet, (368, 1085, 640, 1335))), w=104), 'pwr_cap')
    seam = keyed_crop(P('wide_horizontal_illustration_on_a_vivid_solid_mage.png'))
    save(fit(seam, w=780), 'seam')

if __name__ == '__main__':
    main()
