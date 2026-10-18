import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const browser = await chromium.launch();
const wait = ms => new Promise(r => setTimeout(r, ms));
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
const ctx = await browser.newContext({ viewport: { width: 780, height: 360 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
await ctx.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/, r => r.abort());
const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto('http://localhost:8123/index.html'); await page.waitForTimeout(2500);
await page.tap('#bDeploy'); await wait(300); if (await page.isVisible('#bHowOk')) await page.tap('#bHowOk'); await wait(200);
await page.tap('#bPrac'); await wait(300); await page.tap('#bReady'); await page.waitForFunction(() => __bsw.S.ph === 'play', null, { timeout: 15000 }); await wait(400);
const cdp = await ctx.newCDPSession(page);
const sc = await page.evaluate(() => ({ s: __bsw.app && document.getElementById('stage').style.transform, ph: __bsw.S.ph }));
console.log(JSON.stringify(sc));
// logical -> client coords
const view = await page.evaluate(() => { const m = /translate\(([\d.\-]+)px,\s*([\d.\-]+)px\) scale\(([\d.]+)\)/.exec(document.getElementById('stage').style.transform); return { ox: +m[1], oy: +m[2], s: +m[3] }; });
const L2C = (x, y) => ({ x: view.ox + x * view.s, y: view.oy + y * view.s });
const j0 = L2C(78, 290), jr = L2C(78 + 49, 290), jb = L2C(768, 296);
const x0 = await page.evaluate(() => __bsw.P[0].x);
// joystick right + jump button simultaneously
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: j0.x, y: j0.y, id: 1 }] });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: jr.x, y: jr.y, id: 1 }] });
await wait(500);
const vx = await page.evaluate(() => __bsw.P[0].vx); ok(vx > 150, 'joystick drives run speed (vx=' + (vx | 0) + ')');
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: jr.x, y: jr.y, id: 1 }, { x: jb.x, y: jb.y, id: 2 }] });
await wait(150);
const y1 = await page.evaluate(() => __bsw.P[0].y); ok(y1 < 330, 'jump while moving (multi-touch), y=' + (y1 | 0));
await page.screenshot({ path: '/tmp/shots/touch-play.png' });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: jr.x, y: jr.y, id: 1 }] });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await wait(900);
const x1 = await page.evaluate(() => __bsw.P[0].x); ok(Math.abs(x1 - x0) > 60, 'moved across the map (' + (x0 | 0) + ' -> ' + (x1 | 0) + ')');
// drop-through: stand on a platform then pull joystick down
await page.evaluate(() => { const pl = __bsw.L.plats[0]; __bsw.P[0].x = pl.x + pl.w / 2; __bsw.P[0].y = pl.y - 1; __bsw.P[0].vy = 0; });
await wait(300);
const standing = await page.evaluate(() => __bsw.P[0].stand); const yb = await page.evaluate(() => __bsw.P[0].y);
const jd = L2C(78, 290 + 40);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: j0.x, y: j0.y, id: 5 }] });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: jd.x, y: jd.y, id: 5 }] });
await wait(600);
const ya = await page.evaluate(() => __bsw.P[0].y); ok(standing === 2 && ya > yb + 20, 'joystick down drops through platform (' + (yb | 0) + ' -> ' + (ya | 0) + ')');
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
// portrait
await page.setViewportSize({ width: 360, height: 780 }); await wait(400);
ok(await page.isVisible('#rotate'), 'portrait shows ROTATE YOUR PHONE');
await page.screenshot({ path: '/tmp/shots/portrait.png' });
console.log(errs.length ? 'ERRORS ' + errs : 'NO PAGE ERRORS');
await browser.close();
