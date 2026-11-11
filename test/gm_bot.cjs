// Headless bot: plays the USJ 11 build by walking to the nearest edible object, logs stage times.
// Usage: node test/gm_bot.cjs DEPS_DIR [SIM_SECONDS]
const { chromium } = require('playwright');
const path = require('path');
const deps = process.argv[2], simSec = +(process.argv[3] || 900);
const file = path.resolve(__dirname, '../greymatter/index.html');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await (await b.newContext({ viewport: { width: 430, height: 860 } })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.route(/three\.min\.js|three\.js\/r149/, r => r.fulfill({ path: path.join(deps, 'node_modules/three/build/three.min.js'), contentType: 'application/javascript' }));
  await pg.route(/Tone\.js|\/tone/, r => r.fulfill({ path: path.join(deps, 'node_modules/tone/build/Tone.js'), contentType: 'application/javascript' }));
  await pg.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await pg.goto('file://' + file);
  await pg.waitForFunction(() => typeof THREEOK !== 'undefined' && THREEOK, null, { timeout: 60000 });
  const res = await pg.evaluate((simSec) => {
    let sd = 12345; Math.random = () => { sd |= 0; sd = sd + 0x6D2B79F5 | 0; let q = Math.imul(sd ^ sd >>> 15, 1 | sd); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; }; started = true; running = false; $('title').classList.add('hidden'); resetLevel(); updateCam(0, true); startCountdown();
    const dt = 1 / 60, log = []; let lastStage = 0, tgt = null, stuck = 0, lx = 0, lz = 0;
    for (let i = 0; i < simSec * 60; i++) {
      const g = G;
      if (g.phase === 'count' || g.phase === 'play' || g.phase === 'feast') {
        if (g.phase === 'play') {
          const edMax = CFG.edibleRatio * g.d;
          if (!tgt || tgt.state !== 0 || tgt.maxDim > edMax || stuck > 60) {
            let best = null, bd = 1e9;
            for (const o of OBJ) { if (o.state !== 0 || o.dorm || o.mv || o.maxDim > edMax) continue; if (g.houseUp && Math.abs(o.x) > 4) continue; const d = Math.hypot(o.x - g.sx, o.z - g.sz); if (d < bd) { bd = d; best = o; } }
            if (stuck > 60 && best) { const near = OBJ.filter(o => o.state === 0 && !o.dorm && !o.mv && o.maxDim <= edMax && o !== tgt).sort((a, c) => Math.hypot(a.x - g.sx, a.z - g.sz) - Math.hypot(c.x - g.sx, c.z - g.sz)).slice(0, 25); tgt = near[(Math.random() * near.length) | 0] || best; } else tgt = best; stuck = 0;
          }
          if (tgt) { const dx = tgt.x - g.sx, dz = tgt.z - g.sz, L = Math.hypot(dx, dz) || 1, sp = CFG.baseSpeed * (1 + CFG.speedPerStage * g.stage) * (g.stage >= 3 ? CFG.critSpeed : 1) * dt; if (!g.eating.length) { g.sx += dx / L * sp; g.sz += dz / L * sp; } }
          if (Math.hypot(g.sx - lx, g.sz - lz) < .004) stuck++; else stuck = 0; lx = g.sx; lz = g.sz;
        }
        step(dt);
        if (G.stage !== lastStage) { lastStage = G.stage; log.push({ stage: G.stage, t: +G.clock.toFixed(1), mass: Math.round(G.mass), gone: G.gone, of: OBJ.length }); }
        if (G.phase === 'feast' && !log.some(l => l.feast)) log.push({ feast: true, t: +G.clock.toFixed(1), gone: G.gone, of: OBJ.length });
        if (G.phase === 'results' || G.phase === 'over') break;
      } else step(dt);
    }
    return { log, end: { phase: G.phase, t: +G.clock.toFixed(1), mass: Math.round(G.mass), objMass: Math.round(G.objMass), total: Math.round(TOTAL_MASS), gone: G.gone, of: OBJ.length, stage: G.stage } };
  }, simSec);
  console.log(JSON.stringify(res, null, 1)); console.log('errors', JSON.stringify(errs.slice(0, 5)));
  await b.close();
})();
