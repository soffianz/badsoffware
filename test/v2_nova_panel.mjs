// Nova as the 5th pilot (Dash Burst, practice pilot picker) and the redesigned control panel art.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto('http://localhost:8123/index.html');
await page.waitForTimeout(900);

const res = await page.evaluate(() => {
  const { CONFIG, POWERS, P, S, L, startLocal, buildLayout, resetPlayer, stepPlayer, usePower, catchBadsoff, Art } = window.__bsw;
  const out = {};
  out.roster = CONFIG.ROBOTS.map(r => r.id);
  out.novaPower = CONFIG.ROBOTS[4] && CONFIG.ROBOTS[4].power;
  out.dashKind = POWERS.dashburst && POWERS.dashburst.kind;
  out.novaFrames = Object.fromEntries(Object.entries(Art.robots.nova.anims).map(([k, v]) => [k, v.frames]));
  out.havocTaggedFrames = Art.robots.havoc.anims.tagged.frames;

  // practice: default pilot keeps the old assignment, a picked pilot goes to slot 0 and bots take the rest
  S.battleCfg.pilot = 0; startLocal(2); out.defaultPilots = P.filter(p => p.active).map(p => p.robot);
  S.battleCfg.pilot = 4; startLocal(3); out.novaPilots = P.filter(p => p.active).map(p => p.robot);
  S.battleCfg.pilot = 2; startLocal(1); out.glitchPilots = P.filter(p => p.active).map(p => p.robot);
  S.battleCfg.pilot = 0;

  // Dash Burst: a short forward burst with no gravity, uses up the charge, cyan trail
  buildLayout(0); S.battleCfg.pilot = 4; startLocal(1); S.ph = 'play';
  const me = P[0]; resetPlayer(me, 0, 2); me.active = true; me.f = 1; me.held = 'dashburst';
  const x0 = me.x; usePower(me);
  out.dashStarted = me.dashT > 0; out.dashCol = me.dashCol; out.heldAfter = me.held;
  for (let i = 0; i < 10; i++) stepPlayer(me, { move: 0, held: false, press: false, down: false }, 1 / 60, true);
  out.dashDx = Math.round(me.x - x0);
  out.boosted = me.boostT > 0;

  // character powers mode: catching any badsoffware as Nova charges Dash Burst
  S.gameMode = 'powers'; me.held = null; S.drones = []; L.billboards.forEach(b => b.occupied = false);
  const d = { type: 'bopster', billboard: L.billboards[0], x: me.x, y: me.y }; S.drones.push(d); L.billboards[0].occupied = true;
  catchBadsoff(me, d); out.powersModeHeld = me.held;
  return out;
});
console.log(JSON.stringify(res, null, 2));

// panel art: decoded and drawn (not the plain fallback), and ?noart=1 still draws the plain panel
const panel = await page.evaluate(() => new Promise(r => setTimeout(() => {
  const { S, P, startLocal } = window.__bsw; startLocal(2); r(true);
}, 50)));
await page.waitForTimeout(3800);
const px = await page.evaluate(() => {
  const cv = document.querySelector('canvas'); const g = cv.getContext('2d'); const s = cv.width / 390;
  // sample the console base near the top-left corner rivet area and the joystick ring colour
  const d = g.getImageData(Math.round(30 * s), Math.round((844 - 240 + 30) * s), 1, 1).data;
  return [d[0], d[1], d[2]];
});
const plain = await ctx.newPage(); plain.on('pageerror', e => errs.push('noart: ' + e.message));
await plain.goto('http://localhost:8123/index.html?noart=1'); await plain.waitForTimeout(700);
await plain.evaluate(() => window.__bsw.startLocal(2)); await plain.waitForTimeout(3800);
const plainOk = await plain.evaluate(() => !window.__bsw.S.ph.startsWith('title'));

const fail = [];
if (res.roster.length !== 5 || res.roster[4] !== 'nova') fail.push('roster should be 5 pilots ending in nova: ' + res.roster);
if (res.novaPower !== 'dashburst' || res.dashKind !== 'self') fail.push('nova power / dashburst kind wrong');
const need = { idle: 4, run: 8, jump: 2, fall: 2, land: 3, tagged: 4 };
for (const [k, n] of Object.entries(need)) if (res.novaFrames[k] !== n) fail.push('nova ' + k + ' frames ' + res.novaFrames[k]);
if (res.havocTaggedFrames !== 4) fail.push('havoc tagged should now be a real 4 frame animation');
if (JSON.stringify(res.defaultPilots) !== '[0,1,2]') fail.push('default practice pilots changed: ' + res.defaultPilots);
if (JSON.stringify(res.novaPilots) !== '[4,0,1,2]') fail.push('nova practice pilots: ' + res.novaPilots);
if (JSON.stringify(res.glitchPilots) !== '[2,0]') fail.push('glitch practice pilots: ' + res.glitchPilots);
if (!res.dashStarted || res.heldAfter !== null) fail.push('dash burst did not start / consume the charge');
if (res.dashCol !== '#9ffcff') fail.push('dash trail colour ' + res.dashCol);
if (res.dashDx < 60) fail.push('dash moved only ' + res.dashDx + 'px');
if (!res.boosted) fail.push('no speed boost after dash burst');
if (res.powersModeHeld !== 'dashburst') fail.push('powers mode should give nova dashburst, got ' + res.powersModeHeld);
if (px[0] + px[1] + px[2] < 30) fail.push('panel area looks empty/black - panel art not drawn: ' + px);
if (!plainOk) fail.push('noart fallback did not start a match');
if (errs.length) fail.push('page errors: ' + JSON.stringify(errs));
await browser.close();
if (fail.length) { console.error('FAIL:\n' + fail.join('\n')); process.exit(1); }
console.log('ALL CHECKS PASSED');
