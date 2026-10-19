// Renders production sprite sheets from the game's own vector pilot/drone designs.
// Usage (server on :8123): node tools/make_sprites.mjs   then   python3 tools/embed_art.py
import { createRequire } from 'module'; import fs from 'fs';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
await ctx.route(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/, r => r.abort());
const p = await ctx.newPage();
await p.goto('http://localhost:8123/index.html?noart=1&bg=0'); await p.waitForTimeout(2200);
const out = await p.evaluate(() => {
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function stylize(src, w, h, op) {              // dark sticker outline + cel shading + glossy rim, all inside the silhouette
    const res = mk(w, h), g = res.getContext('2d');
    const sil = mk(w, h), sg = sil.getContext('2d'); sg.drawImage(src, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#070a12'; sg.fillRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832; g.drawImage(sil, Math.cos(a) * op, Math.sin(a) * op); }
    const body = mk(w, h), bg = body.getContext('2d'); bg.drawImage(src, 0, 0); bg.globalCompositeOperation = 'source-atop';
    const gr = bg.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,255,255,.16)'); gr.addColorStop(0.45, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,10,50,.38)');
    bg.fillStyle = gr; bg.fillRect(0, 0, w, h);
    const gv = bg.createLinearGradient(0, h * 0.62, 0, h); gv.addColorStop(0, 'rgba(0,10,50,0)'); gv.addColorStop(1, 'rgba(0,10,50,.22)'); bg.fillStyle = gv; bg.fillRect(0, 0, w, h);
    g.drawImage(body, 0, 0);
    const rim = mk(w, h), rg = rim.getContext('2d'); rg.drawImage(src, 0, 0); rg.globalCompositeOperation = 'source-in'; rg.fillStyle = '#fff'; rg.fillRect(0, 0, w, h);
    rg.globalCompositeOperation = 'destination-out'; rg.drawImage(src, 2.4, 2.4);
    g.globalAlpha = 0.55; g.drawImage(rim, 0, 0); g.globalAlpha = 1;
    return res;
  }
  const FRAMES = [
    { a: 0, t: 0.35 }, { a: 1, ph: 1 }, { a: 1, ph: 0.35 }, { a: 1, ph: -1 }, { a: 1, ph: -0.35 },
    { a: 2, vy: -300 }, { a: 2, vy: -20 }, { a: 3, vy: 300 }, { a: 3, vy: 0, crouch: true }];
  const sheets = {};
  [0, 1].forEach(pilot => {
    const sheet = mk(192 * 9, 192), sg = sheet.getContext('2d');
    FRAMES.forEach((fr, i) => {
      const raw = mk(192, 192), g = raw.getContext('2d');
      g.translate(96, 182); if (fr.crouch) g.scale(1.14, 0.86); g.scale(2.3, 2.3);
      drawMech(g, pilot, { t: fr.t || 0, ph: fr.ph, a: fr.a, vy: fr.vy || 0, f: 1, it: false, dj: false, noFlame: true });
      sg.drawImage(stylize(raw, 192, 192, 2.6), i * 192, 0);
    });
    sheets[pilot ? 'bolt' : 'patch'] = sheet.toDataURL('image/png');
  });
  DRONE_NOFLAME = true;
  [1, 2, 3].forEach(t => {
    const raw = mk(128, 128), g = raw.getContext('2d'); g.translate(64, 62); g.scale(3.5, 3.5); drawDrone(g, t, 0, 1);
    sheets['drone' + t] = stylize(raw, 128, 128, 2.2).toDataURL('image/png');
  });
  DRONE_NOFLAME = false;
  return sheets;
});
const w = (path, k) => fs.writeFileSync(path, Buffer.from(out[k].split(',')[1], 'base64'));
fs.mkdirSync('assets/characters/patch', { recursive: true }); fs.mkdirSync('assets/characters/bolt', { recursive: true }); fs.mkdirSync('assets/drones', { recursive: true });
w('assets/characters/patch/patch_sprites.png', 'patch'); w('assets/characters/bolt/bolt_sprites.png', 'bolt');
w('assets/drones/bopster.png', 'drone1'); w('assets/drones/grumpulator.png', 'drone2'); w('assets/drones/sneakfolder.png', 'drone3');
console.log('sprites written'); await b.close();
