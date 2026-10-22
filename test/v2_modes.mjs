// Character Powers mode (catching any badsoffware grants the catcher's own robot's signature
// power instead of the drone's type-specific effect), Pop-up Bomb's delayed hazard, and the
// Infinity match-length option added to the battle-settings screen.
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
  const { CONFIG, POWERS, P, S, L, buildLayout, resetPlayer, stepPlayer, catchBadsoff, usePower, bombsStep, wdx, FLOOR } = window.__bsw;
  const out = {};
  buildLayout(0);
  P.forEach((p, i) => resetPlayer(p, i, 4));
  P.forEach(p => p.active = true);
  S.drones = []; S.bombs = []; S.feed = []; L.billboards.forEach(b => b.occupied = false);
  S.ph = 'play';

  // Character Powers mode: catching ANY drone type grants the catcher's own robot power
  S.gameMode = 'powers';
  const bb = L.billboards[0]; bb.occupied = true;
  const d = { id: 1, type: 'hijacker', x: bb.x, y: bb.y, billboard: bb, age: 0, spawnT: 0 };   // hijacker: not holdable in drones mode, but powers mode ignores drone type entirely
  S.drones.push(d);
  catchBadsoff(P[0], d);   // P[0] is 'patch' -> should hold 'patchcable', not hijack anyone
  out.powersModeIgnoresDroneType = P[0].held === CONFIG.ROBOTS[0].power;
  out.powersModeDidNotHijack = P.filter(p => p.it).length === 0;

  // Patch Cable (patch): self-repair - clears stun/frozen, grants a speed boost
  resetPlayer(P[0], 0, 4); P[0].held = 'patchcable'; P[0].stun = 500; P[0].frozen = 300;
  usePower(P[0]);
  out.patchCableClearsStun = P[0].stun === 0 && P[0].frozen === 0;
  out.patchCableBoosts = P[0].boostT > 0;

  // Zap Pulse (bolt): short-range AoE stun, like Ground Slam but Bolt-flavoured
  resetPlayer(P[0], 0, 4); resetPlayer(P[1], 1, 4); resetPlayer(P[2], 2, 4);
  P[0].x = 100; P[0].y = FLOOR; P[1].x = 140; P[1].y = FLOOR; P[2].x = 300; P[2].y = FLOOR;
  P[0].held = 'zappulse';
  usePower(P[0]);
  out.zapStunsNear = P[1].stun > 0;
  out.zapSparesFar = P[2].stun === 0;

  // Phase Blink (glitch): identical teleport+decoy effect, just under the character's own name
  resetPlayer(P[0], 0, 4); P[0].f = 1; const bx = P[0].x;
  P[0].held = 'phaseblink';
  usePower(P[0]);
  out.phaseBlinkMoved = Math.abs(wdx(bx, P[0].x) - CONFIG.BLINK_D) < 1;
  out.phaseBlinkLeftDecoy = !!P[0].decoy;

  // Pop-up Bomb (havoc): placing it does NOT immediately stun anyone standing right there...
  resetPlayer(P[0], 0, 4); resetPlayer(P[1], 1, 4);
  P[0].x = 100; P[0].y = FLOOR; P[1].x = 110; P[1].y = FLOOR; P[0].held = 'popbomb';
  usePower(P[0]);
  out.bombPlaced = S.bombs.length === 1;
  out.bombDidNotStunImmediately = P[1].stun === 0;
  // ...but detonates after its fuse and stuns whoever's still in range (bombsStep, mirrors dronesStep)
  bombsStep(CONFIG.BOMB_FUSE_MS + 50);
  out.bombDetonatedAndCleared = S.bombs.length === 0;
  out.bombStunnedNearby = P[1].stun > 0;

  // Infinity match length: round never ends on time, HUD shows an infinity glyph not a NaN clock
  S.ph = 'play'; S.roundMs = Infinity; S.t = Infinity;
  window.__bsw.tick(16);
  out.infinityRoundStillPlaying = S.ph === 'play';
  out.infinityFmtTime = window.__bsw.fmtTime(Infinity);

  return out;
});
console.log(JSON.stringify(res, null, 2));

// battle-settings screen: title -> PRACTICE VS BOTS -> battleSettings -> pick 1 bot / 4 min /
// powers mode -> START, via real pointer taps (mouse clicks fire 'pointerdown' same as touch)
await page.evaluate(() => { window.__bsw.S.ph = 'title'; window.__bsw.NET.mode = 'local'; });
const clickRect = async (getRect) => {
  const r = await page.evaluate(getRect);
  const rectPx = await page.evaluate(() => document.getElementById('cv').getBoundingClientRect());
  const s = rectPx.width / 390;
  await page.mouse.click(rectPx.left + (r.x + r.w / 2) * s, rectPx.top + (r.y + r.h / 2) * s);
};
await clickRect(() => window.__bsw.UI.title.pursuit);
await page.waitForTimeout(150);
const reachedSettings = await page.evaluate(() => window.__bsw.S.ph === 'battleSettings');
await clickRect(() => window.__bsw.UI.battle.bots[0]);          // "1 BOT"
await clickRect(() => window.__bsw.UI.battle.dur[2]);            // "4 MIN"
await clickRect(() => window.__bsw.UI.battle.mode[1]);           // "CHARACTER POWERS"
const cfgBeforeStart = await page.evaluate(() => ({ ...window.__bsw.S.battleCfg }));
await clickRect(() => window.__bsw.UI.battle.start);
await page.waitForTimeout(150);
const afterStart = await page.evaluate(() => ({ ph: window.__bsw.S.ph, roundMs: window.__bsw.S.roundMs, gameMode: window.__bsw.S.gameMode, nActive: window.__bsw.P.filter(p => p.active).length }));

// in-match exit button: there used to be no way back to the title screen once a round had
// actually started short of reloading the page - a real tap on the HUD's exit button must work
await page.evaluate(() => { window.__bsw.S.ph = 'play'; window.__bsw.S.t = 30000; });
await page.waitForTimeout(100);
await clickRect(() => window.__bsw.UI.hud.exit);
await page.waitForTimeout(100);
const afterExit = await page.evaluate(() => window.__bsw.S.ph);

console.log('reachedSettings', reachedSettings, 'cfgBeforeStart', JSON.stringify(cfgBeforeStart), 'afterStart', JSON.stringify(afterStart), 'afterExit', afterExit);
console.log(errs.length ? ('PAGE ERRORS: ' + JSON.stringify(errs)) : 'no page errors');
await browser.close();

const checks = {
  powersModeIgnoresDroneType: 'Character Powers mode granted a drone-type effect instead of the catcher\'s own robot power',
  powersModeDidNotHijack: 'Character Powers mode still auto-hijacked on a hijacker-type drone',
  patchCableClearsStun: 'Patch Cable did not clear stun/frozen', patchCableBoosts: 'Patch Cable granted no speed boost',
  zapStunsNear: 'Zap Pulse did not stun a nearby robot', zapSparesFar: 'Zap Pulse hit someone out of range',
  phaseBlinkMoved: 'Phase Blink did not teleport the expected distance', phaseBlinkLeftDecoy: 'Phase Blink left no decoy',
  bombPlaced: 'Pop-up Bomb did not place a hazard', bombDidNotStunImmediately: 'Pop-up Bomb stunned on placement (should be delayed)',
  bombDetonatedAndCleared: 'Pop-up Bomb did not detonate/clear after its fuse', bombStunnedNearby: 'Pop-up Bomb did not stun on detonation',
  infinityRoundStillPlaying: 'an Infinity-length round ended on its own',
};
const fail = Object.keys(checks).filter(k => !res[k]).map(k => checks[k]);
if (res.infinityFmtTime !== '∞') fail.push('fmtTime(Infinity) did not render the infinity glyph: ' + res.infinityFmtTime);
if (!reachedSettings) fail.push('tapping PRACTICE VS BOTS did not reach the battle-settings screen');
if (cfgBeforeStart.bots !== 1 || cfgBeforeStart.durMin !== 4 || cfgBeforeStart.mode !== 'powers') fail.push('battle settings taps did not update S.battleCfg: ' + JSON.stringify(cfgBeforeStart));
if (!['countdown', 'play'].includes(afterStart.ph)) fail.push('START did not begin a round: ph=' + afterStart.ph);
if (afterStart.roundMs !== 4 * 60000) fail.push('chosen 4-minute match length was not applied: ' + afterStart.roundMs);
if (afterStart.gameMode !== 'powers') fail.push('chosen Character Powers mode was not applied: ' + afterStart.gameMode);
if (afterStart.nActive !== 2) fail.push('chosen 1-bot setting did not produce 2 active robots: ' + afterStart.nActive);
if (afterExit !== 'title') fail.push('tapping the in-match HUD exit button did not return to the title screen: ph=' + afterExit);
if (errs.length) fail.push('page errors present');
if (fail.length) { console.error('FAIL:\n' + fail.join('\n')); process.exit(1); }
console.log('ALL CHECKS PASSED');
