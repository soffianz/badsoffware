import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
await ctx.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/, r => r.abort());
const page = await ctx.newPage();
await page.goto('http://localhost:8123/index.html'); await page.waitForTimeout(2500);
await page.evaluate(() => {
  const c = document.createElement('canvas'); c.width = 1600; c.height = 700; c.style.cssText = 'position:fixed;left:0;top:0;z-index:999;width:844px;height:369px;background:#0a0d14';
  document.body.appendChild(c); const g = c.getContext('2d');
  g.fillStyle = '#0a0d14'; g.fillRect(0, 0, 1600, 700);
  const poses = [{ a: 0, it: false }, { a: 1, it: false, t: 0.1 }, { a: 1, it: false, t: 0.25 }, { a: 2, it: false, vy: -300 }, { a: 3, it: true, vy: 300 }, { a: 0, it: true }];
  for (let p = 0; p < 2; p++) poses.forEach((o, i) => {
    g.save(); g.translate(130 + i * 250, 330 + p * 340); g.scale(4, 4);
    drawMech(g, p, { t: o.t || 0.5, a: o.a, vy: o.vy || 0, f: 1, it: o.it, dj: false });
    g.restore();
    g.strokeStyle = '#2b3a55'; g.beginPath(); g.moveTo(0, 330 + p * 340); g.lineTo(1600, 330 + p * 340); g.stroke();
  });
});
await page.screenshot({ path: '/tmp/shots/sprites.png' });
await browser.close();
