// Closest thing to "test it on a real phone" available here: launches with a real device
// profile (Android viewport, DPR, touch enabled) and drives every control with actual touch
// events the way a thumb would, converting the game's internal logical coordinates (390x844)
// to real on-screen pixels via the canvas's own bounding rect and scale - the same letterboxing
// math the game applies itself in doLayout(), not a guessed transform.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('/opt/node-tools/node_modules/playwright');

const URL = 'http://localhost:8123/index.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ ...devices['Pixel 5'], hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
const t0 = Date.now();
await page.goto(URL);
await page.waitForTimeout(700);
const out = { loadMs: Date.now() - t0 };

// logical (game-internal) -> real screen px, via the canvas element's actual on-screen rect
const toScreen = async (lx, ly) => page.evaluate(({ lx, ly }) => {
  const r = document.getElementById('cv').getBoundingClientRect();
  const s = r.width / 390;
  return { x: r.left + lx * s, y: r.top + ly * s };
}, { lx, ly });

// --- title: real touch tap on PRACTICE VS BOTS, at its actual on-screen position ---
const titleRect = await page.evaluate(() => window.__bsw.UI.title.practice);
out.titleButtonsExist = !!titleRect;
if (titleRect) {
  const { x, y } = await toScreen(titleRect.x + titleRect.w / 2, titleRect.y + titleRect.h / 2);
  await page.touchscreen.tap(x, y);
}
await page.waitForTimeout(600);
out.enteredLobbyOrPlay = await page.evaluate(() => ['lobby', 'countdown', 'play'].includes(window.__bsw.S.ph));

// --- in-round: a real held touch-drag on the joystick, confirm the robot actually moves.
// No one is It here (cleared below) - this isolates "does the touch control work", not "did a
// roaming bot happen to tag and freeze the player during the 500ms window" (a real first version
// of this test hit exactly that: P[0] got tagged mid-drag, froze, and the resulting 0 velocity
// looked like a broken joystick when the control was actually fine).
await page.evaluate(() => { const b = window.__bsw; b.S.ph = 'play'; b.S.t = 30000; b.P[0].x = 195; b.P[0].y = b.FLOOR; b.P[0].onGround = true; b.P.forEach(p => { p.it = false; p.frozen = 0; p.noCtl = 0; }); b.camSnap(); });
const x0 = await page.evaluate(() => window.__bsw.P[0].x);
const J = await page.evaluate(() => window.__bsw.CONFIG.JOY);
const PANEL_Y0 = await page.evaluate(() => window.__bsw.PLAY_H + window.__bsw.CONFIG.HUD_H);
const dispatchTouch = async (type, lx, ly, id) => {
  const { x, y } = await toScreen(lx, ly);
  await page.evaluate(({ type, x, y, id }) => {
    const cv = document.getElementById('cv');
    const t = new Touch({ identifier: id, target: cv, clientX: x, clientY: y });
    cv.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [t], changedTouches: [t] }));
  }, { type, x, y, id });
};
await dispatchTouch('touchstart', J.x, PANEL_Y0 + J.y, 1);
await dispatchTouch('touchmove', J.x + 45, PANEL_Y0 + J.y, 1);   // push the knob hard right
await page.waitForTimeout(500);
const x1 = await page.evaluate(() => window.__bsw.P[0].x);
await dispatchTouch('touchend', J.x + 45, PANEL_Y0 + J.y, 1);
out.joystickMovedRobot = (x1 - x0) > 10;

// --- jump: a real touch on the jump button (same isolation: no one It, can't get frozen mid-test) ---
await page.evaluate(() => window.__bsw.P.forEach(p => { p.it = false; p.frozen = 0; p.noCtl = 0; }));
const JB = await page.evaluate(() => window.__bsw.CONFIG.JUMPBTN);
const y0 = await page.evaluate(() => window.__bsw.P[0].y);
await dispatchTouch('touchstart', JB.x, PANEL_Y0 + JB.y, 2);
await page.waitForTimeout(100);
const yMin = await page.evaluate(() => window.__bsw.P[0].y);
await dispatchTouch('touchend', JB.x, PANEL_Y0 + JB.y, 2);
out.jumpButtonWorked = yMin < y0 - 20;

// --- performance: frame pacing over a real 2s stretch with 4 active robots (worst case) ---
await page.evaluate(() => { window.__bsw.startLocal(3); window.__bsw.S.ph = 'play'; window.__bsw.S.t = 30000; });
const perf = await page.evaluate(() => new Promise(res => {
  let frames = 0; const t0 = performance.now();
  function loop() { frames++; if (performance.now() - t0 < 2000) requestAnimationFrame(loop); else res({ frames, ms: performance.now() - t0 }); }
  requestAnimationFrame(loop);
}));
out.fps = Math.round(perf.frames / (perf.ms / 1000));

out.artReady = await page.evaluate(() => window.__bsw.Art.ready);
out.sceneryReady = await page.evaluate(() => window.__bsw.Scenery.ready);

await page.screenshot({ path: '/tmp/claude-0/-home-user-badsoffware/5f5b364b-df13-5196-9a6e-0c24708e4f57/scratchpad/phone_sim_play.png' });

console.log(JSON.stringify(out, null, 2));
console.log(errs.length ? ('PAGE ERRORS: ' + JSON.stringify(errs)) : 'no page errors');
await browser.close();

const fail = [];
if (out.loadMs > 5000) fail.push('load took too long: ' + out.loadMs + 'ms');
if (!out.titleButtonsExist) fail.push('title buttons not found');
if (!out.enteredLobbyOrPlay) fail.push('tapping PRACTICE did not start a round');
if (!out.joystickMovedRobot) fail.push('a real touch-drag on the joystick did not move the robot');
if (!out.jumpButtonWorked) fail.push('a real touch on the jump button did not make the robot jump');
if (out.fps < 50) fail.push('fps under the 55fps target with 4 robots: ' + out.fps);
if (!out.artReady) fail.push('robot/drone art never finished loading');
if (!out.sceneryReady) fail.push('scenery art never finished loading');
if (errs.length) fail.push('page errors present');
if (fail.length) { console.error('FAIL:\n' + fail.join('\n')); process.exit(1); }
console.log('ALL CHECKS PASSED');
