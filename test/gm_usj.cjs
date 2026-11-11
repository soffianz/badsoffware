// Headless smoke test for the Grey Matter USJ 11 build.
// Usage: node test/gm_usj.cjs DEPS_DIR OUT_DIR   (DEPS_DIR has node_modules/three@0.149.0 and tone@14.8.49)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const deps = process.argv[2], out = process.argv[3]; fs.mkdirSync(out, { recursive: true });
const file = path.resolve(__dirname, '../greymatter/index.html');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await (await b.newContext({ viewport: { width: 430, height: 860 }, deviceScaleFactor: 1 })).newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.route(/three\.min\.js|three\.js\/r149/, r => r.fulfill({ path: path.join(deps, 'node_modules/three/build/three.min.js'), contentType: 'application/javascript' }));
  await pg.route(/Tone\.js|\/tone/, r => r.fulfill({ path: path.join(deps, 'node_modules/tone/build/Tone.js'), contentType: 'application/javascript' }));
  await pg.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await pg.goto('file://' + file);
  await pg.waitForFunction(() => typeof THREEOK !== 'undefined' && THREEOK, null, { timeout: 60000 });
  const info = await pg.evaluate(() => ({ objs: OBJ.length, total: TOTAL_MASS, stages: CFG.stages.map(s => s.mass), types: Object.keys(TYPES).length, meshes: W3.meshes.length, bnd: BND }));
  console.log('loaded', JSON.stringify(info));
  await pg.evaluate(() => { started = true; $('title').classList.add('hidden'); resetLevel(); updateCam(0, true); G.phase = 'intro'; running = true; lastT = performance.now(); startCountdown(); });
  await pg.waitForTimeout(4500);
  await pg.screenshot({ path: path.join(out, 'start.png') });
  const spots = [['arcadia', -2, 20], ['terraces', 20, -15], ['fields', 8, -45], ['north', 20, -75], ['east_edge', 55, -50]];
  for (const [n, x, z] of spots) {
    await pg.evaluate(([x, z]) => { G.houseUp = false; G.sx = x; G.sz = z; G.cx = x; G.cz = z; G.zoomV = 30; }, [x, z]);
    await pg.waitForTimeout(900);
    await pg.screenshot({ path: path.join(out, n + '.png') });
  }
  console.log('errors', JSON.stringify(errs.slice(0, 8)));
  await b.close();
})();
