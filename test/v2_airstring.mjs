// Air String as a game mode: title -> PRACTICE VS BOTS -> pick AIR STRING -> OPEN AIR STRING -> navigates to air-string/.
// Also checks the rest of the battle-settings screen is unchanged for the two match modes.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto('http://localhost:8123/index.html');
await page.waitForTimeout(500);

const clickRect = async (getRect) => {
  const r = await page.evaluate(getRect);
  const rectPx = await page.evaluate(() => document.getElementById('cv').getBoundingClientRect());
  const s = rectPx.width / 390;
  await page.mouse.click(rectPx.left + (r.x + r.w / 2) * s, rectPx.top + (r.y + r.h / 2) * s);
  await page.waitForTimeout(120);
};
const cfg = () => page.evaluate(() => ({ ...window.__bsw.S.battleCfg }));
const fail = [];

await clickRect(() => window.__bsw.UI.title.practice);
if (await page.evaluate(() => window.__bsw.S.ph) !== 'battleSettings') fail.push('did not reach battle settings');
const tiles = await page.evaluate(() => window.__bsw.UI.battle.mode.map(r => ({ w: r.w, h: r.h })));
if (tiles.length !== 3) fail.push('expected 3 mode tiles, got ' + tiles.length);
if (tiles.some(t => t.h < 44)) fail.push('a mode tile is shorter than 44px');

// normal modes still work and never set the airString flag
await clickRect(() => window.__bsw.UI.battle.mode[1]);
let c = await cfg();
if (c.mode !== 'powers' || c.airString) fail.push('CHARACTER POWERS tile broke: ' + JSON.stringify(c));
await clickRect(() => window.__bsw.UI.battle.mode[0]);
c = await cfg();
if (c.mode !== 'drones' || c.airString) fail.push('BADSOFFWARES tile broke: ' + JSON.stringify(c));

// AIR STRING: separate flag, game mode untouched, bots and length ignored
await clickRect(() => window.__bsw.UI.battle.bots[0]);          // 1 BOT while normal
await clickRect(() => window.__bsw.UI.battle.mode[2]);          // AIR STRING
c = await cfg();
if (!c.airString || c.mode !== 'drones') fail.push('AIR STRING should set airString and leave mode alone: ' + JSON.stringify(c));
await clickRect(() => window.__bsw.UI.battle.bots[1]);          // 2 BOTS: must be ignored
await clickRect(() => window.__bsw.UI.battle.dur[2]);           // 4 MIN: must be ignored
c = await cfg();
if (c.bots !== 1 || c.durMin !== 2) fail.push('bots/length changed while greyed out: ' + JSON.stringify(c));
if (await page.evaluate(() => localStorage.getItem('bsw_battle_tile')) !== 'air') fail.push('tile choice not remembered');

// picking a normal tile restores the rows
await clickRect(() => window.__bsw.UI.battle.mode[1]);
await clickRect(() => window.__bsw.UI.battle.bots[1]);
c = await cfg();
if (c.airString || c.bots !== 2) fail.push('rows did not come back after leaving AIR STRING: ' + JSON.stringify(c));

// START with AIR STRING navigates to air-string/
await clickRect(() => window.__bsw.UI.battle.mode[2]);
await Promise.all([page.waitForURL(/\/air-string\/$/, { timeout: 5000 }).catch(() => null), clickRect(() => window.__bsw.UI.battle.start)]);
if (!/\/air-string\/$/.test(page.url())) fail.push('START did not navigate to air-string/, url=' + page.url());
else {
  await page.waitForTimeout(400);
  const home = await page.evaluate(() => ({ title: document.title, start: !!document.getElementById('startBtn') }));
  if (home.title !== 'Air String' || !home.start) fail.push('air-string page did not load: ' + JSON.stringify(home));
}

// stale or junk saves in BSW's tile key fall back to BADSOFFWARES
await page.goto('http://localhost:8123/index.html');
await page.evaluate(() => localStorage.setItem('bsw_battle_tile', 'nonsense'));
await page.reload(); await page.waitForTimeout(400);
c = await cfg();
if (c.mode !== 'drones' || c.airString) fail.push('junk tile save did not fall back: ' + JSON.stringify(c));

if (errs.length) fail.push('page errors: ' + errs.join(' | '));
await browser.close();
if (fail.length) { console.log('FAIL\n- ' + fail.join('\n- ')); process.exit(1); }
console.log('PASS v2_airstring: AIR STRING tile, greyed rows, remembered choice, launches air-string/');
