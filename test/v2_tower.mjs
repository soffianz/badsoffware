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
  const { CONFIG, P, L, cam, LAYOUTS, buildLayout, checkReach, camSnap, camStep, stepPlayer, startLocal, FLOOR, WORLD_H, PLAY_H } = window.__bsw;
  const out = { layouts: [] };

  // reachability: every platform in every layout must trace back to the floor
  LAYOUTS.forEach((def, idx) => {
    buildLayout(idx);
    const reached = checkReach(L.plats);
    const unreached = L.plats.filter((p, i) => !reached[i]);
    out.layouts.push({ name: def.name, nPlats: L.plats.length, nBillboards: L.billboards.length, allReached: unreached.length === 0, unreachedCount: unreached.length });
  });

  // platform widths within spec (60-140px)
  buildLayout(0);
  out.widthsOk = L.plats.every(p => p.w >= 60 && p.w <= 140);
  // billboards: 6 per layout, 2 per zone
  out.billboardZones = { street: L.billboards.filter(b => b.zone === 'street').length, midrise: L.billboards.filter(b => b.zone === 'midrise').length, rooftop: L.billboards.filter(b => b.zone === 'rooftop').length };

  // landing on a real platform (not just the floor)
  buildLayout(0);
  const plat = L.plats.find(p => p.row === 0);
  const p0 = P[0];
  p0.active = true; p0.x = plat.x + plat.w / 2; p0.y = plat.y - 100; p0.vx = 0; p0.vy = 300; p0.onGround = false; p0.standPl = null;
  const dt = 1 / 60, inp = { move: 0, held: false, press: false, down: false };
  for (let i = 0; i < 60 && !p0.onGround; i++) stepPlayer(p0, inp, dt, true);
  out.landedOnPlatform = p0.onGround && Math.abs(p0.y - plat.y) < 1 && p0.standPl === plat;

  // drop-through: holding down on a platform falls through it
  p0.y = plat.y; p0.vy = 0; p0.onGround = true; p0.standPl = plat; p0.x = plat.x + plat.w / 2;
  inp.down = true;
  stepPlayer(p0, inp, dt, true); // triggers dropT
  inp.down = false;
  let fellThrough = false;
  for (let i = 0; i < 40; i++) { stepPlayer(p0, inp, dt, true); if (p0.y > plat.y + 5) { fellThrough = true; break; } }
  out.dropThroughWorks = fellThrough;

  // camera: clamps within [0, WORLD_H-PLAY_H], follows player 0
  startLocal(1);
  P[0].y = 50; camSnap();
  out.camClampedTop = cam.y >= 0;
  P[0].y = FLOOR; camSnap();
  out.camClampedBottom = cam.y <= WORLD_H - PLAY_H;
  out.camFollowsFloor = Math.abs(cam.y - (WORLD_H - PLAY_H)) < 1;

  return out;
});
console.log(JSON.stringify(res, null, 2));
console.log(errs.length ? ('PAGE ERRORS: ' + JSON.stringify(errs)) : 'no page errors');
await browser.close();

const fail = [];
res.layouts.forEach(l => { if (!l.allReached) fail.push(l.name + ': ' + l.unreachedCount + ' platform(s) unreachable'); if (l.nBillboards !== 6) fail.push(l.name + ': expected 6 billboards, got ' + l.nBillboards); });
if (!res.widthsOk) fail.push('platform widths out of 60-140px range');
if (res.billboardZones.street !== 2 || res.billboardZones.midrise !== 2 || res.billboardZones.rooftop !== 2) fail.push('billboard zones not 2/2/2: ' + JSON.stringify(res.billboardZones));
if (!res.landedOnPlatform) fail.push('did not land cleanly on a platform');
if (!res.dropThroughWorks) fail.push('drop-through did not work');
if (!res.camClampedTop) fail.push('camera not clamped at top');
if (!res.camClampedBottom) fail.push('camera not clamped at bottom');
if (!res.camFollowsFloor) fail.push('camera did not snap to floor view');
if (errs.length) fail.push('page errors present');
if (fail.length) { console.error('FAIL:\n' + fail.join('\n')); process.exit(1); }
console.log('ALL CHECKS PASSED');
