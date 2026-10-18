"""Prepare the prototype desktop background for embedding.
- removes the two floating window-like bars baked into the concept crop (they would read as platforms)
- exports a compact WebP that build_bg_inline() embeds in index.html as a data URI
Usage: python3 tools/make_bg.py   (needs Pillow + numpy)"""
import base64, io
import numpy as np
from PIL import Image, ImageFilter

SRC = 'assets/backgrounds/desktop_background_reference.png'
OUT = 'assets/backgrounds/desktop_background_proto.webp'
BARS = [(300, 186, 570, 260), (1162, 254, 1426, 330)]   # x0,y0,x1,y1 in the 1688x780 source

im = Image.open(SRC).convert('RGB')
a = np.asarray(im).astype(np.float32)
for x0, y0, x1, y1 in BARS:
    top = a[y0 - 1, x0:x1].copy(); bot = a[y1 + 1, x0:x1].copy()
    for i, y in enumerate(range(y0, y1 + 1)):
        t = i / max(1, y1 - y0)
        a[y, x0:x1] = top * (1 - t) + bot * t
im = Image.fromarray(a.clip(0, 255).astype(np.uint8))
for x0, y0, x1, y1 in BARS:      # soften the patch so it blends into the skyline
    pad = 10; box = (x0 - pad, y0 - pad, x1 + pad, y1 + pad)
    blurred = im.crop(box).filter(ImageFilter.GaussianBlur(7))
    mask = Image.new('L', blurred.size, 0); mask.paste(255, (pad // 2, pad // 2, blurred.size[0] - pad // 2, blurred.size[1] - pad // 2))
    im.paste(blurred, box[:2], mask.filter(ImageFilter.GaussianBlur(4)))
im.save(OUT, 'WEBP', quality=72, method=6)
print(OUT, len(open(OUT, 'rb').read()) // 1024, 'KB')
