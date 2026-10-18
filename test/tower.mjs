// Tower test: node test/tower.mjs   (needs Playwright + a server on :8123)
// Checks every layout: every platform can be reached from the floor with conservative jump limits, rows are sane, slots exist.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const URL = process.env.URL || 'http://localhost:8123/index.html';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 844, height: 390 } })).newPage();
await page.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/, r => r.abort());
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(URL); await page.waitForTimeout(1500);
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
const res = await page.evaluate(() => {
  const VW = __bsw.CONFIG.W, FLOOR = __bsw.FLOOR, MAX_RISE = 165, MAX_GAP = 110;     // real limits: 194 px double jump, about 160 px horizontal
  const gap = (a, b) => { let best = 1e9; for (let k = -1; k <= 1; k++) best = Math.min(best, Math.max(0, a.x - (b.x + k * VW + b.w), b.x + k * VW - (a.x + a.w))); return best; };
  return __bsw.LAYOUTS.map(def => {
    const pl = [{ x: 0, y: FLOOR, w: VW }].concat(def.plats.map(p => ({ x: p[0], y: p[1], w: p[2] })));
    const seen = new Set([0]), q = [0];
    while (q.length) {
      const a = pl[q.shift()];
      pl.forEach((b, i) => { if (!seen.has(i) && a.y - b.y <= MAX_RISE && gap(a, b) <= MAX_GAP) { seen.add(i); q.push(i); } });
    }
    const unreached = pl.map((p, i) => i).filter(i => !seen.has(i)).map(i => pl[i]);
    const top = Math.min(...pl.map(p => p.y));
    const outside = pl.slice(1).filter(p => p.x < 0 || p.x + p.w > VW);
    return { name: def.name, n: pl.length, unreached, top, slots: def.slots.length, outside: outside.length };
  });
});
for (const r of res) {
  ok(r.unreached.length === 0, r.name + ': all ' + r.n + ' platforms reachable from the floor' + (r.unreached.length ? ' (unreachable: ' + JSON.stringify(r.unreached) + ')' : ''));
  ok(r.top < 140 && r.top >= 40, r.name + ': top row at y=' + r.top);
  ok(r.slots === 3 && r.outside === 0, r.name + ': 3 pop-up slots, nothing off the sides');
}

// real physics: for every upward hop the BFS relies on, simulate with the game's own stepPlayer and make sure SOME run-up, jump and double jump lands on it
const sim = await page.evaluate(() => {
  __bsw.startLocal('bot'); S.ph = 'play'; S.t = 1e6; HOST.gt = 5000;
  const VW = CONFIG.W, dt = 1 / 60, out = [];
  const gap = (a, b) => { let best = 1e9; for (let k = -1; k <= 1; k++) best = Math.min(best, Math.max(0, a.x - (b.x + k * VW + b.w), b.x + k * VW - (a.x + a.w))); return best; };
  const tryHop = (a, b) => {
    const dir = Math.sign(wdx(a.x + a.w / 2, b.x + b.w / 2)) || 1, p = P[0], inp = { move: 0, held: true, press: false, down: false };
    for (let st = 0; st <= 5; st++) for (const mv of [dir, 0, -dir]) for (const pre of [0, 12, 30]) for (const hold of [999, 20]) for (const djAt of [10, 22, 34]) {
      resetPlayer(p); p.ctrl = 'human'; p.x = a.x + 4 + (a.w - 8) * st / 5; p.y = a.y; p.vx = 0; p.vy = 0; p.onGround = true; p.stand = 2;
      let jf = -1, landed = false;
      for (let f = 0; f < 140; f++) {
        inp.press = false; inp.move = f < pre + 60 ? (f < pre ? dir : mv) : mv;
        if (jf < 0 && f >= pre) { inp.press = true; jf = f; }
        else if (jf >= 0) { const k = f - jf; if (k === djAt) inp.press = true; inp.held = k < hold; }
        stepPlayer(p, inp, dt, true, 1, 1);
        if (jf >= 0 && f - jf > 5 && p.onGround && Math.abs(p.y - b.y) < 0.6 && overlapX(p.x, b)) { landed = true; break; }
        if (p.y > a.y + 70) break;
      }
      if (landed) return true;
    }
    return false;
  };
  LAYOUTS.forEach((def, li) => {
    buildLayout(li, 1);
    const pl = L.plats.filter(q => q.slot < 0).map(q => ({ x: q.x, y: q.y, w: q.w }));
    let hops = 0, bad = [];
    for (const a of pl) for (const b of pl) {
      if (a === b || !(a.y - b.y > 0 && a.y - b.y <= 165) || gap(a, b) > 110) continue;
      // only test the hops the layout actually needs: the nearest platform below b (at least one) is enough
      hops++; if (!tryHop(a, b)) bad.push([Math.round(a.x), a.y, Math.round(b.x), b.y]);
    }
    out.push({ name: def.name, hops, bad: bad.length, sample: bad.slice(0, 4) });
  });
  return out;
});
for (const r of sim) ok(r.bad === 0, r.name + ': simulated ' + r.hops + ' upward hops, ' + r.bad + ' failed ' + JSON.stringify(r.sample));
ok(errs.length === 0, errs.length ? errs.join('\n') : 'no page errors');
await browser.close();
