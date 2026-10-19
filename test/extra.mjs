import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const browser = await chromium.launch();
const wait = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
const errs = [];
async function mkctx(init) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/, r => r.abort());
  if (init) await ctx.addInitScript(init);
  return ctx;
}
async function mk(ctx, name, qs = '') {
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message));
  await p.goto('http://localhost:8123/index.html' + qs); await p.waitForTimeout(2400); return p;
}
const deploy = async p => { await p.click('#bDeploy'); await wait(200); if (await p.isVisible('#bHowOk')) await p.click('#bHowOk'); };

/* ---------- 1. bot behaviour + windows + bounce (single page, stepped manually) ---------- */
{
  const ctx = await mkctx(); const p = await mk(ctx, 'bot');
  const r = await p.evaluate(() => {
    const out = { trials: [] };
    for (let lay = 0; lay < 5; lay++) {
      for (let trial = 0; trial < 4; trial++) {
        startLocal('bot'); S.pil = [0, 1]; startRound(); S.cd = 0; S.ph = 'play'; S.lay = lay; buildLayout(lay, 5 + trial); S.it = 1; S.win = [[0, 0], [0, 0], [0, 0]];
        HOST.wdone = [true, true, true]; HOST.spawnT = 1e9; seen.rnd = S.rnd; seen.ph = 'play'; for (const q of P) resetPlayer(q);
        const plats = L.plats.filter(q => q.slot < 0 && q.kind === 0);
        const pl = trial === 0 ? null : plats[(trial * 3 + lay) % plats.length];
        P[0].x = pl ? pl.x + pl.w / 2 : 150; P[0].y = pl ? pl.y : FLOOR; S.frz = [0, 0];
        let t = 0, tagged = false;
        for (let i = 0; i < 60 * 45 && !tagged; i++) { sessionStep(1 / 60, 1000 + i * 16.67); t += 1 / 60; if (S.sc[1] > 0) tagged = true; }
        out.trials.push([lay, trial, tagged ? +t.toFixed(1) : -1]);
      }
    }
    return out;
  });
  const caught = r.trials.filter(t => t[2] >= 0).length;
  console.log('bot trials (layout,trial,seconds to tag):', JSON.stringify(r.trials));
  ok(caught >= 17, 'bot reaches a stationary target in most trials (' + caught + '/20)');

  // flee test + score over a full simulated round with a passive human
  const r2 = await p.evaluate(() => {
    startLocal('bot'); S.pil = [0, 1]; startRound(); S.cd = 0; S.ph = 'play'; S.it = 0; HOST.spawnT = 3000;
    seen.rnd = S.rnd; for (const q of P) resetPlayer(q);
    let apps = 0, maxApps = 0, tags0 = 0;
    for (let i = 0; i < 60 * 118; i++) { sessionStep(1 / 60, 2000 + i * 16.67); maxApps = Math.max(maxApps, AV.length); if (S.ph === 'over') break; }
    return { ph: S.ph, t: Math.round(S.t), sc: S.sc, caught: S.cau, maxApps, winStates: S.win.map(w => w[0]) };
  });
  console.log('full sim round', JSON.stringify(r2));
  ok(r2.ph === 'over' || r2.t < 3000, 'full round simulates to the end');
  ok(r2.maxApps <= 3, 'never more than 3 apps');

  // windows: warning -> open -> bounce -> close
  const r3 = await p.evaluate(() => {
    startLocal('bot'); S.pil = [0, 1]; startRound(); S.cd = 0; S.ph = 'play'; seen.rnd = S.rnd; for (const q of P) resetPlayer(q); HOST.spawnT = 1e9;
    S.lay = 0; buildLayout(0, 3); const slot = L.plats[L.nPlat + 0]; // slot 0 of CLASSIC
    HOST.wdone = [true, true, true]; S.t = 100000;
    const pl = P[0]; pl.x = slot.x + slot.w / 2; pl.y = slot.y + 30; pl.vy = 0; pl.onGround = false;
    S.win[0] = [1, 3000]; const log = []; let boinged = false, lastSt = -1;
    for (let i = 0; i < 60 * 5; i++) {
      if (i === 0) { pl.y = slot.y + 30; }
      sessionStep(1 / 60, 3000 + i * 16.67);
      if (S.win[0][0] !== lastSt) { lastSt = S.win[0][0]; log.push([i, lastSt, Math.round(pl.vy), Math.round(pl.vx)]); }
      if (pl.b > 0) boinged = true;
      if (i < 170 && i > 0 && S.win[0][0] === 1) { pl.x = slot.x + slot.w / 2; pl.y = slot.y + 30; pl.vy = 0; }  // hold player under the slot while the warning runs
    }
    return { log, boinged };
  });
  console.log('window events', JSON.stringify(r3));
  ok(r3.boinged, 'player standing where a window appears gets bounced (BOING)');
  ok(r3.log.some(l => l[1] === 1) && r3.log.some(l => l[1] === 2), 'window goes warn then open');
  await ctx.close();
}

/* ---------- 2. pilot conflict (tabs) ---------- */
{
  const ctx = await mkctx(); const A = await mk(ctx, 'A', '?net=tabs'), B = await mk(ctx, 'B', '?net=tabs');
  await deploy(A); await A.click('#bHost'); await wait(500); const code = await A.textContent('#hostCode');
  await deploy(B); await B.click('#bJoin'); for (const ch of code) await B.keyboard.press(ch); await B.keyboard.press('Enter'); await wait(1500);
  // guest defaults to the other pilot. Host now switches onto the guest's pilot.
  const gp = await B.evaluate(() => __bsw.intent.pi);
  await A.evaluate(g => { document.querySelectorAll('.pcard')[g].click(); }, gp); await wait(700);
  const msg = await B.textContent('#lbMsg');
  console.log('guest lobby message:', msg);
  ok(/SWITCH PILOT/.test(msg), 'guest asked to switch when host takes their pilot');
  ok(await B.evaluate(() => document.getElementById('bReady').classList.contains('dis')), 'guest ready disabled during conflict');
  await B.evaluate(g => { document.querySelectorAll('.pcard')[1 - g].click(); }, gp); await wait(700);
  ok(!/SWITCH PILOT/.test(await B.textContent('#lbMsg')), 'conflict clears after guest switches');
  await ctx.close();
}

/* ---------- 3. ClaudeRoom transport with a mocked window.claude ---------- */
{
  const mock = () => {
    window.claude = {
      use: async () => {
        const me = 'peer-' + Math.random().toString(36).slice(2, 6), bc = new BroadcastChannel('mockroom'), peers = {}, subs = [];
        const list = () => Object.keys(peers).map(k => ({ peer: k, presence: peers[k] }));
        const notify = () => subs.forEach(f => f(list()));
        bc.onmessage = e => { const d = e.data; if (d.t === 'pres') { peers[d.peer] = d.p; notify(); } else if (d.t === 'hi' && peers[me]) bc.postMessage({ t: 'pres', peer: me, p: peers[me] }); else if (d.t === 'bye') { delete peers[d.peer]; notify(); } };
        bc.postMessage({ t: 'hi' }); addEventListener('pagehide', () => bc.postMessage({ t: 'bye', peer: me }));
        return { presence(p) { peers[me] = JSON.parse(JSON.stringify(p)); bc.postMessage({ t: 'pres', peer: me, p: peers[me] }); notify(); }, onPeers(f) { subs.push(f); f(list()); } };
      }
    };
  };
  const ctx = await mkctx(mock); const A = await mk(ctx, 'RA'), B = await mk(ctx, 'RB');
  console.log('net mode', await A.evaluate(() => __bsw.Net.mode));
  ok(await A.evaluate(() => __bsw.Net.mode === 'room'), 'ClaudeRoom detected');
  await deploy(A); await deploy(B);
  ok((await A.textContent('#bHost')) === 'PLAY ONLINE', 'mode screen skips room codes');
  await A.click('#bHost'); await B.click('#bHost'); await wait(1500);
  const roles = [await A.evaluate(() => __bsw.Net.isHost), await B.evaluate(() => __bsw.Net.isHost)];
  ok(roles[0] !== roles[1], 'exactly one host chosen (alphabetical peer label): ' + roles);
  ok(await A.evaluate(() => __bsw.session.kind === 'net') && await B.evaluate(() => __bsw.session.kind === 'net'), 'both in session');
  await A.click('#bReady'); await B.click('#bReady'); await wait(4800);
  ok(await A.evaluate(() => __bsw.S.ph === 'play') && await B.evaluate(() => __bsw.S.ph === 'play'), 'room round starts and plays');
  const ta = await A.evaluate(() => __bsw.S.t), tb = await B.evaluate(() => __bsw.S.t);
  ok(Math.abs(ta - tb) < 400, 'room timers agree ' + (ta | 0) + ' / ' + (tb | 0));
  const hostPage = roles[0] ? A : B, guestPage = roles[0] ? B : A;
  await guestPage.keyboard.down('ArrowRight'); await wait(900); await guestPage.keyboard.up('ArrowRight'); await wait(300);
  const gx = await guestPage.evaluate(() => __bsw.P[__bsw.session.slot].x), hx = await hostPage.evaluate(() => __bsw.P[1].x);
  ok(Math.abs(gx - hx) < 40, 'room: guest movement replicated ' + (gx | 0) + ' vs ' + (hx | 0));
  console.log('room ping', await hostPage.evaluate(() => __bsw.Net.getPing()));
  await ctx.close();
}
console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'NO PAGE ERRORS');
await browser.close();
