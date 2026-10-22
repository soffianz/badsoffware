// CLIMB mode test: node test/climb_mode.mjs   (needs Playwright + a server on :8123)
// Title screen, a scripted bot climbs the generated tower, the swarm catches an idle player, the hunter drone spawns, daily seed is stable.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const URL = process.env.URL || 'http://localhost:8123/climb.html';
const OUT = process.env.OUT || '/tmp/shots';
import fs from 'fs'; fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
const p = await ctx.newPage(); const errs = [];
p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::/.test(m.text())) errs.push(m.text()); });
const wait = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
await p.goto(URL); await wait(1500);
await p.screenshot({ path: OUT + '/climb-title.png' });
ok(await p.evaluate(() => __climb.state) === 'title', 'opens on the title screen');

// real tap on DAILY CLIMB (logical 390x844 maps 1:1 at this viewport)
await p.touchscreen.tap(195, 590); await wait(300);
ok(await p.evaluate(() => __climb.state) === 'play', 'tapping DAILY CLIMB starts a run');
const seed1 = await p.evaluate(() => __climb.G.seed);
ok(await p.evaluate(() => __climb.plats.length) > 8, 'tower is generated ahead of the player');

// reachability: every main-path row can be reached from the previous one with a double jump (dy <= 150, gap <= ~105)
const reach = await p.evaluate(() => {
  const L = __climb.plats.filter(q => q.type !== 'floor' && !q.extra).sort((a, b) => b.y - a.y); let worst = 0, n = 0;
  for (let i = 1; i < L.length; i++) { const a = L[i - 1], b = L[i]; if (Math.abs(a.y - b.y) < 1) continue; const gap = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w)); worst = Math.max(worst, gap); n++; }
  return { worst, n };
});
ok(reach.worst < 125, 'platform gaps stay jumpable (worst edge gap ' + Math.round(reach.worst) + ' px over ' + reach.n + ' links)');

// scripted bot, driven through the same keys object the keyboard uses
await p.evaluate(() => {
  const K = __climb; window.__bot = setInterval(() => {
    const P = K.P, st = K.keys; if (K.state !== 'play') { st.left = st.right = st.jump = 0; return; }
    let best = null;
    for (const q of K.plats) { if (q.broken || q.type === 'floor' || q.y >= P.y - 8 || q.y < P.y - 110) continue; const c = q.x + q.w / 2, d = Math.abs(c - P.x); if (!best || q.y < best.y - 10 || (Math.abs(q.y - best.y) <= 10 && d < best.d)) best = { q, y: q.y, c, d }; }
    if (!best) { st.left = st.right = 0; return; }
    const dx = best.c - P.x; st.left = dx < -8 ? 1 : 0; st.right = dx > 8 ? 1 : 0;
    const want = Math.abs(dx) < best.q.w / 2 + 20;
    if (P.onGround && want) { if (!st.jump) K.input.jumpEdge = true; st.jump = 1; }
    else if (!P.onGround && P.vy > 40 && P.y > best.y + 6 && P.air > 0 && want) { if (!st.jump) K.input.jumpEdge = true; st.jump = 1; }
    else if (!P.onGround && P.vy < -50) st.jump = 1; else st.jump = 0;
  }, 16);
});
await wait(14000);
let g = await p.evaluate(() => ({ h: __climb.G.maxH, st: __climb.state, sw: __climb.sw.y, py: __climb.P.y, hs: __climb.hunters.length, hits: __climb.G.hunterHits, st2: __climb.G.stomps, score: __climb.G.bonus }));
await p.screenshot({ path: OUT + '/climb-play.png' });
ok(g.h > 40, 'bot climbs the generated tower (' + Math.round(g.h) + ' m so far, state ' + g.st + ')');
ok(await p.evaluate(() => __climb.sw.y < 330 - 100) || g.st === 'dead', 'swarm has been rising (front y ' + Math.round(g.sw) + ')');
await wait(12000);
g = await p.evaluate(() => ({ h: __climb.G.maxH, st: __climb.state, hits: __climb.G.hunterHits, stomps: __climb.G.stomps, t: __climb.G.t }));
ok(g.h > 80 || g.st === 'dead', 'bot keeps going or the swarm gets it (height ' + Math.round(g.h) + ' m, state ' + g.st + ', t ' + g.t.toFixed(0) + ' s)');
await p.screenshot({ path: OUT + '/climb-play2.png' });
await p.evaluate(() => clearInterval(window.__bot));

// idle player must be consumed by the swarm
await p.keyboard.press('KeyR'); await wait(200);
ok(await p.evaluate(() => __climb.state) === 'play' && await p.evaluate(() => __climb.G.seed) === seed1, 'R restarts the daily tower with the same seed');
await p.evaluate(() => { __climb.keys.left = __climb.keys.right = __climb.keys.jump = 0; });
await wait(15000);
ok(await p.evaluate(() => __climb.state) === 'dead', 'standing still gets you consumed');
await wait(1400); await p.screenshot({ path: OUT + '/climb-dead.png' });
await p.touchscreen.tap(195, 590); await wait(300);
ok(await p.evaluate(() => __climb.state) === 'play', 'CLIMB AGAIN restarts in one tap');

// hunter drone: appears after the first interval once we are high enough
await p.evaluate(() => { const K = __climb; K.G.maxH = 30; });
await wait(200);
await p.evaluate(() => { __climb.sw.started = true; });
let sawHunter = false; for (let i = 0; i < 40 && !sawHunter; i++) { await p.evaluate(() => { __climb.G.maxH = Math.max(__climb.G.maxH, 30); __climb.P.y = Math.min(__climb.P.y, -300); __climb.P.vy = 0; __climb.P.onGround = true; __climb.sw.y = 800; }); await wait(500); sawHunter = (await p.evaluate(() => __climb.hunters.length)) > 0; }
ok(sawHunter, 'a hunter drone peels off the swarm');
await p.screenshot({ path: OUT + '/climb-hunter.png' });


// tag-game style controls: analogue stick (mouse pointer stands in for a finger), push down drops through a platform
await p.evaluate(() => { __climb.setMode('free'); __climb.startRun(); });
await wait(200);
await p.mouse.move(78, 775); await p.mouse.down(); await p.mouse.move(78 + 49, 775, { steps: 4 }); await wait(100);
let jv = await p.evaluate(() => ({ mv: __climb.input.move, dn: __climb.input.down }));
ok(jv.mv > 0.9 && !jv.dn, 'stick pushed right gives full right movement (' + jv.mv.toFixed(2) + ')');
await p.mouse.move(78 - 20, 775, { steps: 3 }); await wait(100);
jv = await p.evaluate(() => ({ mv: __climb.input.move }));
ok(jv.mv < 0 && jv.mv > -0.5, 'stick nudged left gives gentle analogue movement (' + jv.mv.toFixed(2) + ')');
await p.mouse.up(); await wait(100);
ok((await p.evaluate(() => __climb.input.move)) === 0, 'releasing the stick stops movement');
await p.evaluate(() => { const K = __climb, pl = K.plats.find(q => q.row === 1 && !q.extra); K.P.x = pl.x + pl.w / 2; K.P.y = pl.y; K.P.on = pl; K.P.onGround = true; K.sw.started = false; K.sw.y = 2000; });
await wait(100);
await p.mouse.move(78, 775); await p.mouse.down(); await p.mouse.move(78, 775 + 45, { steps: 4 }); await wait(700);
const dr = await p.evaluate(() => ({ y: __climb.P.y, row1: __climb.plats.find(q => q.row === 1 && !q.extra).y }));
await p.mouse.up();
ok(dr.y > dr.row1 + 20, 'pushing the stick down drops through the platform (feet y ' + Math.round(dr.y) + ' vs platform ' + Math.round(dr.row1) + ')');
await p.screenshot({ path: OUT + '/climb-stick.png' });

// daily seed is stable across loads
const p2 = await ctx.newPage(); await p2.goto(URL); await wait(800);
await p2.evaluate(() => { __climb.setMode('daily'); __climb.startRun(); });
const a = await p2.evaluate(() => __climb.plats.slice(1, 6).map(q => Math.round(q.x) + ',' + Math.round(q.y)).join('|'));
await p.evaluate(() => { __climb.setMode('daily'); __climb.startRun(); });
const b = await p.evaluate(() => __climb.plats.slice(1, 6).map(q => Math.round(q.x) + ',' + Math.round(q.y)).join('|'));
ok(a === b && a.length > 10, 'daily tower is identical on every load');
ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' / ') : ''));
await browser.close();
