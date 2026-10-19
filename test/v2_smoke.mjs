import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto('http://localhost:8123/index.html');
await page.waitForTimeout(500);

const res = await page.evaluate(() => {
  const out = {};
  const { CONFIG, P, S, stepPlayer, resetPlayer, startLocal, tick, applyTag, tagAllowed, hitGap, wrapX, FLOOR } = window.__bsw;

  // physics: single jump height, run speed, wrap
  resetPlayer(P[0], 0, 1); P[0].active = true;
  const dt = 1 / 60, inp = { move: 0, held: false, press: false, down: false };
  const run = (n, f) => { for (let i = 0; i < n; i++) f(i); };
  run(10, () => stepPlayer(P[0], inp, dt, true));
  inp.press = true; inp.held = true; stepPlayer(P[0], inp, dt, true); inp.press = false;
  let minY = P[0].y;
  run(120, () => { stepPlayer(P[0], inp, dt, true); minY = Math.min(minY, P[0].y); });
  out.jumpHeight = Math.round(FLOOR - minY);

  inp.held = false; resetPlayer(P[0], 0, 1); inp.move = 1;
  run(60, () => stepPlayer(P[0], inp, dt, true));
  out.runSpeed = Math.round(P[0].vx);

  P[0].x = 385; P[0].vx = 220; run(10, () => stepPlayer(P[0], inp, dt, true));
  out.wrapped = P[0].x < 390 && P[0].x >= 0;

  // It-tag mechanics: 4 players, host-free local round
  startLocal(3); // 1 human + 3 bots = 4 slots
  out.activeCount = P.filter(p => p.active).length;
  const itCountBefore = P.filter(p => p.it).length;
  S.ph = 'play'; S.t = 50000;
  const itP = P.find(p => p.it), other = P.find(p => !p.it);
  itP.x = other.x; itP.y = other.y; itP.frozen = 0; other.frozen = 0; itP.tagCd = 0; other.tagCd = 0;
  const allowedBefore = tagAllowed(itP, other);
  applyTag(itP, other);
  out.tagFlips = (!itP.it && other.it && other.frozen > 0);
  out.itCountBefore = itCountBefore;
  out.allowedBefore = allowedBefore;

  // It clock only accrues for the It robot, during play
  P.forEach(p => { p.itClock = 0; p.it = false; });
  P[0].it = true; P[0].active = true;
  run(60, () => { P.forEach(p => { if (p.active && p.it) p.itClock += dt * 1000; }); });
  out.itClockAccrued = Math.round(P[0].itClock);
  out.nonItClockZero = P[1].itClock === 0;

  return out;
});
console.log(JSON.stringify(res, null, 2));
console.log(errs.length ? ('PAGE ERRORS: ' + JSON.stringify(errs)) : 'no page errors');
await browser.close();

const fail = [];
if (res.jumpHeight < 90 || res.jumpHeight > 130) fail.push('jumpHeight out of range: ' + res.jumpHeight);
if (res.runSpeed < 210 || res.runSpeed > 230) fail.push('runSpeed out of range: ' + res.runSpeed);
if (!res.wrapped) fail.push('wrap failed');
if (res.activeCount !== 4) fail.push('activeCount != 4: ' + res.activeCount);
if (res.itCountBefore !== 1) fail.push('itCountBefore != 1: ' + res.itCountBefore);
if (!res.allowedBefore) fail.push('tagAllowed was false when it should be true');
if (!res.tagFlips) fail.push('tag did not flip It');
if (res.itClockAccrued < 990 || res.itClockAccrued > 1010) fail.push('itClock did not accrue correctly: ' + res.itClockAccrued);
if (!res.nonItClockZero) fail.push('non-It robot accrued It clock');
if (errs.length) fail.push('page errors present');
if (fail.length) { console.error('FAIL:\n' + fail.join('\n')); process.exit(1); }
console.log('ALL CHECKS PASSED');
