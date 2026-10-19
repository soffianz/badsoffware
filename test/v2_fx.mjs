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
  const { FX, fxStep, P, resetPlayer, applyTag, applyHijack, usePower, catchBadsoff, S, L, buildLayout, FLOOR } = window.__bsw;
  const out = {};
  S.ph = 'play'; // usePower() only works mid-round

  // tag: burst + ring + shake
  buildLayout(0);
  resetPlayer(P[0], 0, 2); resetPlayer(P[1], 1, 2); P[0].active = true; P[1].active = true; P[0].it = true;
  FX.parts.length = 0; FX.rings.length = 0; FX.shakeMag = 0; FX.shakeT = 0;
  applyTag(P[0], P[1]);
  out.tagParts = FX.parts.length; out.tagRings = FX.rings.length; out.tagShake = FX.shakeMag > 0;

  // particles decay and get removed over time
  fxStep(1); // 1s, well past any 0.3-0.4s effect life
  out.partsDecayed = FX.parts.length === 0; out.ringsDecayed = FX.rings.length === 0; out.shakeDecayed = FX.shakeMag === 0;

  // Dash Burst: trail particles spawn while dashing (stepPlayer's dashT branch)
  FX.parts.length = 0;
  P[0].held = 'bopster'; P[0].f = 1;
  usePower(P[0]);
  const { stepPlayer } = window.__bsw;
  stepPlayer(P[0], { move: 0, held: false, press: false, down: false }, 1 / 60, true);
  out.dashTrailSpawned = FX.parts.length > 0;

  // Ground Slam: ring + shake + burst on the stunned target
  FX.parts.length = 0; FX.rings.length = 0; FX.shakeMag = 0;
  resetPlayer(P[0], 0, 2); resetPlayer(P[1], 1, 2);
  P[0].x = 100; P[1].x = 110; P[0].y = FLOOR; P[1].y = FLOOR; P[0].held = 'grumpulator';
  usePower(P[0]);
  out.slamRing = FX.rings.length > 0; out.slamShake = FX.shakeMag > 0; out.slamBurstOnTarget = FX.parts.length > 0;

  // Hijack: ring + burst + shake on the new It
  FX.parts.length = 0; FX.rings.length = 0; FX.shakeMag = 0;
  resetPlayer(P[0], 0, 2); resetPlayer(P[1], 1, 2); P[0].it = true;
  applyHijack(P[1]);
  out.hijackFx = FX.rings.length > 0 && FX.parts.length > 0 && FX.shakeMag > 0;

  return out;
});
console.log(JSON.stringify(res, null, 2));
console.log(errs.length ? ('PAGE ERRORS: ' + JSON.stringify(errs)) : 'no page errors');
await browser.close();

const checks = {
  tagParts: 'tag did not spawn particles', tagRings: 'tag did not spawn a ring', tagShake: 'tag did not trigger shake',
  partsDecayed: 'particles never decay', ringsDecayed: 'rings never decay', shakeDecayed: 'shake never decays',
  dashTrailSpawned: 'dash did not spawn a trail particle', slamRing: 'ground slam did not spawn a ring',
  slamShake: 'ground slam did not trigger shake', slamBurstOnTarget: 'ground slam did not burst on the stunned target',
  hijackFx: 'hijack did not trigger its ring+burst+shake combo',
};
const fail = Object.keys(checks).filter(k => !res[k]).map(k => checks[k]);
if (errs.length) fail.push('page errors present');
if (fail.length) { console.error('FAIL:\n' + fail.join('\n')); process.exit(1); }
console.log('ALL CHECKS PASSED');
