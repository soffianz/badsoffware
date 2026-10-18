"""Embed approved art into index.html as data URIs (keeps the game a single file).
Replaces everything between the ART_DATA markers. Run from the project root.
Roster order must match CONFIG.PILOTS in index.html (see assets/PILOT_ROSTER.json)."""
import base64, io, json, re, os
from PIL import Image

PILOTS = [p['id'] for p in json.load(open('assets/PILOT_ROSTER.json'))['pilots']]

def b64(path, mime):
    return 'data:%s;base64,%s' % (mime, base64.b64encode(open(path, 'rb').read()).decode()) if os.path.exists(path) else ''

def webp_b64(path, size=None):
    im = Image.open(path).convert('RGBA')
    if size: im = im.resize(size, Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'WEBP', lossless=True, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()

bg = 'assets/backgrounds/desktop_background.webp'
if not os.path.exists(bg): bg = 'assets/backgrounds/desktop_background_proto.webp'
sheets = [b64('assets/characters/%s/%s_sprites.png' % (p, p), 'image/png') for p in PILOTS]
ports = [webp_b64('assets/ui/%s_portrait.png' % p, (128, 128)) for p in PILOTS]
drones = [b64('assets/drones/%s.png' % n, 'image/png') for n in ('bopster', 'grumpulator', 'sneakfolder')]
lst = lambda a: '[' + ', '.join("'%s'" % x for x in a) + ']'
js = "const ART_DATA = { bg: '%s', sheets: %s, portraits: %s, drones: %s };" % (b64(bg, 'image/webp'), lst(sheets), lst(ports), lst(drones))
s = open('index.html').read()
block = "/*ART_DATA_START*/\n" + js + "\n/*ART_DATA_END*/"
s, n = re.subn(r'/\*ART_DATA_START\*/.*?/\*ART_DATA_END\*/', lambda m: block, s, flags=re.S)
assert n == 1, 'markers missing'
open('index.html', 'w').write(s)
print('pilots', PILOTS, 'embedded', len(js) // 1024, 'KB')
