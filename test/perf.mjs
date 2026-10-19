import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
await ctx.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/, r => r.abort());
const p = await ctx.newPage(); await p.goto('http://localhost:8123/index.html'); await p.waitForTimeout(2500);
const r = await p.evaluate(async () => {
  startLocal('bot'); S.pil = [0, 1]; startRound(); S.cd = 0; S.ph = 'play'; seen.rnd = S.rnd; setScene('session');
  S.pw[0] = [2, 99999]; S.pw[1] = [3, 99999];
  for (let i = 0; i < 6; i++) { const sp = pickSpot(null); if (sp) HOST.apps.push(newApp(1 + i % 3, sp, HOST.nextId++)); }
  const n = 600; let tStep = 0, tRender = 0;
  for (let i = 0; i < n; i++) {
    const a = performance.now(); sessionStep(1 / 60, a); const b = performance.now(); render(b); const c = performance.now(); uiTick(c);
    tStep += b - a; tRender += performance.now() - b;
    if (i % 20 === 0) { for (let k = 0; k < 6; k++) burst(300, 200, '#ff4fa3', 6, 200); }
  }
  return { stepMs: +(tStep / n).toFixed(3), renderMs: +(tRender / n).toFixed(3), canvas: [cv.width, cv.height] };
});
console.log(JSON.stringify(r));
await browser.close();
