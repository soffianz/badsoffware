import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8123/index.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const errs = [];
const mk = async (name) => {
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(name + ': ' + e.message));
  await p.goto(URL); await p.waitForTimeout(400);
  return p;
};
const wait = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };

const A = await mk('host'), B = await mk('guest');

// Exercises the game's real session/network functions directly (the same ones the title/lobby
// taps call - see the cv pointerdown handler in index.html) rather than replicating canvas
// hit-testing pixel math here.
await A.evaluate(() => window.__bsw.startHost());
const code = await A.evaluate(() => window.__bsw.NET.code);
console.log('room code', code);
ok(/^[A-HJKMNP-Z2-9]{4}$/.test(code), 'room code format (no look-alikes)');
ok(await A.evaluate(() => window.__bsw.NET.isHost && window.__bsw.NET.mode === 'host'), 'host session started');

await B.evaluate((code) => window.__bsw.startGuest(code), code);
await wait(500);
ok(await B.evaluate(() => window.__bsw.NET.mode === 'guest' && window.__bsw.NET.mySlot === 1), 'guest admitted into slot 1');
ok(await A.evaluate(() => window.__bsw.P[1].active), 'host sees guest robot active');

// both ready up, host starts
await A.evaluate(() => { window.__bsw.NET.ready[0] = true; });
await B.evaluate(() => { window.__bsw.NET.ready[1] = true; window.__bsw.Net.send({ type: 'ready', slot: 1, ready: true, from: 'guest' }); });
await wait(300);
ok(await A.evaluate(() => window.__bsw.NET.ready[1] === true), 'host received guest ready');
await A.evaluate(() => {
  const { S, P, NET, L, buildLayout, resetPlayer, LAYOUTS, camSnap, CONFIG } = window.__bsw;
  S.roundMs = NET.roundLenMin * 60000;
  buildLayout(0);
  P.forEach(p => { if (p.active) resetPlayer(p, p.slot, CONFIG.MAX_SLOTS); });
  const live = P.filter(p => p.active); live[0].it = true;
  S.drones = []; S.feed = []; L.billboards.forEach(b => b.occupied = false);
  S.t = 3000; S.ph = 'countdown';
});
await wait(3600);
ok(await A.evaluate(() => window.__bsw.S.ph === 'play'), 'host round started');
ok(await B.evaluate(() => window.__bsw.S.ph === 'play'), 'guest followed host into play (via shared broadcast)');

// movement replication: the guest's own page loop already steps its robot and streams state at
// STATE_HZ every frame (netTick, called from the live rAF loop) - just drive real input and let
// it happen, the same as a real phone would.
const gx0 = await A.evaluate(() => window.__bsw.P[1].x);
await B.keyboard.down('ArrowRight'); await wait(700); await B.keyboard.up('ArrowRight'); await wait(300);
const gx1 = await A.evaluate(() => window.__bsw.P[1].x), gTrue = await B.evaluate(() => window.__bsw.P[1].x);
console.log('guest x on host', Math.round(gx0), '->', Math.round(gx1), ' true', Math.round(gTrue));
ok(Math.abs(await A.evaluate((t) => window.__bsw.wdx(window.__bsw.P[1].x, t), gTrue)) < 5, 'remote robot position replicated to host');

// tag claim: guest is It, touches host -> host validates and applies
await A.evaluate(() => { const { P } = window.__bsw; P.forEach(p => p.it = false); P[1].it = true; P[0].frozen = 0; P[1].frozen = 0; P[0].tagCd = 0; P[1].tagCd = 0; });
await wait(200);
await B.evaluate(() => { const { P, Net, NET } = window.__bsw; const h = P[0]; P[1].x = h.x; P[1].y = h.y; Net.send({ type: 'claim_tag', by: 1, target: 0, x: P[1].x, y: P[1].y }); });
await wait(400);
ok(await A.evaluate(() => !window.__bsw.P[1].it && window.__bsw.P[0].it), 'guest tag claim validated by host, It flipped');
await wait(300); // host's next SHARED_HZ broadcast carries the new It holder to the guest
ok(await B.evaluate(() => window.__bsw.P[0].it), 'guest received the It flip via the shared snapshot');

// Badsoffware catch claim: guest catches a drone, host validates and fills the held slot
await A.evaluate(() => {
  const { S, L, P } = window.__bsw;
  const bb = L.billboards[0]; bb.occupied = true;
  S.drones.push({ id: 999, type: 'bopster', x: bb.x, y: bb.y, billboard: bb, age: 0, spawnT: 0 });
});
await wait(200);
await B.evaluate(() => { const { P, Net, S } = window.__bsw; const d = S.drones.find(d => d.id === 999) || { x: 0, y: 0 }; Net.send({ type: 'claim_catch', slot: 1, droneId: 999, x: d.x, y: d.y }); });
await wait(300);
ok(await A.evaluate(() => window.__bsw.P[1].held === 'bopster'), 'guest catch claim validated, held slot filled on host');

// drop-out: close the guest tab, host should mark it inactive after the peer timeout. The host's
// own page is still running its live render loop (rAF -> tick -> netTick), so backdating the
// peer's lastSeen past PEER_TIMEOUT_MS is enough - the very next frame's own timeout check does
// the rest, no manual ticking needed.
await B.close();
await A.evaluate((ms) => { const peer = window.__bsw.NET.peers[1]; if (peer) peer.lastSeen = performance.now() - ms - 100; }, 6000);
await wait(200);
ok(await A.evaluate(() => !window.__bsw.P[1].active), 'host marks a timed-out guest inactive and round continues');

console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'NO PAGE ERRORS');
await browser.close();
if (errs.length) process.exitCode = 1;
