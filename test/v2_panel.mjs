// Control panel art (tools/process_panel.py + embed_panel.py): the console plate, joystick, power socket
// and JUMP button draw from art, with the plain code-drawn panel as the ?noart=1 fallback.
// Set SHOTS=<dir> to save a screenshot of the panel.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8123/index.html';
const SHOTS = process.env.SHOTS;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ ...devices['Pixel 5'], hasTouch: true, isMobile: true });
const errs = [];
const wait = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };

const A = await ctx.newPage(); A.on('pageerror', e => errs.push(e.message)); await A.goto(URL); await wait(900);
ok(await A.evaluate(() => window.__bsw.PanelArt.ready), 'panel art decoded on the title screen');
ok(await A.evaluate(() => ['base', 'seam', 'well', 'knob', 'knob_down', 'jump', 'pwr_bezel', 'pwr_cap'].every(k => window.__bsw.PanelArt.im[k])), 'all eight panel sprites loaded');
await A.evaluate(() => window.__bsw.startLocal(2)); await wait(3800);
// holding a power tints the cap in that power's colour
await A.evaluate(() => { window.__bsw.P[0].held = 'zappulse'; }); await wait(300);
ok(await A.evaluate(() => !!window.__bsw.PanelArt.tints[window.__bsw.POWERS.zappulse.col]), 'power cap is tinted in the held power colour');
// the panel area is drawn, not blank
const px = await A.evaluate(() => { const cv = document.getElementById('cv'), g = cv.getContext('2d'), k = cv.width / window.__bsw.VW; const y = Math.round((window.__bsw.VH - 120) * k); const d = g.getImageData(Math.round(200 * k), y, 1, 1).data; return d[0] + d[1] + d[2]; });
ok(px > 30, 'panel area is drawn (pixel sum ' + px + ')');
if (SHOTS) await A.screenshot({ path: SHOTS + '/panel_play.png' });

// ?noart=1 keeps the plain panel and the match still runs
const B = await ctx.newPage(); B.on('pageerror', e => errs.push('noart: ' + e.message)); await B.goto(URL + '?noart=1'); await wait(700);
ok(await B.evaluate(() => !window.__bsw.PanelArt.ready), 'noart: panel art is not used');
await B.evaluate(() => window.__bsw.startLocal(2)); await wait(3800);
ok(await B.evaluate(() => window.__bsw.S.ph === 'play'), 'noart: the match runs with the plain panel');
ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs));
await browser.close();
