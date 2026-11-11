// Map + collapse checks for the Consumer Central rebuild. Needs playwright, three@0.149.0 and tone@14.8.49 (see README).
//   npm i three@0.149.0 tone@14.8.49 && node test/check.mjs
import fs from 'fs'; import http from 'http'; import path from 'path'; import { fileURLToPath } from 'url'; import { createRequire } from 'module';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '..'), require = createRequire(import.meta.url), { chromium } = require('playwright');
const lib = (pkg, f) => { for (let d of [process.cwd(), here]) for (;; d = path.dirname(d)) { const p = path.join(d, 'node_modules', pkg, f); if (fs.existsSync(p)) return fs.readFileSync(p); if (path.dirname(d) === d) break; } throw new Error('install ' + pkg + ' (npm i three@0.149.0 tone@14.8.49)'); };
const server = http.createServer((q, r) => { const f = path.join(root, q.url.split('?')[0] === '/' ? 'index.html' : q.url.split('?')[0]); if (fs.existsSync(f) && fs.statSync(f).isFile()) { r.writeHead(200, { 'content-type': 'text/html' }); r.end(fs.readFileSync(f)); } else { r.writeHead(404); r.end(); } });
await new Promise(r => server.listen(0, r)); const port = server.address().port;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 240, height: 520 }, hasTouch: true })).newPage(); const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.route('**/*', rt => { const u = rt.request().url(); if (u.includes('three.min.js')) return rt.fulfill({ body: lib('three', 'build/three.min.js'), contentType: 'application/javascript' }); if (u.includes('Tone')) return rt.fulfill({ body: lib('tone', 'build/Tone.js'), contentType: 'application/javascript' }); return u.startsWith('http://localhost:' + port) ? rt.continue() : rt.abort(); });
await page.goto('http://localhost:' + port + '/'); await page.waitForFunction(() => typeof THREEOK !== 'undefined' && THREEOK === true, null, { timeout: 60000 });
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

// ---- 1. static map checks ----
const A = await page.evaluate(() => {
  const real = OBJ.filter(o => !o.mv), lab = real.filter(o => !o.dorm && Math.abs(o.x0) < 4.2 && Math.abs(o.z0) < 4.2), ed0 = lab.filter(o => o.maxDim <= CFG.edibleRatio * CFG.stages[0].d);
  const zoneMass = [0, 0, 0, 0, 0]; real.forEach(o => zoneMass[o.dorm ? 0 : zoneIdx(o.x0, o.z0)] += o.mass);
  const mall = OBJ.find(o => o.t === 'mall'), bad = /mosque|surau|temple|church/i;
  return { labMass: ed0.reduce((s, o) => s + o.mass, 0), labNoTube: ed0.filter(o => o.t !== 'tube').reduce((s, o) => s + o.mass, 0), first: CFG.stages[1].mass,
    mall: [mall.x0, mall.z0, mall.maxDim], biggest: OBJ.every(o => o === mall || o.maxDim < mall.maxDim), mallZone: zoneIdx(mall.x0, mall.z0), zoneMass, total: TOTAL_MASS, n: OBJ.length,
    worship: Object.keys(TYPES).filter(k => bad.test(k)), edgeOk: OBJ.every(o => Math.abs(o.x0) <= 48 && Math.abs(o.z0) <= 48), half: CFG.half, house: [HOUSE.out * 2],
    unreachable: OBJ.filter(o => o.maxDim > CFG.edibleRatio * (CFG.stages[3].d + .6 * (1 - o.mass / TOTAL_MASS))).map(o => o.t), mallGate: mall.maxDim / CFG.edibleRatio, d3: CFG.stages[3].d,
    zones: [0, 1, 2, 3, 4].map(z => real.filter(o => !o.dorm && zoneIdx(o.x0, o.z0) === z).length), debris: DEB.length };
});
ok(A.half === 48 && A.house[0] === 8, '96 x 96 map, 8 x 8 house footprint');
ok(A.labMass >= A.first * 1.10 && A.labMass <= A.first * 1.15, `lab edible mass ${A.labMass} is 10-15% above the first threshold (${A.first})`);
ok(A.labNoTube >= A.first, `threshold still reachable without the containment tube (${A.labNoTube})`);
ok(A.biggest && A.mallZone === 4, `mall is the largest object (${A.mall[2]}) and sits in the outer edge`);
ok(A.mallGate > A.d3 && A.mallGate < A.d3 + .6 * .9, `mall unlocks only late in Critical Mass (needs goo size ${A.mallGate.toFixed(2)})`);
ok(A.worship.length === 0, 'no places of worship');
ok(A.unreachable.length === 0, 'every object is eatable by the end');
ok(A.edgeOk, 'everything is inside the map');
console.log('     zone mass (house/taman/shoplots/township/outer):', A.zoneMass.join(' / '), '| total', A.total, '| objects', A.n, '| per zone', A.zones.join('/'), '| debris', A.debris);

// ---- 2. closure: a perfect player can eat everything (grid flood fill, goo grows as it eats) ----
const C = await page.evaluate(() => {
  const H = CFG.half, STEP = .5, N = Math.round(2 * H / STEP), S = CFG.stages, objs = OBJ.filter(o => !o.mv), eaten = new Set(); let mass = 0, objMass = 0, collapsed = false;
  const dOf = () => { let st = 0; while (st < 3 && mass >= S[st + 1].mass) st++; if (st >= 3) return S[3].d + .6 * (objMass / TOTAL_MASS); const pr = clamp((mass - S[st].mass) / (S[st + 1].mass - S[st].mass), 0, 1); return S[st].d + (S[st + 1].d - S[st].d) * CFG.growBlend * pr; };
  const idx = v => Math.floor((v + H) / STEP);
  for (let it = 0; it < 60; it++) {
    const d = dOf(), R = d / 2, cr = R * .92, edMax = CFG.edibleRatio * d, lim = collapsed ? H - .35 - cr : HOUSE.inn - cr, blocked = new Uint8Array(N * N);
    for (const o of objs) { if (eaten.has(o) || (o.dorm && !collapsed) || o.maxDim <= edMax) continue; for (let k = Math.max(0, idx(o.z0 - o.cd / 2 - cr)); k <= Math.min(N - 1, idx(o.z0 + o.cd / 2 + cr)); k++) for (let i = Math.max(0, idx(o.x0 - o.cw / 2 - cr)); i <= Math.min(N - 1, idx(o.x0 + o.cw / 2 + cr)); i++) { const ex = Math.max(Math.abs(-H + (i + .5) * STEP - o.x0) - o.cw / 2, 0), ez = Math.max(Math.abs(-H + (k + .5) * STEP - o.z0) - o.cd / 2, 0); if (ex * ex + ez * ez < cr * cr) blocked[k * N + i] = 1; } }
    const free = (i, k) => Math.abs(-H + (i + .5) * STEP) <= lim && Math.abs(-H + (k + .5) * STEP) <= lim && !blocked[k * N + i], seen = new Uint8Array(N * N); let si = idx(0), sk = idx(0);
    if (!free(si, sk)) for (let r = 1; r < 12; r++) { let f = false; for (let a = -r; a <= r && !f; a++) for (const [i, k] of [[si + a, sk - r], [si + a, sk + r], [si - r, sk + a], [si + r, sk + a]]) if (free(i, k)) { si = i; sk = k; f = true; break; } if (f) break; }
    const q = [[si, sk]]; seen[sk * N + si] = 1; while (q.length) { const [i, k] = q.pop(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + a, nk = k + b; if (ni < 0 || nk < 0 || ni >= N || nk >= N || seen[nk * N + ni] || !free(ni, nk)) continue; seen[nk * N + ni] = 1; q.push([ni, nk]); } }
    let ate = 0; for (const o of objs) { if (eaten.has(o) || (o.dorm && !collapsed) || o.maxDim > edMax) continue; const ri = Math.ceil(R / STEP) + 1; let hit = false;
      for (let k = Math.max(0, idx(o.z0) - ri); k <= Math.min(N - 1, idx(o.z0) + ri) && !hit; k++) for (let i = Math.max(0, idx(o.x0) - ri); i <= Math.min(N - 1, idx(o.x0) + ri); i++) if (seen[k * N + i] && (-H + (i + .5) * STEP - o.x0) ** 2 + (-H + (k + .5) * STEP - o.z0) ** 2 < (R + .1) ** 2) { hit = true; break; }
      if (hit) { eaten.add(o); mass += o.mass; objMass += o.mass; ate++; } }
    if (!collapsed && mass >= S[1].mass) collapsed = true; if (!ate && collapsed) break;
  }
  return { left: objs.filter(o => !eaten.has(o)).map(o => o.t + '@' + o.x0.toFixed(0) + ',' + o.z0.toFixed(0)), collapsed };
});
ok(C.collapsed && C.left.length === 0, 'closure: nothing is unreachable or soft-locked' + (C.left.length ? ' (left: ' + C.left.slice(0, 10).join(' ') + ')' : ''));

// ---- 3. start sequence + collapse timeline (real flow: Consume, skip comic, countdown) ----
await page.click('#consume', { force: true }); await page.waitForTimeout(600); await page.click('#cskip', { force: true }).catch(() => {});
await page.waitForFunction(() => G.phase === 'play', null, { timeout: 30000 });
const S0 = await page.evaluate(() => ({ pos: [G.sx, G.sz], zoom: G.zoomV, up: G.houseUp, stage: G.stage, camZoomNormal: CFG.camBaseH }));
ok(S0.pos[0] === 0 && S0.pos[1] === 0 && S0.up && S0.zoom < S0.camZoomNormal, `goo spawns at the centre inside the house with a tight start zoom (${S0.zoom})`);
const T = await page.evaluate(() => new Promise(res => {
  const ev = []; let st = 0; const inside = () => Math.abs(G.sx) < HOUSE.inn && Math.abs(G.sz) < HOUSE.inn;
  const first = (k, c) => { if (c && !ev.find(e => e[0] === k)) ev.push([k, +(G.col ? G.col.t : -1).toFixed(2), +G.zoomV.toFixed(1)]); };
  for (const o of OBJ) if (!o.dorm && !o.mv && o.t !== 'tube' && Math.abs(o.x0) < 4.2 && Math.abs(o.z0) < 4.2 && o.maxDim <= 1.08) startEat(o, true);
  const iv = setInterval(() => { st++; const t = document.getElementById('toast'), b = document.getElementById('banner');
    first('shake', G.col && G.shake > .1); first('boundaryGone', G.col && !G.houseUp); first('banner', b.className.includes('show') && G.stage === 1);
    first('toast', t.className.includes('show')); first('zoomSettled', !G.zoom && !G.houseUp && Math.abs(G.zoomV - baseZoom()) < .05);
    if (!G.col && st > 20 && G.stage === 1 && t.className.includes('show')) { clearInterval(iv); res({ ev, debris: DEB.filter(o => o.state === 0).length, houseHidden: !W3.house.group.visible, zoom: G.zoomV, base: baseZoom() }); }
    if (st > 900) { clearInterval(iv); res({ ev, timeout: true }); } }, 40);
}));
const evn = Object.fromEntries((T.ev || []).map(e => [e[0], e[1]]));
ok(!T.timeout && 'shake' in evn && 'boundaryGone' in evn && 'zoomSettled' in evn && 'toast' in evn, 'collapse fired automatically: shake, boundary removed, camera pull-back, notification');
ok(T.debris === 44 && T.houseHidden, `house gone, ${T.debris} edible debris chunks`);
ok(Math.abs(T.zoom - T.base) < .05, `camera pulled back to the stage-1 zoom (${T.base})`);
const zs = (T.ev || []).find(e => e[0] === 'zoomSettled'), ts = (T.ev || []).find(e => e[0] === 'toast');
ok(zs && ts && ts[1] >= zs[1] || (ts && ts[1] < 0), 'Camo Mode notice appears after the camera has settled, never on top of the pull-back');
console.log('     timeline (collapse seconds, zoom):', JSON.stringify(T.ev));
ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : ''));
await browser.close(); server.close(); console.log(fails ? fails + ' check(s) failed' : 'all checks passed'); process.exit(fails ? 1 : 0);
