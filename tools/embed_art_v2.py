"""Embed the processed BSWV21 art pack (art/) into index.html as data URIs, so the game stays
a single self-contained file. Replaces everything between the ART_DATA markers. Run from the
project root, after tools/process_bswv21.py has written art/manifest.json."""
import base64, json, re, os

def b64(path):
    return 'data:image/png;base64,' + base64.b64encode(open(path, 'rb').read()).decode()

manifest = json.load(open('art/manifest.json'))
robots = {}
for name, info in manifest['robots'].items():
    robots[name] = {'scale': info['scale'], 'anims': {a: {'frames': d['frames'], 'src': b64(os.path.join('art', d['file']))} for a, d in info['anims'].items()}}
badsoff = {}
for name, info in manifest['badsoffwares'].items():
    badsoff[name] = {'anims': {a: {'frames': d['frames'], 'src': b64(os.path.join('art', d['file']))} for a, d in info['anims'].items()}}

fx = {fid: {'frames': d['frames'], 'w': d['w'], 'h': d['h'], 'src': b64(os.path.join('art', d['file']))} for fid, d in manifest.get('fx', {}).items()}

js = 'const ART_DATA = ' + json.dumps({'robots': robots, 'badsoffwares': badsoff, 'fx': fx}, separators=(',', ':')) + ';'
s = open('index.html').read()
block = '/*ART_DATA_START*/\n' + js + '\n/*ART_DATA_END*/'
s, n = re.subn(r'/\*ART_DATA_START\*/.*?/\*ART_DATA_END\*/', lambda m: block, s, flags=re.S)
assert n == 1, 'ART_DATA markers missing from index.html'
open('index.html', 'w').write(s)
print('embedded', len(js) // 1024, 'KB of art into index.html')
