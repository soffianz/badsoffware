import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
await ctx.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/, r => r.abort());
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto('http://localhost:8123/index.html'); await page.waitForTimeout(2500);
const res = await page.evaluate(() => {
  __bsw.startLocal('bot'); S.ph = 'play'; S.t = 1e6; HOST.gt = 5000;
  const p = P[0]; p.x = 420; p.y = FLOOR; p.vx = 0; p.vy = 0; p.onGround = true;
  const dt = 1 / 60, out = {};
  const run = (frames, f) => { for (let i = 0; i < frames; i++) f(i); };
  // settle
  const inp = { move: 0, held: false, press: false, down: false };
  run(30, () => stepPlayer(p, inp, dt, true, 1, 1));
  // single jump, hold
  let minY = p.y; inp.press = true; inp.held = true; stepPlayer(p, inp, dt, true, 1, 1); inp.press = false;
  run(120, () => { stepPlayer(p, inp, dt, true, 1, 1); minY = Math.min(minY, p.y); });
  out.single = Math.round(FLOOR - minY);
  // jump + double jump at apex
  inp.held = true; inp.press = true; stepPlayer(p, inp, dt, true, 1, 1); inp.press = false; minY = p.y; let did = false;
  run(160, () => { if (!did && p.vy > 0 && p.vy < 40) { inp.press = true; did = true; } else inp.press = false; stepPlayer(p, inp, dt, true, 1, 1); minY = Math.min(minY, p.y); });
  out.double = Math.round(FLOOR - minY);
  // tap jump
  inp.held = false; run(30, () => stepPlayer(p, inp, dt, true, 1, 1));
  inp.press = true; inp.held = true; stepPlayer(p, inp, dt, true, 1, 1); inp.press = false; run(3, () => stepPlayer(p, inp, dt, true, 1, 1)); inp.held = false; minY = p.y;
  run(100, () => { stepPlayer(p, inp, dt, true, 1, 1); minY = Math.min(minY, p.y); });
  out.tap = Math.round(FLOOR - minY);
  // run speed
  inp.move = 1; run(60, () => stepPlayer(p, inp, dt, true, 1, 1)); out.vx = Math.round(p.vx);
  inp.move = 1; run(60, () => stepPlayer(p, inp, dt, true, 1.5, 1)); out.vxBoost = Math.round(p.vx);
  // wrap
  p.x = 840; p.vx = 220; inp.move = 1; run(10, () => stepPlayer(p, inp, dt, true, 1, 1)); out.wrapX = Math.round(p.x);
  // reach each platform from floor with a scripted jump (single/double) : check via simple simulation search
  out.reach = [];
  return out;
});
console.log(JSON.stringify(res)); console.log(errs.length ? errs : 'no errors');
await browser.close();
