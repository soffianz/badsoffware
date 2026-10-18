// Weapons test: node test/weapons.mjs   (needs Playwright + a server on :8123)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const URL = process.env.URL || 'http://localhost:8123/index.html';
const OUT = process.env.OUT || '/tmp/shots';
import fs from 'fs'; fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const errs = [];
const wait = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
const newPage = async (name, q, touch) => {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: !!touch });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/, r => r.abort());
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::/.test(m.text())) errs.push(name + ' console: ' + m.text()); });
  await p.goto(URL + q); await wait(2300); return p;
};
const deploy = async p => { await p.click('#bDeploy'); await wait(200); if (await p.isVisible('#bHowOk')) await p.click('#bHowOk'); };
const names = ['patch', 'bolt', 'glitch', 'rumble', 'nova', 'havoc'];

for (let i = 0; i < 6; i++) {
  const p = await newPage(names[i], '', i === 0);
  await deploy(p); await p.click('#bPrac'); await wait(300);
  await p.click('.pcard.p' + i); await p.click('#bReady'); await wait(4400);
  const st = () => p.evaluate(() => ({ ch: __bsw.S.ch.slice(), wn: __bsw.S.wn, x: __bsw.P[0].x, y: __bsw.P[0].y, vy: __bsw.P[0].vy, bx: __bsw.P[1].x, bvx: __bsw.P[1].vx, bvy: __bsw.P[1].vy, stun: __bsw.P[1].stun, dash: __bsw.P[0].dashT, bombs: __bsw.bombs.length, decoys: __bsw.decoys.length, frz: __bsw.S.frz.slice() }));
  await p.evaluate(() => { __bsw.S.frz = [0, 0]; __bsw.P[0].x = 211; __bsw.P[0].y = 346; __bsw.P[0].vx = 0; __bsw.P[0].f = 1; __bsw.P[1].x = 281; __bsw.P[1].y = 346; __bsw.S.it = 1; });
  ok(await p.evaluate(() => __bsw.useWeapon(0)) === false, names[i] + ': weapon locked before catching a drone');
  // catch a real drone: park one on the pilot
  await p.evaluate(() => { __bsw.HOST.apps.push({ id: 900, type: 1, plat: 0, x: __bsw.P[0].x, y: __bsw.P[0].y - 20, dir: 1, mode: 0, mt: 5, sx: 0, sy: 0, tx: 0, ty: 0, tp: -1, hp: 0, hd: 1 }); });
  await wait(250);
  let a = await st(); ok(a.ch[0] === 2, names[i] + ': catching a drone gives 2 charges (' + a.ch + ')');
  await p.evaluate(() => { __bsw.S.frz = [0, 5000]; __bsw.P[0].x = 211; __bsw.P[0].y = 346; __bsw.P[0].vx = 0; __bsw.P[1].x = 281; __bsw.P[1].y = 346; __bsw.S.it = 1; });
  if (i === 0) await p.screenshot({ path: OUT + '/weapons-button-ready.png' });
  ok(await p.evaluate(() => __bsw.useWeapon(0)) === true, names[i] + ': weapon fires');
  await wait(160);
  const b = await st();
  ok(b.ch[0] === 1 && b.wn === a.wn + 1, names[i] + ': charge spent, one event broadcast');
  ok(await p.evaluate(() => __bsw.useWeapon(0)) === false, names[i] + ': cooldown blocks a second shot');
  if (i === 0) ok(b.vy < -100 || b.y < 340, 'patch: grapple lifts the pilot (vy ' + Math.round(b.vy) + ')');
  if (i === 1) ok(b.stun > 0, 'bolt: zap stuns the other pilot (' + b.stun.toFixed(2) + 's)');
  if (i === 2) ok(b.x - 211 > 100 && b.decoys === 1, 'glitch: blink moved ' + Math.round(b.x - 211) + 'px and left a decoy');
  if (i === 3) ok(Math.abs(b.bvx) > 200, 'rumble: slam shoves the other pilot (vx ' + Math.round(b.bvx) + ')');
  if (i === 4) ok(b.x - 211 > 60, 'nova: dash moved ' + Math.round(b.x - 211) + 'px');
  if (i === 5) {
    ok(b.bombs === 1, 'havoc: bomb planted');
    await p.screenshot({ path: OUT + '/weapons-bomb-armed.png' });
    await p.evaluate(() => { __bsw.P[0].x = 80; __bsw.P[1].x = 215; });   // bomb sits at x=211; pilot walks away, other pilot stands on it
    await wait(1500);
    const c = await st(); ok(Math.abs(c.bvx) > 150 || c.bvy < -150, 'havoc: bomb blast shoves the other pilot (vx ' + Math.round(c.bvx) + ', vy ' + Math.round(c.bvy) + ')');
    ok((await st()).bombs === 0, 'havoc: bomb is gone after the blast');
  }
  await p.screenshot({ path: OUT + '/weapons-' + names[i] + '.png' });
  await p.context().close();
}

// two phones: guest drone catch, guest weapon use via keyboard, host weapon stuns guest
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/, r => r.abort());
const mk = async (name) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::/.test(m.text())) errs.push(name + ' console: ' + m.text()); }); await p.goto(URL + '?net=tabs'); await wait(2300); return p; };
const A = await mk('host'), B = await mk('guest');
await deploy(A); await A.click('#bHost'); await wait(500);
const code = await A.textContent('#hostCode');
await deploy(B); await B.click('#bJoin'); for (const ch of code) await B.keyboard.press(ch); await B.keyboard.press('Enter'); await wait(1800);
await A.click('.pcard.p1'); await wait(300); await B.click('.pcard.p3'); await wait(500);   // host Bolt (zap), guest Rumble (slam)
await A.click('#bReady'); await B.click('#bReady'); await wait(4800);
await A.evaluate(() => { __bsw.S.frz = [0, 0]; __bsw.S.it = 0; });
await B.keyboard.press('KeyE'); await wait(400);
ok(await A.evaluate(() => __bsw.S.ch[1] === 0 && __bsw.S.wn === 0), 'net: guest weapon locked before a catch');
const guestPos = await B.evaluate(() => [__bsw.P[1].x, __bsw.P[1].y]);
await A.evaluate(([x, y]) => { __bsw.HOST.apps.push({ id: 901, type: 2, plat: 0, x, y: y - 20, dir: 1, mode: 0, mt: 5, sx: 0, sy: 0, tx: 0, ty: 0, tp: -1, hp: 0, hd: 1 }); }, guestPos);
await wait(1200);
ok(await A.evaluate(() => __bsw.S.ch[1] === 2) && await B.evaluate(() => __bsw.S.ch[1] === 2), 'net: guest catch gives 2 charges, seen on both phones');
await A.evaluate(() => { __bsw.S.frz = [0, 0]; __bsw.S.it = 0; __bsw.P[0].y = 346; });
await B.evaluate(() => { __bsw.P[1].y = 346; __bsw.P[1].f = 1; });
await wait(300);
const hx = await A.evaluate(() => __bsw.P[0].x);
await B.evaluate(x => { __bsw.P[1].x = (x - 60 + 844) % 844; }, hx); await wait(500);
await B.keyboard.press('KeyE');
let hv = 0; for (let k = 0; k < 8; k++) { await wait(60); hv = Math.max(hv, await A.evaluate(() => Math.abs(__bsw.P[0].vx) + Math.abs(__bsw.P[0].vy))); }
await wait(300);
ok(await A.evaluate(() => __bsw.S.ch[1] === 1 && __bsw.S.wn === 1 && __bsw.S.wv[1] === 3), 'net: host accepted the guest slam, charge spent, event sent');
ok(hv > 150, 'net: slam shoved the host pilot on the host phone (' + Math.round(hv) + ')');
await A.screenshot({ path: OUT + '/weapons-net-host.png' }); await B.screenshot({ path: OUT + '/weapons-net-guest.png' });
// host zaps the guest
await A.evaluate(() => { __bsw.S.ch[0] = 2; __bsw.S.frz = [0, 0]; __bsw.P[0].wcd = 0; });
await wait(200);
await A.evaluate(() => { __bsw.P[0].y = 346; __bsw.P[0].f = 1; });
const gx = await B.evaluate(() => __bsw.P[1].x);
await A.evaluate(x => { __bsw.P[0].x = (x - 60 + 844) % 844; __bsw.P[0].vx = 0; __bsw.P[0].noCtl = 0; }, gx); await wait(500);
await A.keyboard.press('KeyE'); await wait(600);
ok(await B.evaluate(() => __bsw.P[1].stun > 0 || __bsw.P[1].stun < 0.9 && __bsw.S.wv[1] === 1), 'net: host zap reached the guest phone');
ok(errs.length === 0, errs.length ? errs.join('\n') : 'no page errors');
await browser.close();
