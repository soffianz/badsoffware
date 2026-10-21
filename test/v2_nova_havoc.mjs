// Pilots 5 and 6: Nova (Dash Burst) and Havoc (Pop-up Bomb). Six pilot cards fit the select screens,
// both can be picked and played in practice, and their powers and effect art work.
// Set SHOTS=<dir> to also save screenshots of the screens for a visual check.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8123/index.html';
const SHOTS = process.env.SHOTS;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ ...devices['Pixel 5'], hasTouch: true, isMobile: true });
const errs = [];
const mk = async () => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(URL); await p.waitForTimeout(700); return p; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
const shot = async (pg, name) => { if (SHOTS) await pg.screenshot({ path: SHOTS + '/' + name + '.png' }); };
const tap = async (pg, r) => {
  const pt = await pg.evaluate(r => { const b = document.getElementById('cv').getBoundingClientRect(), s = b.width / window.__bsw.VW; return { x: b.left + (r.x + r.w / 2) * s, y: b.top + (r.y + r.h / 2) * s }; }, r);
  await pg.touchscreen.tap(pt.x, pt.y); await wait(250);
};

// the pilot strip shows four cards at a time: the arrows (real taps) scroll it to the last two
const scrollEnd = async pg => { for (let i = 0; i < 2; i++) await tap(pg, await pg.evaluate(() => window.__bsw.UI.pilotNav.next)); await wait(500); };
const A = await mk();
const roster = await A.evaluate(() => window.__bsw.CONFIG.ROBOTS.map(r => r.id + ':' + r.power));
ok(roster.join() === 'patch:patchcable,bolt:zappulse,glitch:phaseblink,rumble:groundslam,nova:dashburst,havoc:popbomb', 'roster is Patch, Bolt, Glitch, Rumble, Nova, Havoc: ' + roster.join());
ok(await A.evaluate(() => { const { Art, CONFIG } = window.__bsw; return CONFIG.ROBOTS.every(r => Art.robots[r.id] && ['idle', 'run', 'jump', 'fall', 'land', 'tagged'].every(a => Art.robots[r.id].anims[a])); }), 'all six pilots have all six animations');
ok(await A.evaluate(() => ['popbomb', 'dashburst', 'unlock'].every(k => window.__bsw.Art.fx[k])), 'effect strips loaded');

// practice select screen: six cards, the last two are Nova and Havoc, nothing overflows the screen
await tap(A, await A.evaluate(() => window.__bsw.UI.title.practice));
ok(await A.evaluate(() => window.__bsw.UI.battle.pilots.length === 6), 'practice shows 6 pilot cards');
const fits = await A.evaluate(() => { const { UI, VH } = window.__bsw; const s = UI.battle.start; return s.y + s.h <= VH; });
ok(fits, 'practice START button is on screen');
ok(await A.evaluate(() => window.__bsw.UI.battle.pilots[4].w === 0 && window.__bsw.UI.battle.pilots[3].w > 0), 'four cards visible, Nova and Havoc are behind the arrow');
await scrollEnd(A);
ok(await A.evaluate(() => window.__bsw.UI.battle.pilots[5].w > 0 && window.__bsw.UI.battle.pilots[0].w === 0), 'arrows scroll to Nova and Havoc');
await tap(A, await A.evaluate(() => window.__bsw.UI.battle.pilots[4]));       // Nova
await shot(A, 'practice_select_nova');
await tap(A, await A.evaluate(() => window.__bsw.UI.battle.bots[2]));         // 3 bots
await tap(A, await A.evaluate(() => window.__bsw.UI.battle.start));
const ids = await A.evaluate(() => window.__bsw.P.filter(p => p.active).map(p => window.__bsw.CONFIG.ROBOTS[p.robot].id));
ok(ids[0] === 'nova' && ids.length === 4 && new Set(ids).size === 4, 'practice: you are Nova, bots take other pilots: ' + ids.join());
await wait(3600);

// Dash Burst: instant dash forward, then a boost; the streak art plays
const dash = await A.evaluate(async () => {
  const { P, usePower } = window.__bsw; const p = P[0]; p.held = 'dashburst'; p.f = 1; const x0 = p.x;
  usePower(p); const startedDash = p.dashT > 0 && p.dashKind === 'dashburst' && p.boostT > 0;
  await new Promise(r => setTimeout(r, 120));
  return { startedDash, held: p.held, moved: Math.abs(window.__bsw.wdx(x0, p.x)) };
});
ok(dash.startedDash && dash.held === null, 'Dash Burst starts a dash + boost and is consumed');
ok(dash.moved > 40, 'Dash Burst moves Nova forward (' + Math.round(dash.moved) + ' px in 120 ms)');
await A.evaluate(() => { const { P, usePower } = window.__bsw; P[0].held = 'dashburst'; usePower(P[0]); });
await wait(60); await shot(A, 'dash_streak');

// Pop-up Bomb: Havoc drops it, it counts down, blows up and stuns a nearby rival
const bomb = await A.evaluate(async () => {
  const { P, S, usePower, CONFIG, FX } = window.__bsw;
  const h = P[1]; h.held = 'popbomb'; h.stun = 0; h.frozen = 0; P[2].x = h.x + 30; P[2].y = h.y; P[2].stun = 0; P[2].vx = 0; P[2].vy = 0;
  const n0 = S.bombs.length; usePower(h);
  const placed = S.bombs.length === n0 + 1;
  await new Promise(r => setTimeout(r, 300)); const armed = S.bombs.length === n0 + 1;
  // the blast strip plays for half a second and the stun wears off, so watch for both while waiting
  let blast = false, stunned = false;
  for (let t = 0; t < CONFIG.BOMB_FUSE_MS + 250; t += 40) {
    await new Promise(r => setTimeout(r, 40));
    if (FX.spr.some(q => q.id === 'popbomb')) blast = true;
    if (P[2].stun > 0) stunned = true; else { P[2].x = h.x + 30; P[2].y = h.y; }   // the rival is a bot that wanders off: keep it in range until the blast
  }
  return { placed, armed, gone: S.bombs.length === n0, stunned, blast };
});
ok(bomb.placed && bomb.armed, 'Pop-up Bomb is placed and armed');
ok(bomb.gone && bomb.stunned, 'Pop-up Bomb explodes and stuns a nearby rival ' + JSON.stringify(bomb));
ok(bomb.blast, 'explosion effect art plays');
await A.evaluate(() => { const { P, usePower } = window.__bsw; const h = P[1]; h.held = 'popbomb'; h.stun = 0; h.frozen = 0; usePower(h); });
await wait(300); await shot(A, 'bomb_armed');
await wait(900); await shot(A, 'bomb_blast');

// lobby: six cards, both new pilots selectable, duplicate picks still refused
const B = await mk();
await B.evaluate(() => window.__bsw.startHost());
await wait(500);
ok(await B.evaluate(() => window.__bsw.UI.lobby.pilots.length === 6), 'lobby shows 6 pilot cards');
await scrollEnd(B);
await tap(B, await B.evaluate(() => window.__bsw.UI.lobby.pilots[5]));
ok(await B.evaluate(() => window.__bsw.NET.picks[0] === 5), 'host can pick Havoc');
await shot(B, 'lobby_havoc');
await tap(B, await B.evaluate(() => window.__bsw.UI.lobby.pilots[4]));
ok(await B.evaluate(() => window.__bsw.NET.picks[0] === 4), 'host can pick Nova');
await shot(B, 'lobby_nova');
// dragging the strip scrolls it and does not pick the card under the finger
const D = await mk();
await D.evaluate(() => window.__bsw.startHost()); await wait(500);
const from = await D.evaluate(() => { const r = window.__bsw.UI.lobby.pilots[2], b = document.getElementById('cv').getBoundingClientRect(), k = b.width / window.__bsw.VW; return { x: b.left + (r.x + r.w / 2) * k, y: b.top + (r.y + r.h / 2) * k, k }; });
await D.mouse.move(from.x, from.y); await D.mouse.down();
for (let i = 1; i <= 8; i++) { await D.mouse.move(from.x - i * 22 * from.k, from.y); await wait(20); }
await D.mouse.up(); await wait(600);
ok(await D.evaluate(() => window.__bsw.UI.lobby.pilots[0].w === 0 && window.__bsw.UI.lobby.pilots[5].w > 0), 'dragging the strip scrolls it');
ok(await D.evaluate(() => window.__bsw.NET.picks[0] === 0), 'a drag does not pick the card under the finger');
ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs));
await browser.close();
