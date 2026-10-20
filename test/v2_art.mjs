import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto('http://localhost:8123/index.html');
await page.waitForTimeout(600); // let the embedded data-URI images decode

const res = await page.evaluate(() => {
  const { Art, CONFIG, P, S, resetPlayer } = window.__bsw;
  const out = { artReady: Art.ready, robots: {}, badsoffwares: Object.keys(Art.badsoffwares) };
  for (const id of CONFIG.ROBOTS.map(r => r.id)) {
    const r = Art.robots[id];
    out.robots[id] = r ? Object.keys(r.anims) : null;
  }
  // pickRobotAnim: covers tagged/jump/fall/run/idle selection
  const p = P[0]; resetPlayer(p, 0, 1); p.active = true;
  const anims = [];
  p.frozen = 0; p.onGround = true; p.vx = 0; anims.push(window.__bsw.pickRobotAnim ? window.__bsw.pickRobotAnim(p) : 'n/a');
  return out;
});
// every robot frame must be ONE figure: a strip cut at the wrong frame count squeezes several poses into
// one cell (Bolt's fall once showed four tiny copies of him), which looks like several columns of art
const split = await page.evaluate(() => {
  const bad = [];
  for (const n in window.__bsw.Art.robots) for (const a in window.__bsw.Art.robots[n].anims) {
    const { img, frames } = window.__bsw.Art.robots[n].anims[a], fw = img.width / frames;
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
    const data = g.getImageData(0, 0, img.width, img.height).data;
    for (let f = 0; f < frames; f++) {
      let runs = 0, prev = false;
      for (let x = Math.round(f * fw); x < Math.round((f + 1) * fw); x++) {
        let any = false; for (let y = 0; y < img.height && !any; y++) if (data[(y * img.width + x) * 4 + 3] > 10) any = true;
        if (any && !prev) runs++; prev = any;
      }
      if (runs >= 3) bad.push(n + '.' + a + ' frame ' + f + ' has ' + runs + ' separate columns of art');
    }
  }
  return bad;
});
console.log(JSON.stringify(res, null, 2));
console.log(errs.length ? ('PAGE ERRORS: ' + JSON.stringify(errs)) : 'no page errors');
await browser.close();

const fail = [];
if (!res.artReady) fail.push('Art.ready never became true - embedded art failed to decode');
for (const id of ['patch', 'bolt', 'glitch', 'rumble']) {
  const anims = res.robots[id];
  if (!anims) { fail.push(id + ': no art loaded'); continue; }
  for (const need of ['idle', 'run', 'jump', 'fall', 'land', 'tagged']) if (!anims.includes(need)) fail.push(id + ': missing ' + need + ' animation');
}
for (const b of split) fail.push(b);
for (const id of ['bopster', 'grumpulator', 'sneakfolder', 'hijacker']) if (!res.badsoffwares.includes(id)) fail.push(id + ': no Badsoffware art loaded');
if (errs.length) fail.push('page errors present');
if (fail.length) { console.error('FAIL:\n' + fail.join('\n')); process.exit(1); }
console.log('ALL CHECKS PASSED');
