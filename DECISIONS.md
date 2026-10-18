# Decisions

Judgement calls where the PRD was silent or ambiguous.

- **PeerJS URL**: pinned to `cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js`. 1.5.4 exists on npm (checked), but the build sandbox blocks cdnjs, so the CDN URL itself was NOT verified from here. Check it loads from a normal connection. If it fails, the game still runs and practice works.
- **Third transport**: added a BroadcastChannel transport (`?net=tabs`) so two tabs can test multiplayer offline and in CI. Game code never knows which transport is active.
- **ClaudeRoom API shape**: only `presence(patch)` and `onPeers(fn)` are used. The shape of the peers list is not documented in the PRD, so the code normalises arrays, Maps and objects, and finds "self" by an id it writes into its own presence. Tested only against a mock, not the real runtime. Host = alphabetically first peer label; roles resolve once both players are present.
- **Window timing**: the 3 s warning starts at 1:33, 1:03, 0:33 so the window actually appears/closes at 1:30, 1:00, 0:30. Each event picks a random slot and toggles it.
- **First app spawn** at 4 s after GO (then every 10 s), so the first drone shows up early.
- **Scoring/It**: reading the rules literally, the tagger scores and the tagged pilot becomes It, so the "don't be It" card is worded "DON'T GET TAGGED".
- **Lag compensation**: the host accepts a guest's tag claim if the 24 px check passes against the host's latest position OR any of its own positions in the last ~250 ms (interp buffer + half ping). Without this, ~150 ms latency would reject fair tags.
- **Host-direct detection** uses the positions the host actually sees (interpolated remote), overlap plus 2 px.
- **Jump numbers** tuned by measurement: single jump ~110 px, double jump ~190 px total.
- **Spawns** at x=211 and x=633 (422 px apart both ways, so still over 300 px wrap-aware).
- **Layout reachability** is checked by a script (rise <= 165 px, gap <= 130 px, every platform and slot reachable from the floor); the controls areas (bottom left and right) are kept clear.
- **Popup slots only spawn apps when fully open**; a closing window relocates its apps when the closing warning ends.
- **Guest pilot conflict**: guest auto-picks the opposite of the host on join. If the host later takes the guest's pilot, the guest's READY is disabled and they are told to switch. If the host switches away, the guest's pick becomes valid again.
- **LOBBY / LEAVE in a networked round** sends both pilots to the lobby (a round cannot continue alone). Only the other pilot sees "PILOT LEFT TO LOBBY".
- **Guest reconnect**: a dropped guest auto-retries for 20 s, then shows HOST DISCONNECTED. A silent link (no packets for 6 s) counts as dropped.
- **Intents** (pilot pick, ready, rematch, pause, lobby) travel inside the guest's own state message, because ClaudeRoom has only presence.
- **No render interpolation** between physics steps (target is a 60 Hz phone, steps equal frames).
- **Bot** is deliberately gentle: 380 ms reaction delay, 82% speed. Tunable in `CONFIG.BOT`.
- **Practice button** lives on the connect screen (not inside a networked lobby, where leaving would drop the link).
- **Not verified on real hardware**: the 55+ fps target on the Reno 2F, real PeerJS broker traffic, and real ClaudeRoom. Headless Chromium measured ~2.5 ms/frame render and ~0.03 ms/step.

## Art integration (art pack v1)
- **What was integrated**: only the desktop background, as a visual PROTOTYPE. `tools/make_bg.py` paints out the two floating window-like bars baked into the concept crop (they looked like platforms), exports a 62 KB WebP, and `tools/embed_art.py` embeds it in `index.html` as a data URI (still one self-contained file, no local asset paths). The image is created once at startup, drawn once into the cached background layer per resize, dimmed with `CONFIG.ART.BG_DIM` (0.7), with the grid and scanlines still drawn in code on top. `?bg=0` turns it off for comparison.
- **Kept procedural, as the brief requires**: platforms, windows, desktop icons, taskbar, HUD, UI panels, touch controls, IT badge, shield, speed trail, ghost, frozen effect, jet flames, particles, tag flash, BOING. Gameplay geometry, physics, hitboxes and networking were not touched.
- **Reference boards are not used as sprites** (checkerboard baked in, labelled, multi-pose). They are not shipped in the repo; the pack's brief, README and an updated `assets/ASSET_MANIFEST.json` are.
- **Patch, Bolt and the three drones stay as code-drawn placeholders.** Nothing in the pack is a production sprite. Placeholders follow the brief's design notes (Patch: lean, mint and white, yellow V crest, cyan eye slit, hex reactor with medic cross, mint knees, white hands and feet; Bolt: bulky, blue, twin horns, yellow eyes, bolt emblem, hazard-striped shoulders, big fists, yellow toe caps). Only change this round: Patch's arms are now white.
- **Sprite-sheet hook is ready**: set `CONFIG.ART.SHEETS.patch/bolt` (or `?patchSheet=` / `?boltSheet=` for dev). One row of 192x192 frames: idle, run1-4, jumpUp, jumpPeak, jumpDown, land. Drawn bottom-centre at `SPRITE_SCALE` 0.5, mirrored when facing left, independent of the 28x40 hitbox. Verified with a synthetic sheet only (not committed).
- **Outstanding artwork** (also listed in `assets/ASSET_MANIFEST.json`):
  1. `patch_sprites.png`, `bolt_sprites.png`: transparent, 9 frames of 192x192, consistent foot baseline, no text or baked glow. The boards also show idle 2, double-jump, frozen and IT frames; the game draws frozen and IT in code, so these are optional.
  2. `bopster.png`, `grumpulator.png`, `sneakfolder.png`: transparent 128x128. Not wired to a loader yet; add when delivered (the existing `drawDrone` is the single place to swap).
  3. Final desktop background, 1688x780: dark, low contrast, uncluttered centre, no characters, labels, taskbar, HUD, windows or platform-like shapes.
  4. Optional effect art (all effects are currently code-drawn, which the brief prefers).
- **Known visual issues with the prototype background**: busy furniture and the plant sit directly behind mid-level platforms; faint smudges where the bars were removed; the concept's reflective floor shows above the taskbar line. Playable, but the final background should simplify the lower half.

## Generated sprites (supersedes the placeholder note above)
- No image model was available, so the sprite sheets are **rendered from the game's own vector pilot and drone designs** by `tools/make_sprites.mjs` (Playwright), then embedded by `tools/embed_art.py`. Pipeline: draw at 192x192 (drones 128x128), add a dark sticker outline, cel-shade gradient and a glossy rim light, export transparent PNG.
- Files: `assets/characters/patch/patch_sprites.png`, `assets/characters/bolt/bolt_sprites.png` (9 frames of 192x192: idle, run1-4, jumpUp, jumpPeak, jumpDown, land; feet on one baseline, facing right), `assets/drones/{bopster,grumpulator,sneakfolder}.png`. Jet flames, IT badge, shield, ghost, frozen, trails and particles remain code-drawn.
- Game side: sprites are drawn bottom-centre at `CONFIG.ART.SPRITE_SCALE` (0.42, about 56 px tall) and drones at `DRONE_SCALE`, independent of the 28x40 hitbox. `?noart=1` forces the old code-drawn look. All art is embedded as data URIs; no local asset paths.
- **Honest quality note**: these keep the intended designs (Patch lean mint/white with yellow V crest, cyan eye slit, medic-cross reactor; Bolt bulky blue with twin horns, bolt emblem, hazard shoulders, big fists) but are flatter and simpler than the concept paintings. Painted replacements with the same filenames and frame order can be dropped in and re-embedded with `python3 tools/embed_art.py`.
