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
  const { CONFIG, P, S, L, buildLayout, resetPlayer, stepPlayer, trySpawnBadsoff, catchBadsoff, applyHijack, usePower, wdx, FLOOR } = window.__bsw;
  const out = {};
  const dt = 1 / 60, inp = { move: 0, held: false, press: false, down: false };

  buildLayout(0);
  resetPlayer(P[0], 0, 4); resetPlayer(P[1], 1, 4); resetPlayer(P[2], 2, 4); resetPlayer(P[3], 3, 4);
  P.forEach(p => p.active = true);
  S.drones = []; S.feed = []; L.billboards.forEach(b => b.occupied = false);
  S.ph = 'play'; // usePower() only works mid-round

  // spawning: respects SPAWN_MAX and SPAWN_MAX_HIJACK
  for (let i = 0; i < 20; i++) { S.drones = S.drones.filter(d => true); trySpawnBadsoff(); } // force many spawn attempts
  out.respectsMax = S.drones.length <= CONFIG.SPAWN_MAX;
  out.respectsHijackCap = S.drones.filter(d => d.type === 'hijacker').length <= CONFIG.SPAWN_MAX_HIJACK;
  out.billboardsOccupiedMatch = S.drones.every(d => d.billboard.occupied);

  // catching a holdable Badsoffware fills the held slot
  S.drones = []; L.billboards.forEach(b => b.occupied = false);
  const bb = L.billboards[0]; bb.occupied = true;
  const d1 = { id: 1, type: 'bopster', x: bb.x, y: bb.y, billboard: bb, age: 0, spawnT: 0 };
  S.drones.push(d1);
  catchBadsoff(P[0], d1);
  out.caughtFillsSlot = P[0].held === 'bopster';
  out.droneRemovedOnCatch = S.drones.length === 0 && !bb.occupied;

  // Dash Burst: instant forward dash with no gravity, then a run-speed boost
  P[0].held = 'bopster'; P[0].f = 1; const x0 = P[0].x;
  usePower(P[0]);
  out.dashConsumedHeld = P[0].held === null;
  stepPlayer(P[0], inp, dt, true);
  out.dashMoved = wdx(x0, P[0].x) > 5;
  out.boostActiveAfterDash = P[0].boostT > 0;

  // Ground Slam: stuns everyone in range, leaves the user themself alone
  resetPlayer(P[0], 0, 4); resetPlayer(P[1], 1, 4); resetPlayer(P[2], 2, 4);
  P[0].x = 100; P[0].y = FLOOR; P[1].x = 150; P[1].y = FLOOR; P[2].x = 300; P[2].y = FLOOR; // P2 far (wrap-aware gap ~190px, outside SLAM_R)
  P[0].held = 'grumpulator';
  usePower(P[0]);
  out.slamStunsNear = P[1].stun > 0;
  out.slamSparesSelf = P[0].stun === 0;
  out.slamSparesFar = P[2].stun === 0;

  // Phase Blink: teleports forward and leaves a cosmetic decoy
  resetPlayer(P[0], 0, 4); P[0].f = 1; const bx = P[0].x;
  P[0].held = 'sneakfolder';
  usePower(P[0]);
  out.blinkMoved = Math.abs(wdx(bx, P[0].x) - CONFIG.BLINK_D) < 1;
  out.blinkLeftDecoy = !!P[0].decoy;

  // Hijack: instant on catch, flips It to a random OTHER robot, applies freeze+cooldown
  resetPlayer(P[0], 0, 4); resetPlayer(P[1], 1, 4); resetPlayer(P[2], 2, 4); resetPlayer(P[3], 3, 4);
  P.forEach(p => p.it = false); P[0].it = true;
  applyHijack(P[1]);
  out.hijackFlippedIt = !P[0].it && P.filter(p => p.it).length === 1;
  const newIt = P.find(p => p.it);
  out.hijackAppliedFreeze = newIt.frozen > 0;
  out.hijackNeverPutsInHeldSlot = !CONFIG.BADSOFF.hijacker.holdable;

  // held power-up survives a tag, cleared at round end
  resetPlayer(P[0], 0, 2); resetPlayer(P[1], 1, 2); P[0].active = true; P[1].active = true;
  P[0].it = true; P[1].held = 'bopster'; P[0].x = P[1].x; P[0].y = P[1].y; P[0].frozen = 0; P[1].frozen = 0; P[0].tagCd = 0; P[1].tagCd = 0;
  window.__bsw.applyTag(P[0], P[1]);
  out.heldSurvivesTag = P[1].held === 'bopster';
  S.ph = 'play'; S.t = 1;
  window.__bsw.tick(50);
  out.heldClearedAtRoundEnd = P.every(p => p.held === null);

  return out;
});
console.log(JSON.stringify(res, null, 2));
console.log(errs.length ? ('PAGE ERRORS: ' + JSON.stringify(errs)) : 'no page errors');
await browser.close();

const checks = {
  respectsMax: 'spawn cap exceeded', respectsHijackCap: 'hijacker cap exceeded', billboardsOccupiedMatch: 'billboard occupied flags out of sync',
  caughtFillsSlot: 'catching a holdable did not fill held slot', droneRemovedOnCatch: 'drone/billboard not freed on catch',
  dashConsumedHeld: 'dash did not consume held power-up', dashMoved: 'dash did not move the robot', boostActiveAfterDash: 'no speed boost after dash',
  slamStunsNear: 'ground slam did not stun a nearby robot', slamSparesSelf: 'ground slam stunned its own user', slamSparesFar: 'ground slam hit someone out of range',
  blinkMoved: 'phase blink did not teleport the expected distance', blinkLeftDecoy: 'phase blink left no decoy',
  hijackFlippedIt: 'hijack did not flip It to exactly one other robot', hijackAppliedFreeze: 'hijack did not apply freeze to the new It', hijackNeverPutsInHeldSlot: 'hijacker is marked holdable',
  heldSurvivesTag: 'held power-up was cleared by a tag (should survive)', heldClearedAtRoundEnd: 'held power-up not cleared at round end',
};
const fail = Object.keys(checks).filter(k => !res[k]).map(k => checks[k]);
if (errs.length) fail.push('page errors present');
if (fail.length) { console.error('FAIL:\n' + fail.join('\n')); process.exit(1); }
console.log('ALL CHECKS PASSED');
