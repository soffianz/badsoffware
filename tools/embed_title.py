"""Embed art/title/hero.webp (the title-screen hero, logo baked in) into index.html as a data URI,
between the TITLE_DATA markers. Run from the project root."""
import base64, re

src = 'data:image/webp;base64,' + base64.b64encode(open('art/title/hero.webp', 'rb').read()).decode()
js = 'const TITLE_DATA = {"hero":"' + src + '","w":848,"h":1854};'
s = open('index.html').read()
block = '/*TITLE_DATA_START*/\n' + js + '\n/*TITLE_DATA_END*/'
if '/*TITLE_DATA_START*/' in s:
    s, n = re.subn(r'/\*TITLE_DATA_START\*/.*?/\*TITLE_DATA_END\*/', lambda m: block, s, flags=re.S)
else:
    s, n = re.subn(r'(/\*SCENERY_DATA_END\*/)', lambda m: m.group(1) + '\n' + block, s, count=1)
assert n == 1, 'could not place TITLE_DATA block in index.html'
open('index.html', 'w').write(s)
print('embedded', len(js) // 1024, 'KB of title art into index.html')
