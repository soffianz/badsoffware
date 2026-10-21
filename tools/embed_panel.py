"""Embed art/panel/ (tools/process_panel.py output) into index.html as data URIs, between the
PANEL_DATA markers. Run from the project root after process_panel.py."""
import base64, json, re, os

names = ['base', 'seam', 'well', 'knob', 'knob_down', 'jump', 'pwr_bezel', 'pwr_cap']
out = {n: 'data:image/webp;base64,' + base64.b64encode(open(f'art/panel/{n}.webp', 'rb').read()).decode() for n in names}
js = 'const PANEL_DATA = ' + json.dumps(out, separators=(',', ':')) + ';'
s = open('index.html').read()
block = '/*PANEL_DATA_START*/\n' + js + '\n/*PANEL_DATA_END*/'
if '/*PANEL_DATA_START*/' in s:
    s, n = re.subn(r'/\*PANEL_DATA_START\*/.*?/\*PANEL_DATA_END\*/', lambda m: block, s, flags=re.S)
else:
    s, n = re.subn(r'(/\*SCENERY_DATA_END\*/)', lambda m: m.group(1) + '\n' + block, s, count=1)
assert n == 1, 'could not place PANEL_DATA'
open('index.html', 'w').write(s)
print('embedded', len(js) // 1024, 'KB of control panel art into index.html')
