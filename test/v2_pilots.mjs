// Pilot select: one pilot per player (host-authoritative over the network), the lobby pilot cards
// are tappable and drive the same pick, practice remembers your pilot and bots take the rest.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8123/index.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ ...devices['Pixel 5'], hasTouch: true, isMobile: true });
const errs = [];
const mk = async (name) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message)); await p.goto(URL); await p.waitForTimeout(500); return p; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
const tap = async (pg, r) => {
  const pt = await pg.evaluate(r => { const b = document.getElementById('cv').getBoundingClientRect(), s = b.width / window.__bsw.VW; return { x: b.left + (r.x + r.w / 2) * s, y: b.top + (r.y + r.h / 2) * s }; }, r);
  await pg.touchscreen.tap(pt.x, pt.y); await wait(250);
};
const ids = pg => pg.evaluate(() => window.__bsw.P.filter(p => p.active).map(p => window.__bsw.CONFIG.ROBOTS[p.robot].id));

const A = await mk('host'), B = await mk('guest');
await A.evaluate(() => window.__bsw.startHost());
const code = await A.evaluate(() => window.__bsw.NET.code);
await B.evaluate(c => window.__bsw.startGuest(c), code);
await wait(600);
ok(await A.evaluate(() => window.__bsw.S.ph === 'lobby'), 'host in lobby');
ok(await A.evaluate(() => window.__bsw.UI.lobby.pilots.length === 4), 'lobby shows 4 pilot cards');
// host takes Rumble by tapping its card; guest then tries to take Rumble too and must be refused
await tap(A, await A.evaluate(() => window.__bsw.UI.lobby.pilots[3]));
ok(await A.evaluate(() => window.__bsw.NET.picks[0] === 3), 'host tapped Rumble card');
await wait(600);
await tap(B, await B.evaluate(() => window.__bsw.UI.lobby.pilots[3]));
await wait(1200);
ok(await A.evaluate(() => window.__bsw.NET.picks[1] !== 3), 'host refused a duplicate Rumble pick');
ok(await B.evaluate(() => window.__bsw.NET.picks[1] !== 3 && window.__bsw.P[1].robot !== 3), 'guest reverted to its own pilot');
// guest takes a free pilot (Glitch) and the host sees it
await tap(B, await B.evaluate(() => window.__bsw.UI.lobby.pilots[2]));
await wait(1200);
ok(await A.evaluate(() => window.__bsw.NET.picks[1] === 2), 'host accepted a free pilot (Glitch)');
const picks = await A.evaluate(() => window.__bsw.NET.picks.slice(0, 2));
ok(new Set(picks).size === 2, 'no duplicate pilots in the room: ' + JSON.stringify(picks));
// ready toggles from the header chip (host) and the big button (guest)
await tap(A, await A.evaluate(() => window.__bsw.UI.lobby.ready));
ok(await A.evaluate(() => window.__bsw.NET.ready[0] === true), 'host ready via chip');
await tap(B, await B.evaluate(() => window.__bsw.UI.lobby.readyBtn));
await wait(500);
ok(await A.evaluate(() => window.__bsw.NET.ready[1] === true), 'guest ready via button');
ok(await A.evaluate(() => !!window.__bsw.UI.lobby.start), 'host has a START button');

// practice: pick Rumble, bots take the other three in roster order
const C = await mk('practice');
await tap(C, await C.evaluate(() => window.__bsw.UI.title.practice));
await tap(C, await C.evaluate(() => window.__bsw.UI.battle.pilots[3]));
await tap(C, await C.evaluate(() => window.__bsw.UI.battle.bots[2]));      // 3 bots
await tap(C, await C.evaluate(() => window.__bsw.UI.battle.start));
const pr = await ids(C);
ok(pr[0] === 'rumble' && pr.length === 4 && new Set(pr).size === 4, 'practice: you are Rumble, 3 bots take the rest: ' + pr.join(','));
// Ground Slam stuns a nearby rival
await wait(3500);
const slam = await C.evaluate(() => { const { P, usePower } = window.__bsw; P[0].held = 'groundslam'; P[1].x = P[0].x + 40; P[1].y = P[0].y; usePower(P[0]); return P[1].stun > 0; });
ok(slam, 'Ground Slam stuns a nearby rival');
ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs));
await browser.close();
