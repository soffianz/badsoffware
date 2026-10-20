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
  const { P, S, buildLayout, resetPlayer, stepPlayer, botThink, FLOOR } = window.__bsw;
  const out = {};
  buildLayout(2); // SPIRAL: tall, needs real climbing to close the gap
  resetPlayer(P[0], 0, 2); resetPlayer(P[1], 1, 2);
  P[0].active = true; P[1].active = true;
  P[0].it = true; P[1].it = false;
  P[1].x = P[0].x; // start stacked so dx starts at 0, forces the chase to rely on y
  P[1].y = FLOOR - 400; // well up the tower
  const dt = 1 / 60;
  const startDist = Math.hypot(0, P[1].y - P[0].y);
  for (let i = 0; i < 600; i++) { // 10s of simulated bot play
    const inp0 = botThink(P[0], P.filter(p => p.active));
    stepPlayer(P[0], inp0, dt, true);
  }
  out.itBotClimbed = P[0].y < FLOOR - 50; // the It bot should have climbed meaningfully towards P[1]
  out.itBotAltitudeGain = Math.round(FLOOR - P[0].y);

  // fleeing bot: not-It bot near a STATIONARY It robot should increase distance over time
  // (an isolated check of the flee direction itself, not a chase race against an equally fast pursuer)
  buildLayout(0); // BRICKWORK: flatter, good for horizontal fleeing
  resetPlayer(P[0], 0, 2); resetPlayer(P[1], 1, 2);
  P[0].active = true; P[1].active = true;
  P[0].it = true; P[1].it = false;
  P[1].x = P[0].x + 15; P[1].y = P[0].y;
  const distAt = () => Math.abs(window.__bsw.wdx(P[0].x, P[1].x));
  const d0 = distAt();
  for (let i = 0; i < 180; i++) {
    const inp1 = botThink(P[1], P.filter(p => p.active));
    stepPlayer(P[1], inp1, dt, true); // P[0] (It) stays put
  }
  out.fleeIncreasedDistance = distAt() > d0;
  out.fleeDistStart = Math.round(d0); out.fleeDistEnd = Math.round(distAt());

  // climb commitment: a chasing bot must keep making net upward progress even when the target's
  // relative height keeps crossing the climb threshold back and forth (another live bot reacting
  // on its own does exactly this) - re-deciding whether to climb from scratch every replan cycle
  // used to make a bot abandon a climb almost as soon as it started one
  buildLayout(0);
  resetPlayer(P[0], 0, 2); resetPlayer(P[1], 1, 2);
  P[0].active = true; P[1].active = true; P[0].it = true; P[1].it = false;
  P[0].x = 100; P[0].y = FLOOR;
  for (let i = 0; i < 300; i++) {
    P[1].x = 100; P[1].y = (FLOOR - 300) + Math.sin(i * 0.3) * 35;
    const inp = botThink(P[0], [P[0], P[1]]);
    stepPlayer(P[0], inp, dt, true);
  }
  out.climbCommitAltitude = Math.round(FLOOR - P[0].y);

  // a fleeing bot far below an elevated, stationary It must still climb away (no distance gate)
  buildLayout(0);
  resetPlayer(P[0], 0, 2); resetPlayer(P[1], 1, 2);
  P[0].active = true; P[1].active = true; P[0].it = true; P[1].it = false;
  P[0].x = P[1].x; P[0].y = FLOOR - 300;
  for (let i = 0; i < 300; i++) { const inp = botThink(P[1], [P[0], P[1]]); stepPlayer(P[1], inp, dt, true); }
  out.farFleeClimbAltitude = Math.round(FLOOR - P[1].y);

  return out;
});
console.log(JSON.stringify(res, null, 2));
console.log(errs.length ? ('PAGE ERRORS: ' + JSON.stringify(errs)) : 'no page errors');
await browser.close();

const fail = [];
if (!res.itBotClimbed) fail.push('It bot did not climb towards a higher target: altitude gain ' + res.itBotAltitudeGain);
if (!res.fleeIncreasedDistance) fail.push('fleeing bot did not increase distance from It: ' + res.fleeDistStart + ' -> ' + res.fleeDistEnd);
if (res.climbCommitAltitude < 60) fail.push('chasing bot thrashed instead of committing to a climb against a jittering target: only gained ' + res.climbCommitAltitude + 'px in 5s');
if (res.farFleeClimbAltitude < 60) fail.push('a far-off fleeing bot below an elevated It did not climb away: only gained ' + res.farFleeClimbAltitude + 'px in 5s');
if (errs.length) fail.push('page errors present');
if (fail.length) { console.error('FAIL:\n' + fail.join('\n')); process.exit(1); }
console.log('ALL CHECKS PASSED');
