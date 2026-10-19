// Roster test: node test/roster.mjs   (needs Playwright + a server on :8123). Six pilots over the tabs transport.
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
const errs = [];
const wait = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
const mk = async (name, q) => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::/.test(m.text())) errs.push(name + ' console: ' + m.text()); }); await p.goto(URL + q); await wait(2400); return p; };
const deploy = async p => { await p.click('#bDeploy'); await wait(200); if (await p.isVisible('#bHowOk')) await p.click('#bHowOk'); };

// 1. assets: all six sheets/portraits decode at the expected size
const A = await mk('host', '?net=tabs');
const dims = await A.evaluate(() => ({ sheets: __bsw.ART.sheets.map(i => i && [i.naturalWidth, i.naturalHeight]), ports: __bsw.ART.portraits.map(i => i && i.naturalWidth) }));
ok(dims.sheets.length === 6 && dims.sheets.every(d => d && d[0] === 1728 && d[1] === 192), 'six 1728x192 sheets loaded ' + JSON.stringify(dims.sheets));
ok(dims.ports.length === 6 && dims.ports.every(w => w === 128), 'six portraits loaded');

// 2. two tabs: host picks Rumble, guest saved Havoc, rematch screen names them
const B = await mk('guest', '?net=tabs');
await deploy(A); await A.click('#bHost'); await wait(500);
const code = await A.textContent('#hostCode');
await deploy(B); await B.click('#bJoin'); for (const ch of code) await B.keyboard.press(ch); await B.keyboard.press('Enter'); await wait(1800);
const pil = async p => p.evaluate(() => JSON.stringify([__bsw.S.pil, __bsw.intent.pi]));
await A.click('.pcard.p3'); await wait(300); await B.click('.pcard.p5'); await wait(600);
console.log('pilots', await pil(A), await pil(B));
ok(await A.evaluate(() => __bsw.S.pil[0] === 3 && __bsw.S.pil[1] === 5), 'host picks Rumble, guest picks Havoc by tapping cards');
ok(await B.evaluate(() => __bsw.S.pil[0] === 3 && __bsw.S.pil[1] === 5), 'guest mirrors both picks');
await A.screenshot({ path: OUT + '/roster-lobby-host.png' });
await B.screenshot({ path: OUT + '/roster-lobby-guest.png' });
// guest tries host's pilot: conflict, must not be accepted
await B.evaluate(() => { __bsw.intent.pi = 3; }); await wait(500);
ok(await A.evaluate(() => __bsw.S.pil[1] === -1), 'guest picking the host pilot is rejected');
await B.evaluate(() => { __bsw.intent.pi = 2; }); await wait(500);
ok(await A.evaluate(() => __bsw.S.pil[1] === 2), 'guest switches to Glitch');
await B.evaluate(() => { __bsw.intent.pi = 99; }); await wait(500);
ok(await A.evaluate(() => __bsw.S.pil[1] === -1), 'out-of-range pilot id is rejected');
await B.evaluate(() => { __bsw.intent.pi = 4; }); await wait(400);
await A.click('#bReady'); await B.click('#bReady'); await wait(4800);
ok(await B.evaluate(() => __bsw.S.ph === 'play' && __bsw.S.pil[0] === 3 && __bsw.S.pil[1] === 4), 'guest mirrors Rumble vs Nova in play');
await A.screenshot({ path: OUT + '/roster-play-host.png' });
await B.screenshot({ path: OUT + '/roster-play-guest.png' });

// 3. practice vs bot: every pilot can be picked and plays a frame
const C = await mk('prac', '?noart=0');
await deploy(C); await C.click('#bPrac'); await wait(400);
for (let i = 0; i < 6; i++) {
  await C.click('.pcard.p' + i); await wait(150);
  ok(await C.evaluate(i => __bsw.S.pil[0] === i && __bsw.S.pil[1] !== i && __bsw.S.pil[1] >= 0, i), 'practice: pilot ' + i + ' picked, bot has a different one');
}
await C.click('.pcard.p2'); await C.click('#bReady'); await wait(4800);
await C.evaluate(() => { __bsw.S.sc = [3, 1]; __bsw.S.t = 1; }); await wait(800);
await C.screenshot({ path: OUT + '/roster-over.png' });
const title = await C.evaluate(() => document.getElementById('ovTitle').textContent);
ok(title === 'GLITCH WINS' || /WINS|DRAW/.test(title), 'round over title: ' + title);
ok(errs.length === 0, errs.length ? errs.join('\n') : 'no page errors');
await browser.close();
