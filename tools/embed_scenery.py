"""Embed art/scenery/ (tools/process_page.py output) into index.html as data URIs, between the
SCENERY_DATA markers. Run from the project root after process_page.py."""
import base64, json, re, os

def b64(path):
    ext = os.path.splitext(path)[1].lstrip('.')
    mime = {'png': 'image/png', 'webp': 'image/webp'}[ext]
    return f'data:{mime};base64,' + base64.b64encode(open(path, 'rb').read()).decode()

m = json.load(open('art/scenery/manifest.json'))
out = {
    'bgFar': b64(os.path.join('art/scenery', 'bg_far.webp')),
    'bgMid': b64(os.path.join('art/scenery', 'bg_mid.webp')),
    'bgFarH': m['bg_far']['h'], 'bgMidH': m['bg_mid']['h'],
    'platformSkins': [[{'tag': p['tag'], 'w': p['w'], 'h': p['h'], 'src': b64(os.path.join('art/scenery', p['file']))} for p in skin] for skin in m['platform_skins']],
    'props': {name: {'w': p['w'], 'h': p['h'], 'src': b64(os.path.join('art/scenery', p['file']))} for name, p in m['props'].items()},
}
js = 'const SCENERY_DATA = ' + json.dumps(out, separators=(',', ':')) + ';'
s = open('index.html').read()
block = '/*SCENERY_DATA_START*/\n' + js + '\n/*SCENERY_DATA_END*/'
s, n = re.subn(r'/\*SCENERY_DATA_START\*/.*?/\*SCENERY_DATA_END\*/', lambda m: block, s, flags=re.S)
assert n == 1, 'SCENERY_DATA markers missing from index.html'
open('index.html', 'w').write(s)
print('embedded', len(js) // 1024, 'KB of scenery into index.html')
