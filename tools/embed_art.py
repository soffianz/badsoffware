"""Embed approved art into index.html as data URIs (keeps the game a single file).
Replaces everything between the ART_DATA markers. Run after tools/make_bg.py and tools/make_sprites.mjs."""
import base64, re, os
def b64(path, mime):
    return 'data:%s;base64,%s' % (mime, base64.b64encode(open(path, 'rb').read()).decode()) if os.path.exists(path) else ''
d = {
  'bg': b64('assets/backgrounds/desktop_background_proto.webp', 'image/webp'),
  'patch': b64('assets/characters/patch/patch_sprites.png', 'image/png'),
  'bolt': b64('assets/characters/bolt/bolt_sprites.png', 'image/png'),
}
drones = [b64('assets/drones/%s.png' % n, 'image/png') for n in ('bopster', 'grumpulator', 'sneakfolder')]
js = "const ART_DATA = { bg: '%s', patch: '%s', bolt: '%s', drones: [%s] };" % (d['bg'], d['patch'], d['bolt'], ', '.join("'%s'" % x for x in drones))
s = open('index.html').read()
block = "/*ART_DATA_START*/\n" + js + "\n/*ART_DATA_END*/"
s, n = re.subn(r'/\*ART_DATA_START\*/.*?/\*ART_DATA_END\*/', lambda m: block, s, flags=re.S)
assert n == 1, 'markers missing'
open('index.html', 'w').write(s)
print('embedded', len(js) // 1024, 'KB')
