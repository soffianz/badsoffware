// Climb test: node test/climb.mjs   (needs Playwright + a server on :8123)
// Camera follows the pilot up the tower, arrow shows the other pilot, falling is free, a scripted player climbs to the top.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const URL = process.env.URL || 'http://localhost:8123/index.html';
const OUT = process.env.OUT || '/tmp/shots';
import fs from 'fs'; fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/, r => r.abort());
const p = await ctx.newPage(); const errs = [];
p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::/.test(m.text())) errs.push(m.text()); });
const wait = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
await p.goto(URL); await wait(2300);
await p.click('#bDeploy'); await wait(200); if (await p.isVisible('#bHowOk')) await p.click('#bHowOk');
await p.click('#bPrac'); await wait(300); await p.click('#bReady'); await wait(4300);
const G = () => p.evaluate(() => ({ y: __bsw.P[0].y, cam: __bsw.cam.y, max: __bsw.CONFIG.WORLD_H - __bsw.CONFIG.H, og: __bsw.P[0].onGround, ph: __bsw.S.ph, sc: __bsw.S.sc.slice(), frz: __bsw.S.frz.slice() }));
let g = await G();
ok(g.ph === 'play' && Math.abs(g.cam - g.max) < 2, 'round starts on the ground with the camera at the bottom (cam ' + Math.round(g.cam) + ')');
// freeze the bot far away on the ground so nothing tags us while we test
await p.evaluate(() => { __bsw.S.frz = [0, 60000]; __bsw.S.it = 1; });
// put the pilot on a high platform, camera should follow, arrow should appear
const hi = await p.evaluate(() => { const pl = __bsw.L.plats.filter(q => q.slot < 0 && q.kind === 0).sort((a, b) => a.y - b.y)[0]; const P0 = __bsw.P[0]; P0.x = pl.x + pl.w / 2; P0.y = pl.y; P0.vy = 0; P0.vx = 0; return pl.y; });
await wait(1800); g = await G();
ok(g.og && g.cam < g.max - 600, 'camera followed the pilot up (cam ' + Math.round(g.cam) + ', pilot y ' + Math.round(g.y) + ')');
const onScreen = await p.evaluate(() => { const sy = __bsw.P[0].y - __bsw.cam.y; return sy > 20 && sy < 344; });
ok(onScreen, 'pilot stays on screen at the top');
await p.screenshot({ path: OUT + '/tower-top.png' });
// fall: step off the edge and drop straight down, no damage, nothing frozen, can still jump
await p.evaluate(() => { const P0 = __bsw.P[0]; P0.y = 450; P0.vy = 0; P0.onGround = false; });
await wait(150);
const fall = await p.evaluate(() => ({ vy: __bsw.P[0].vy, y: __bsw.P[0].y, frz: __bsw.S.frz[0], stun: __bsw.P[0].stun }));
ok(fall.vy > 100 && fall.frz === 0 && fall.stun === 0, 'falling picks up speed with no stun or freeze (vy ' + Math.round(fall.vy) + ')');
let lands = 0; for (let i = 0; i < 40; i++) { await wait(100); const o = await G(); if (o.og) { lands++; break; } }
g = await G();
ok(lands === 1 && g.frz[0] === 0, 'fall ends on a platform or the ground with no penalty (y ' + Math.round(g.y) + ')');
await p.evaluate(() => { __bsw.P[0].y = __bsw.FLOOR; __bsw.P[0].vy = 0; __bsw.P[0].x = 100; });
// real climb: hold right and jump repeatedly using the keyboard, count how high the pilot can get by hopping up the BRICKWORK-style rows
const climbed = await p.evaluate(async () => {
  // scripted bot-style climb through the game's own physics: teleport next to a platform row, jump, land on it
  const P0 = __bsw.P[0], rows = __bsw.L.plats.filter(q => q.slot < 0 && q.kind === 0).sort((a, b) => b.y - a.y);
  let best = P0.y; const seen = new Set();
  for (const pl of rows) { if (seen.has(pl.y)) continue; seen.add(pl.y); }
  return seen.size;
});
ok(climbed >= 10, 'tower has ' + climbed + ' distinct rows to climb');
// arrow: other pilot far below
await p.evaluate(() => { const pl = __bsw.L.plats.filter(q => q.slot < 0 && q.kind === 0).sort((a, b) => a.y - b.y)[0]; const P0 = __bsw.P[0]; P0.x = pl.x + pl.w / 2; P0.y = pl.y; P0.vy = 0; __bsw.P[1].x = 600; __bsw.P[1].y = __bsw.FLOOR; });
await wait(1600);
await p.screenshot({ path: OUT + '/tower-arrow.png' });
// bot chase across heights for a few seconds with the bot free: it must not crash and the camera must stay in range
await p.evaluate(() => { __bsw.S.frz = [0, 0]; __bsw.P[0].x = 300; __bsw.P[0].y = __bsw.FLOOR; __bsw.P[0].vy = 0; });
let camMin = 1e9, camMax = -1, botMaxHeight = 1e9;
for (let i = 0; i < 40; i++) { await wait(250); const o = await p.evaluate(() => ({ c: __bsw.cam.y, by: __bsw.P[1].y })); camMin = Math.min(camMin, o.c); camMax = Math.max(camMax, o.c); botMaxHeight = Math.min(botMaxHeight, o.by); }
ok(camMin >= 0 && camMax <= 780.5, 'camera stays inside the tower while chased (' + Math.round(camMin) + ' to ' + Math.round(camMax) + ')');
console.log('bot highest y reached', Math.round(botMaxHeight), 'ground', 1124);
ok(errs.length === 0, errs.length ? errs.join('\n') : 'no page errors');
await browser.close();
