"""Embed approved art into index.html as data URIs (keeps the game a single file).
Replaces everything between the ART_DATA markers. Run after tools/make_bg.py."""
import base64, re
bg = base64.b64encode(open('assets/backgrounds/desktop_background_proto.webp', 'rb').read()).decode()
s = open('index.html').read()
block = "/*ART_DATA_START*/\nconst ART_DATA = { bg: 'data:image/webp;base64," + bg + "' };\n/*ART_DATA_END*/"
s, n = re.subn(r'/\*ART_DATA_START\*/.*?/\*ART_DATA_END\*/', lambda m: block, s, flags=re.S)
assert n == 1, 'markers missing'
open('index.html', 'w').write(s)
print('embedded', len(bg) // 1024, 'KB base64')
