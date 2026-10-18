import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8123/index.html?net=tabs';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/, r => r.abort());
const errs = [];
const mk = async (name) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::/.test(m.text())) errs.push(name + ' console: ' + m.text()); }); await p.goto(URL); await p.waitForTimeout(2400); return p; };
const A = await mk('host'), B = await mk('guest');
const deploy = async p => { await p.click('#bDeploy'); await new Promise(r=>setTimeout(r,200)); if (await p.isVisible('#bHowOk')) await p.click('#bHowOk'); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
// host
await deploy(A); await A.click('#bHost'); await wait(500);
const code = await A.textContent('#hostCode'); console.log('room code', code);
ok(/^[A-HJKMNP-Z2-9]{4}$/.test(code), 'room code format');
// guest
await deploy(B); await B.click('#bJoin');
for (const ch of code) await B.keyboard.press(ch);
await B.keyboard.press('Enter'); await wait(1500);
ok(await A.evaluate(() => __bsw.session.kind === 'net' && __bsw.HOST.peerHere), 'host sees guest');
ok(await B.evaluate(() => __bsw.session.kind === 'net' && !__bsw.session.host), 'guest in session');
await A.screenshot({ path: '/tmp/shots/net-lobby-host.png' });
await B.screenshot({ path: '/tmp/shots/net-lobby-guest.png' });
const pil = async p => p.evaluate(() => JSON.stringify([__bsw.S.pil, __bsw.intent.pi]));
console.log('pilots host/guest', await pil(A), await pil(B));
// ready up
await A.click('#bReady'); await B.click('#bReady'); await wait(800);
ok(await A.evaluate(() => __bsw.S.ph === 'count') && await B.evaluate(() => __bsw.S.ph === 'count'), 'both in countdown');
await wait(3600);
ok(await B.evaluate(() => __bsw.S.ph === 'play'), 'guest in play');
await A.screenshot({ path: '/tmp/shots/net-play-host.png' });
await B.screenshot({ path: '/tmp/shots/net-play-guest.png' });
// timer agreement
const snap = async p => p.evaluate(() => ({ t: __bsw.S.t, sc: __bsw.S.sc.slice(), it: __bsw.S.it, rnd: __bsw.S.rnd }));
let a = await snap(A), b = await snap(B); console.log('timers', a.t | 0, b.t | 0);
ok(Math.abs(a.t - b.t) < 250, 'timer agrees within 250ms');
ok(a.it === b.it && a.rnd === b.rnd, 'same It and round');
// movement replication: guest runs right for 1s, host should see remote move
const gx0 = await A.evaluate(() => __bsw.P[1].x);
await B.keyboard.down('ArrowRight'); await wait(1000); await B.keyboard.up('ArrowRight'); await wait(300);
const gx1 = await A.evaluate(() => __bsw.P[1].x), gTrue = await B.evaluate(() => __bsw.P[1].x);
console.log('guest x on host', gx0 | 0, '->', gx1 | 0, ' true', gTrue | 0);
ok(Math.abs(wdx(gx1, gTrue)) < 30, 'remote pilot replicated within 30px'); function wdx(a, b) { let d = b - a; if (d > 422) d -= 844; if (d < -422) d += 844; return d; }
// tag by guest (claim path): make guest It, put guest on host
await A.evaluate(() => { __bsw.S.it = 1; __bsw.S.frz = [0, 0]; __bsw.HOST.lastTag = -99999; __bsw.HOST.dirty = true; });
await wait(400);
await B.evaluate(() => { const h = __bsw.P[0]; __bsw.P[1].x = h.x + 12; __bsw.P[1].y = h.y; });
await wait(900);
a = await snap(A); b = await snap(B); console.log('after guest tag', JSON.stringify(a), JSON.stringify(b));
ok(a.sc[1] === 1 && b.sc[1] === 1 && a.it === 0 && b.it === 0, 'guest tag claim validated, scores agree, It swapped');
// tag by host
await wait(1200);
await A.evaluate(() => { const g = __bsw.P[1]; __bsw.P[0].x = g.x - 12; __bsw.P[0].y = g.y; });
await wait(900);
a = await snap(A); b = await snap(B); console.log('after host tag', JSON.stringify(a), JSON.stringify(b));
ok(a.sc[0] === 1 && b.sc[0] === 1, 'host tag direct, scores agree');
await A.evaluate(() => { __bsw.P[0].x = 100; }); await wait(500);
// app spawn + pickup claim by guest
await A.evaluate(() => { __bsw.HOST.spawnT = 0; }); await wait(400);
const apps = await B.evaluate(() => __bsw.AV.length); ok(apps >= 1, 'guest sees spawned app (' + apps + ')');
await A.evaluate(() => { const a = __bsw.HOST.apps[0]; a.mode = 1; a.mt = 99; window.__app = a; });
await B.evaluate(() => { const v = __bsw.AV[0]; const p = __bsw.P[1]; p.x = v.rx; p.y = v.ry + 24; });
await wait(900);
a = await A.evaluate(() => ({ pw: __bsw.S.pw, cau: __bsw.S.cau, n: __bsw.HOST.apps.length })); console.log('after pickup', JSON.stringify(a));
ok(a.cau[1] === 1 && a.pw[1][0] > 0, 'guest pickup claim validated');
// pause from guest
await B.evaluate(() => document.getElementById('bPause').click()); await wait(500);
ok(await A.evaluate(() => __bsw.S.ph === 'pause') && await B.evaluate(() => __bsw.S.ph === 'pause'), 'guest pause pauses both');
const t1 = await A.evaluate(() => __bsw.S.t); await wait(600); const t2 = await A.evaluate(() => __bsw.S.t); ok(t1 === t2, 'timer stops while paused');
await A.screenshot({ path: '/tmp/shots/net-pause.png' });
await A.evaluate(() => document.getElementById('bResume').click()); await wait(500);
ok(await B.evaluate(() => __bsw.S.ph === 'play'), 'host resume resumes guest');
// drop guest => host waits
await B.close(); await wait(1200);
ok(await A.evaluate(() => __bsw.S.ph === 'pause' && __bsw.S.wa === 1), 'host pauses WAITING FOR PILOT when guest drops');
await A.screenshot({ path: '/tmp/shots/net-wait.png' });
// rejoin
const B2 = await mk('guest2'); await deploy(B2); await B2.click('#bJoin'); for (const ch of code) await B2.keyboard.press(ch); await B2.keyboard.press('Enter'); await wait(1800);
ok(await A.evaluate(() => __bsw.S.ph === 'play' && __bsw.S.wa === 0), 'play resumes automatically on reconnect');
ok(await B2.evaluate(() => __bsw.S.ph === 'play' && __bsw.S.sc[0] === 1), 'rejoined guest has scores/state');
// end of round + rematch
await A.evaluate(() => { __bsw.S.t = 400; }); await wait(1200);
ok(await B2.evaluate(() => __bsw.S.ph === 'over'), 'round over on guest');
await B2.screenshot({ path: '/tmp/shots/net-over.png' });
await A.click('#bRematch'); await wait(500);
ok(await A.evaluate(() => __bsw.S.ph === 'over'), 'rematch waits for both');
await B2.click('#bRematch'); await wait(800);
ok(await A.evaluate(() => __bsw.S.ph === 'count') && await B2.evaluate(() => __bsw.S.ph === 'count'), 'rematch starts when both tapped');
console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'NO PAGE ERRORS');
await browser.close();
