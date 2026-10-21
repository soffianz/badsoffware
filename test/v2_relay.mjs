// Online play over the WebSocket relay: separate browser contexts (so BroadcastChannel cannot be doing the work),
// a real relay process, and the failure paths a player will actually hit. Needs: cd relay && npm install, and a
// static server on :8123. Usage: node test/v2_relay.mjs
import { createRequire } from 'module';
import { spawn } from 'child_process';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PORT = 8788, RELAY = process.env.RELAY || 'ws://localhost:' + PORT;
const URL = 'http://localhost:8123/index.html?relay=' + encodeURIComponent(RELAY);
// RELAY=ws://localhost:8787 node test/v2_relay.mjs  runs the same checks against `wrangler dev` (the real Worker)
const relay = process.env.RELAY ? { kill() { } } : spawn('node', ['relay/dev-server.mjs', String(PORT)], { stdio: 'pipe' });
if (!process.env.RELAY) await new Promise(r => relay.stdout.once('data', r));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errs = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
const mk = async (name, url = URL) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message));
  await p.goto(url); await sleep(500); return p;
};
const until = async (p, fn, ms = 4000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await p.evaluate(fn).catch(() => false)) return true; await sleep(100); } return false; };

try {
  const A = await mk('host'), B = await mk('guest');
  ok(await A.evaluate(() => __bsw.NETKIND === 'ws'), 'relay transport selected from ?relay=');
  await A.evaluate(() => __bsw.startHost());
  ok(await until(A, () => !__bsw.S.connecting && __bsw.Net.kind === 'ws'), 'host room opened on the relay');
  const code = await A.evaluate(() => __bsw.NET.code);
  ok(/^[A-Z2-9]{4}$/.test(code), 'room code ' + code);

  await B.evaluate(c => __bsw.startGuest(c), code);
  ok(await until(B, () => __bsw.NET.mySlot === 1 && !__bsw.S.connecting), 'guest seated in slot 1 across separate contexts');
  ok(await A.evaluate(() => __bsw.P[1].active && __bsw.NET.peers[1].connected), 'host sees the guest');
  const token = await B.evaluate(() => __bsw.NET.myToken);

  await B.evaluate(() => { __bsw.NET.ready[1] = true; __bsw.Net.send({ type: 'ready', slot: 1, ready: true }); });
  ok(await until(A, () => __bsw.NET.ready[1] === true), 'guest ready flag reached the host');
  await A.evaluate(() => {
    const { S, P, L, NET, buildLayout, resetPlayer, CONFIG } = window.__bsw;
    S.roundMs = 120000; buildLayout(0);
    P.forEach(p => { if (p.active) resetPlayer(p, p.slot, CONFIG.MAX_SLOTS); });
    P.filter(p => p.active)[0].it = true; S.drones = []; S.feed = []; L.billboards.forEach(b => b.occupied = false);
    S.t = 1500; S.ph = 'countdown';
  });
  ok(await until(B, () => __bsw.S.ph === 'countdown' || __bsw.S.ph === 'play'), 'guest followed the host into the round');
  ok(await until(A, () => __bsw.S.ph === 'play', 4000), 'host countdown finished');
  await B.evaluate(() => { __bsw.P[1].x = 321; });
  ok(await until(A, () => Math.abs(__bsw.P[1].x - 321) < 40, 3000), 'guest position replicated to the host');

  // lag allowance on tag claims: the same 32 px miss is refused at 0 ping and accepted at 280 ms
  const tagTry = rtt => A.evaluate(r => {
    const { P, hostHandleTagClaim, applyTag } = window.__bsw; const by = P[1], tg = P[0];
    P.forEach(p => { p.it = false; p.frozen = 0; p.tagCd = 0; p.stun = 0; }); by.it = true; tg.x = 100; tg.y = by.y = tg.y; by.x = 160;
    hostHandleTagClaim({ by: 1, target: 0, x: by.x, y: by.y, rtt: r }); return tg.it;
  }, rtt);
  ok(await tagTry(0) === false, 'tag claim 32 px off is refused at zero ping');
  ok(await tagTry(280) === true, 'same claim accepted when the claimant reports a 280 ms ping');
  await A.evaluate(() => __bsw.P.forEach(p => { p.it = false; p.tagCd = 0; p.frozen = 0; }));
  await A.evaluate(() => { __bsw.P.filter(p => p.active)[0].it = true; });
  ok(await until(B, () => __bsw.NET.rtt > 0 && __bsw.NET.rtt < 400, 5000), 'guest measured its ping: ' + Math.round(await B.evaluate(() => __bsw.NET.rtt)) + ' ms');

  // a dropped connection: the guest knocks again with its token and gets the same seat
  await B.evaluate(() => __bsw.Net.ws.close());
  ok(await until(B, () => __bsw.NET.reconnects >= 1 && !__bsw.S.reconnecting && __bsw.Net.ws && __bsw.Net.ws.readyState === 1 && __bsw.NET.mySlot === 1, 6000), 'guest noticed the drop and reconnected');
  ok(await B.evaluate(t => __bsw.NET.myToken === t, token), 'same token after reconnect');
  ok(await until(A, () => __bsw.P[1].active && __bsw.NET.peers[1].connected), 'host still has the guest seated');
  ok(await A.evaluate(() => __bsw.P.filter(p => p.active).length === 2), 'still exactly two players (no phantom seat)');

  // a room that does not exist
  const C = await mk('lost');
  await C.evaluate(() => __bsw.startGuest('ZZZZ'));
  ok(await until(C, () => __bsw.S.ph === 'enterCode' && __bsw.S.connectError === 'ROOM NOT FOUND'), 'wrong code -> ROOM NOT FOUND, back on the keypad');

  // somebody already hosting that code: the second host gets another one
  const D = await mk('dup');
  await D.evaluate(c => { localStorage.setItem('bsw_lastcode', c); __bsw.startHost(); }, code);
  ok(await until(D, () => !__bsw.S.connecting && __bsw.S.ph === 'lobby' && __bsw.NET.code !== ''), 'second host opened a room');
  ok(await D.evaluate(c => __bsw.NET.code !== c, code), 'taken code replaced by a fresh one');

  // the invite link
  const E = await mk('invite', URL + '&join=' + code);
  ok(await until(E, () => __bsw.NET.mode === 'guest' && __bsw.NET.mySlot === 2), '?join=CODE seated the third phone');
  ok(await A.evaluate(() => __bsw.P.filter(p => p.active).length === 3), 'host sees three players');
  const link = await A.evaluate(() => { const o = location.origin + location.pathname; return __bsw.inviteUrl ? __bsw.inviteUrl() : o; });
  ok(link.includes('join=' + code) && link.includes('relay='), 'invite link carries the code and relay: ' + link);

  // host leaves: guests are told
  await A.evaluate(() => __bsw.backToTitle());
  const told = await until(B, () => __bsw.S.ph === 'enterCode' && __bsw.S.connectError === 'THE HOST HAS LEFT');
  ok(told, 'host left -> guest told, not left hanging');
  if (!told) console.log('guest state:', JSON.stringify(await B.evaluate(() => ({ ph: __bsw.S.ph, err: __bsw.S.connectError, hostLeft: __bsw.NET.hostLeft, rec: __bsw.S.reconnecting, mode: __bsw.NET.mode, ws: !!__bsw.Net.ws }))));

  // relay unreachable
  const F = await mk('nowhere', 'http://localhost:8123/index.html?relay=' + encodeURIComponent('ws://localhost:1'));
  await F.evaluate(() => __bsw.startHost());
  ok(await until(F, () => __bsw.S.ph === 'title' && __bsw.S.connectError === "CAN'T REACH THE GAME SERVER", 9000), 'unreachable relay -> clear message on the title screen');

  // an overseas-sized link: 140 ms each way through the relay (~280 ms round trip, KL to Europe)
  if (!process.env.RELAY) {
    const slow = spawn('node', ['relay/dev-server.mjs', '8789'], { stdio: 'pipe', env: { ...process.env, LAG_MS: '140' } });
    await new Promise(r => slow.stdout.once('data', r));
    try {
      const U = 'http://localhost:8123/index.html?relay=' + encodeURIComponent('ws://localhost:8789');
      const H = await mk('slow-host', U), G = await mk('slow-guest', U);
      await H.evaluate(() => __bsw.startHost()); await until(H, () => !__bsw.S.connecting);
      const c2 = await H.evaluate(() => __bsw.NET.code);
      await G.evaluate(c => __bsw.startGuest(c), c2);
      ok(await until(G, () => __bsw.NET.mySlot === 1 && !__bsw.S.connecting, 5000), 'guest joins over a 280 ms link');
      ok(await until(G, () => __bsw.NET.rtt > 200, 8000), 'ping reads like the link: ' + Math.round(await G.evaluate(() => __bsw.NET.rtt)) + ' ms');
      await H.evaluate(() => { const { S, P, L, buildLayout, resetPlayer, CONFIG } = window.__bsw; buildLayout(0); P.forEach(p => { if (p.active) resetPlayer(p, p.slot, CONFIG.MAX_SLOTS); }); P.filter(p => p.active)[0].it = true; S.drones = []; L.billboards.forEach(b => b.occupied = false); S.roundMs = 120000; S.t = 1500; S.ph = 'countdown'; });
      ok(await until(G, () => __bsw.S.ph === 'play', 6000), 'guest reaches the round on the slow link');
      await G.evaluate(() => { __bsw.P[1].x = 250; });
      ok(await until(H, () => Math.abs(__bsw.P[1].x - 250) < 60, 3000), 'guest position still reaches the host');
    } finally { slow.kill(); }
  }
} finally {
  await browser.close(); relay.kill();
}
ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + JSON.stringify(errs) : ''));
