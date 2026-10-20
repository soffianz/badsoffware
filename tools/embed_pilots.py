"""Embed the character-select art into index.html between the PILOT_DATA markers: the four 512px
profile portraits in art/pilots/ (downscaled to 192px webp) and the power icons from
assets/weapons/. To add or replace a pilot's portrait, drop art/pilots/<id>_portrait.png and
rerun. Run from the project root."""
import base64, io, json, re
from PIL import Image

PILOTS = ['patch', 'bolt', 'glitch', 'rumble']
ICONS = [('patchcable', 'patch_cable'), ('zappulse', 'zap_pulse'), ('phaseblink', 'phase_blink'), ('groundslam', 'ground_slam')]

def webp(im, q):
    b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6)
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()

out = {'portraits': {}, 'icons': {}}
for n in PILOTS:
    out['portraits'][n] = webp(Image.open(f'art/pilots/{n}_portrait.png').convert('RGB').resize((192, 192), Image.LANCZOS), 86)
for pid, f in ICONS:
    out['icons'][pid] = webp(Image.open(f'assets/weapons/{f}_icon.png').convert('RGBA').resize((96, 96), Image.LANCZOS), 90)
js = 'const PILOT_DATA = ' + json.dumps(out, separators=(',', ':')) + ';'
s = open('index.html').read()
block = '/*PILOT_DATA_START*/\n' + js + '\n/*PILOT_DATA_END*/'
if '/*PILOT_DATA_START*/' in s:
    s, n = re.subn(r'/\*PILOT_DATA_START\*/.*?/\*PILOT_DATA_END\*/', lambda m: block, s, flags=re.S)
else:
    s, n = re.subn(r'(/\*TITLE_DATA_END\*/)', lambda m: m.group(1) + '\n' + block, s, count=1)
assert n == 1, 'could not place PILOT_DATA block in index.html'
open('index.html', 'w').write(s)
print('embedded', len(js) // 1024, 'KB of pilot art into index.html')
