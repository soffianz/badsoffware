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

## Art pack v2: six pilots, new background and drones
- **Integrated**: art pack v2 (`DEVELOPMENT_HANDOFF.md` contract). Patch and Bolt sheets replaced by the v2 art; new pilots Glitch, Rumble, Nova, Havoc; new drones; new 1688x780 background (embedded as lossless-ish WebP, 6.8 KB vs 32 KB PNG); six portraits (resized to 128 px lossless WebP); favicon and apple-touch icon embedded as data URIs; `og:image` points at `social_share.png` in the public repo.
- **Roster is data-driven**: `CONFIG.PILOTS` (index = wire id in `S.pil`, order matches `assets/PILOT_ROSTER.json` and `tools/embed_art.py`). Cosmetic only: one physics and hitbox for everyone. Defaults stay Patch (host) and Bolt (the other pilot). Duplicates are still blocked (guest picking the host's pilot is shown as TAKEN and rejected by the host); the host also rejects out-of-range ids from the guest.
- **Guest default**: the guest now starts on their own saved pilot if it differs from the host's, otherwise the first free one (Patch, then Bolt). Practice and 2P debug: the opponent keeps its pilot unless you pick the same one, then it moves to the first free one.
- **UI changes needed for six cards**: pilot select is now a row of six 129 px cards with the status rows and ready button underneath. HUD taskbar and the round-over screen use each pilot's own name, code and colour (lower roster number on the left), and round-over shows the portrait. The selected card runs its animation; the others idle. Title screen shows two random pilots per visit.
- **Background**: `BG_DIM` 0.7 to 0.2 because the v2 background is already dark and clean; at 0.7 it would be invisible. Grid and scanlines still draw on top.
- **Debug URLs**: `?<id>Sheet=` for any pilot (`?patchSheet=`, `?boltSheet=`, `?glitchSheet=`...), `?noart=1` still gives the code-drawn look (pilots 3-6 reuse the Patch/Bolt drawings alternately there).
- **Not used yet**: `assets/effects/*` (optional, effects remain code-drawn), `branding/badsoffware_logo.svg`. Pack status stays AVAILABLE, not COMPLETE, until Soff approves the look on a real phone.
- **Tests**: `test/roster.mjs` added (six assets decode, two-tab pilot picks and conflict, out-of-range id, practice picks, round-over names). All older tests still pass.

## Weapons v1 (simple code-drawn effects)
- **Rules**: every pilot has one weapon (index = roster number). Catching a rogue app gives **2 charges** (max 3); weapons are locked at 0 charges (button shows CATCH A DRONE). **3 s cooldown** between uses. Charges reset each round and are kept when tagged. Both pilots can use weapons at any time in `play`, not during countdown, pause or the post-tag freeze. **Weapons never tag.**
- **Rogue apps no longer give speed, shield or ghost.** The old power-up code is still in the file but is never granted (S.pw stays 0). All three drone types give the same charges.
- **Weapons**: Patch Cable (grapple up and across to the nearest window within 230 px / 200 px rise, else a hop forward), Zap Pulse (stuns the other pilot 0.9 s if within 120 px in front; stunned pilots can still be tagged), Phase Blink (teleport 130 px forward, flickering decoy for 1.4 s, decoy is cosmetic), Ground Slam (shoves the other pilot within 150 px away), Dash Burst (0.17 s dash at 760 px/s, no gravity), Pop-up Bomb (drops a fake window, blast after 1.5 s shoves the other pilot within 115 px; never hurts its owner). All tunables are in `CONFIG.WPN`.
- **Networking**: the user's own phone applies self-movement at once. The host confirms the charge and sends one event (`S.wn` counter + `S.wv` payload). Effects on the other pilot are applied by that pilot's own phone (same idea as the pop-up window bounce), so positions never need correcting. The guest's use is sent in its own state as `w` and `wp`; the host rejects a use with no charge, during a freeze, or inside the cooldown window.
- **Controls**: touch has a hex weapon button above JUMP (with icon, cooldown ring and charge pips). Keyboard: E, F or Left Shift (solo and practice), Right Shift or `/` for P2 in `?debug=2p`, plus Right Shift in solo play. The HUD shows a weapon chip top left and each pilot's charges under their name in the taskbar.
- **Bot**: uses its weapon with simple distance rules.
- **Art**: only the icons are used (embedded at 96 px), plus the charge pip look drawn in code. All effects are drawn in code. The animation strips from draft 1 are NOT used because they were damaged by pre-slicing; see `assets/weapons/STATUS.md`.
- **Not verified**: balance (stun length, cooldown, charge counts), touch feel of the new button on the Reno 2F, and real network latency.
- **Tests**: `test/weapons.mjs` covers locked state, catching a drone, all six weapons, cooldown, two-phone guest and host use. `test/net.mjs` pickup check updated for charges.

## Tower mode (scrolling upwards)
- **World**: 3 screens tall (`CONFIG.WORLD_H` 1170). `FLOOR` is now the world ground (1124), `SFLOOR` the taskbar line on screen (344). At the bottom the view is identical to the old game. Sides still wrap. No fall damage: falling is the normal physics, no stun, no freeze.
- **Layouts**: the 5 old single-screen layouts are replaced by 5 tall ones (BRICKWORK, TWIN SHAFTS, SPIRAL, SCATTER, WIDE AND NARROW), each 12 rows of windows 86 px apart, plus 3 desktop-icon ledges and 3 pop-up window slots (rows 2, 5 and 8, placed in the row's widest gap). They are built from fixed seeds with no `Math.random`, so both phones get the identical tower. `test/tower.mjs` checks every platform is reachable, and simulates every upward hop with the game's own `stepPlayer` (it passed for all five).
- **Camera**: each phone follows its own pilot. It anchors to the last platform you stood on, so hops do not shake the view, and catches up faster when falling. Practice mode follows you, `?debug=2p` follows the midpoint. Purely client side: nothing new on the network.
- **Finding each other**: an arrow at the top or bottom edge shows the other pilot's side, whether they are It, and how far in screens (for example "IT 2.6 SCREENS DOWN"). The HUD shows your altitude in metres (10 px = 1 m), and the world has altitude ticks every 13 m and faint scrolling rows.
- **Drones**: spawn within about a screen of a random pilot (so weapons are reachable), up to 4 at a time, every 8 s.
- **Bot**: when fleeing and the other pilot is close, half the time it climbs instead of running along the floor. Chasing already handled height.
- **Weapons**: Patch Cable reaches 230 px up (was 200).
- **Unchanged on purpose**: round length (2 min), both pilots still start on the ground, no anti-stalemate mechanic yet. If someone can sit unreachable at the top, add one (closing top windows or a rising hazard). Needs real play to know.
- **Tests**: `test/climb.mjs` (camera follows, arrow, free fall, bot chase) and `test/tower.mjs` added. `test/weapons.mjs` and `test/touch.mjs` now use `__bsw.FLOOR` instead of hard-coded ground heights.

## V2: rebuilt from the v2 PRD (portrait, 4 players, Badsoffware power-ups)
`index.html` was rewritten rather than patched in place - orientation, player count, scoring rule
and the whole ability system all change (section "What changed", docs/PRD_v2.md), so patching
would have touched nearly every function anyway. The v1 engine (seeded layout generator, physics
constants, camera-follow math, input handling, audio synth) was reused by porting the algorithms,
not the code verbatim, since the surrounding data shapes (world height, player count, platform
list) are all different.

- **Art scale normalization uses the median frame height of a character's run cycle, not the
  max.** The raw BSWV21 sources aren't all drawn at the same zoom level (Bolt's frames run noticeably
  larger than Patch's), and within Bolt's own run cycle individual frames vary enough that max let
  one frame drag the whole character smaller than intended. Median is robust to both.
- **Idle/tagged stopgaps**: Patch and Bolt's delivered "idle_4_frames" sources turned out to be two
  mismatched reference poses, not an animation, and Havoc has no delivered tagged art at all. Each
  stopgaps to a single real frame (the run cycle's frame 0, or the idle frame for Havoc's tagged)
  animated in code (bob / shake) rather than block on art that doesn't exist - the PRD's own
  Appendix A already names exactly this stopgap for Patch's idle, so it's not a new decision, just
  applied consistently to the other three cases that turned out to need it too.
- **Networking simplifications vs v1's weapon-era net code**: no snapshot interpolation/
  extrapolation for remote robots (positions are applied directly from the latest message - can
  look slightly jittery over a real network's latency) and no lag-compensation history buffer for
  tag/Badsoffware-catch claims (a direct distance check against the claimant's reported position).
  Both are flagged in PRD_v2.md's own risks table as needing real play to tune; they're easy to add
  later (the claim messages already carry everything a lag-comp buffer would need) and weren't
  worth building before there was a real device to test against.
- **Reachability** is checked by BFS against the PRD's own stated rule (climb: rise<=165px AND
  gap<=110px; fall: any rise, gap<=110px only) rather than by simulating real jumps the way v1's
  tower did. Simpler to implement and verify, and it's checking the same rule the PRD states in
  words - a real-jump simulation would be a strictly stronger test and is a reasonable thing to add
  later, not a correctness gap found so far.
- **Ground Slam / Dash Burst / Phase Blink networking**: Dash and Blink are self-movement, so the
  actor's own phone applies them immediately (same model v1 used for weapons); Ground Slam has no
  self-movement, so the actor's phone only sends a claim and the host applies the AoE using its own
  copy of the actor's position - mirrors how v1 handled "effects on the other pilot are applied by
  that pilot's own phone" for its weapons, adapted to an AoE that can hit several robots at once.
- **Bots** don't explore the tower on their own; they only climb/flee vertically toward/away from
  a relevant robot (the It robot, or a chase target), with no distance gate (removed - see below).
  This matches PRD section 13's "when not It, keeps distance from the It robot, climbs or drops to
  escape" - reactive, not constant tower-scaling.
- **Bot climb commitment** (added after real-phone testing showed bots failing to close vertical
  gaps): a bot's decision to climb towards/away from a target used to be re-evaluated from scratch
  every ~130ms replan tick. Against a live, moving target (another bot reacting on its own) the
  target's relative height constantly crosses the "should I climb" threshold back and forth, so a
  bot would start a climb step then abandon it a tick later, never making net progress - looked
  like bots "ignoring" the chase. Fixed with a persistent `climbStep` field on the bot's state that
  is kept across replans until the step is actually reached, so a committed climb runs to
  completion before being re-evaluated. Verified in `test/v2_bot.mjs` with a target that jitters
  across the threshold via a sine wave: the bot still nets 60px+ of real altitude gain in 5s.
- **Street-level floor art**: `tools/process_page.py` processed every BSWV21 Page tileset image
  except `BSWV21_Page_Street_Level.png` - an oversight from the original scenery-wiring pass, so
  the world floor had no visual ground marker at all (just whatever the tiled mid-background
  showed). Added processing for it (scaled to the full 390px playfield width, not tiled - the
  world is a fixed width) and draw it anchored by its bottom edge at `FLOOR` in `drawPlatforms()`,
  with an improved solid-band greybox fallback for when the art isn't loaded.
- **Adaptive viewport height**: `doLayout()` used a fixed logical height (`CONFIG.H`) for the
  playfield, so any device whose aspect ratio didn't match that constant got letterboxed (black
  bars) rather than filling the screen - visible in a real phone screenshot. `VH`/`PLAY_H`/
  `PANEL_Y0` are now mutable and `doLayout()` computes an ideal height from the actual device
  viewport's aspect ratio (`visualViewport` width/height), clamped to a sane range, and resizes the
  stage/canvas CSS to match when it changes meaningfully. Verified with a non-default 412x950 test
  viewport (different aspect ratio from the 390x844 dev default): canvas `getBoundingClientRect()`
  exactly matched the full viewport with zero letterbox.
- **Not done this pass**: PeerJS is code-complete (`Net.hostPeer`/`Net.joinPeer`) but unverified -
  there's no real device in this build environment to dial a PeerJS broker from. The tabs transport
  (`Net.openTabs`, used by `test/v2_net.mjs`) is what's actually been exercised end to end.
- **Tests**: `test/v2_*.mjs` (smoke, tower, bot, powerups, net, art, fx, phone, modes), `test/run_all.mjs`
  runs all of them and prints a summary. The v1 `test/*.mjs` files test the v1 game (different
  orientation, player count and ability system) and were left as-is rather than adapted - they're a
  record of what v1 shipped with, not a suite v2 needs to keep passing.

## Two game modes, a practice battle-settings screen, and a code-only title-screen redesign

- **Two game modes**: Badsoffwares (default, unchanged - catching a drone grants ITS own effect:
  Bopster/Grumpulator/Sneakfolder/Hijacker) and Character Powers (new - catching ANY drone, even a
  hijacker-type one, grants the catcher's own robot its one signature power instead). Chosen on the
  new battle-settings screen for practice, or by the host from a new MODE button in the online
  lobby (`NET.gameMode`, replicated the same way `NET.roundLenMin` already was); live state lives in
  `S.gameMode`, read by `catchBadsoff()`. `CONFIG.ROBOTS[i].power` is the per-robot mapping: Patch →
  Patch Cable, Bolt → Zap Pulse, Glitch → Phase Blink, Havoc → Pop-up Bomb (Rumble/Nova's weapon
  concepts, Ground Slam/Dash Burst, are reserved for when those two pilots get added - not
  implemented, since no robot currently claims them).
  - Patch Cable (self): clears the user's own stun/frozen state and grants a speed boost - the one
    power allowed to activate WHILE stunned/frozen (every other power is gated behind the actor
    being free to act; this one's whole point is escaping that state, so `usePower()` special-cases
    it rather than gating it out).
  - Zap Pulse (aoe): a short-range stun burst, mechanically identical to Ground Slam just with its
    own radius/duration/colour - reusing the pattern rather than inventing new physics for it.
  - Phase Blink (self): the existing Sneakfolder teleport+decoy effect verbatim, just reachable
    under Glitch's name/colour in Character Powers mode.
  - Pop-up Bomb (aoe, delayed): genuinely new - a placed hazard (`S.bombs`, mirrors `S.drones`'
    pattern: host ticks it in `bombsStep()`, synced to guests via `sharedSnapshot`/
    `applySharedSnapshot`, drawn pulsing by `drawBombs()`) that sits for `BOMB_FUSE_MS` then stuns
    anyone still in range on detonation - doesn't hurt whoever's standing there the instant it's
    placed, only once its fuse runs out.
  - A `POWERS` registry unifies drone-type ids and character-power ids behind one lookup (name,
    colour, `kind: 'self' | 'aoe'`) so `usePower()`, the held-power HUD panel, and the client/host
    networking split (self-movement applies instantly on the actor's own phone; aoe only applies
    host-side off a claim) don't need to know which mode granted the power.
- **Battle-settings screen** (`S.ph = 'battleSettings'`, between the title and practice actually
  starting): bot count (1-2, down from the old fixed-at-"up to 3" title button - the Host/Join flow
  still supports up to 3 via `CONFIG.MAX_SLOTS`, this cap is practice-only per the request), match
  length (1/2/4 min or `∞`), and game mode, all picked from `segRow()` tile rows before tapping
  START. Infinity length is implemented as the literal JS value `Infinity` for `S.roundMs` - `S.t -=
  dtms` and the `S.t <= 0` end check both already behave correctly on `Infinity` with no special
  case, so a `∞` round simply never times out; `fmtTime()` special-cases only the *display* (an
  infinity glyph instead of a `NaN:NaN` clock). Automated tests (`DEBUG_BOTS` via the `?bots=`
  query string) skip straight past this screen so existing bot-stress tests don't need a UI flow.
- **Title screen redesign**: approximated the look of a reference mock (blueprint-grid backdrop,
  glowing wordmark, icon-led buttons with corner accent ticks) entirely in canvas code - no new art
  assets were generated or embedded, since this environment has no image-generation capability,
  only an art-processing pipeline for supplied source art. The existing BSWV21 scenery
  (far/mid skyline) still shows through behind the grid, since `drawBg()` was already called on the
  title screen before this pass. Flagged to the user: a literal pixel-art match to the mock's logo
  wordmark, corner schematic diagrams, and rain-soaked hero photo would need real exported art
  assets (a background image, a logo file) supplied the same way the BSWV21 packs were - those
  can't be generated here, only composited once provided.

## Pilot select screen (2026-10-20)
- **Roster**: Patch, Bolt, Glitch, Rumble. Rumble took Havoc's slot (index 3); Havoc and his Pop-up Bomb stay in the code but are benched. Rumble's power is Ground Slam (same stun-nearby code as the Grumpulator slam).
- **Card text describes what the game does**, not the reference mock: Patch Cable clears stun/freeze and gives a speed boost (there is no tether), Ground Slam stuns rivals around you (it does not break platforms).
- **One pilot per player**, host-authoritative: a guest's pick is refused if taken and the host's next snapshot reverts it (700ms grace so a fresh tap does not flicker). New guests are given the first free pilot.
- **Practice** now has the same pilot panel; bots take the remaining pilots in roster order, 1 to 3 bots.
- **Rumble has no in-game sprites yet**: he borrows Havoc's sprites tinted orange (`rumbleStandIn()`). Prompts and drop-in steps are in `docs/RUMBLE_ART_PROMPTS.md`; `process_bswv21.py <raw> art rumble` adds just him.

## Nova and Havoc join the roster (2026-10-20, build 2026-10-20.9)
- **Six pilots, index = wire id**: Patch 0, Bolt 1, Glitch 2, Rumble 3, Nova 4, Havoc 5. The game is still 2-4 players, one pilot each. Havoc is back (he was benched when Rumble took his slot) with his Pop-up Bomb; his old sprites were replaced by the new artwork pack.
- **Nova's Dash Burst** reuses the existing dash (instant dash forward, then a 2 s speed boost, no tag and no damage) with its own streak art, tagged `p.dashKind = 'dashburst'` so Bopster's dash keeps its code-drawn look. The streak only draws on the phone (or host-owned bot) that used it; other phones see the movement, as with every other self-movement power.
- **Pop-up Bomb** was already built (placed hazard, 900 ms fuse, stun in 95 px). Now it draws the window art (two armed frames, warning flash in the last 250 ms) and plays the 3-frame explosion when it goes off, on the host and on guests (a guest plays the blast when a bomb about to go off disappears from the host snapshot).
- **Unlock flash** plays when a catch charges a pilot's power in Character Powers mode.
- **Pilot select**: six cards no longer fit in one row, so the panel is a 3 x 2 grid of compact cards (portrait, name, power) with the selected pilot's power explained under the grid. The whole card is the tap target; SELECTED and TAKEN are corner tags.
- **Art pipeline**: `tools/prep_nova_havoc_sheets.py <nova pack> <havoc pack> <raw dir>` snaps the green screen, despills the fringe, removes Havoc's motion lines, splits his touching plunge/slam frames and writes the two 512px portraits; then `tools/process_bswv21.py <raw dir> art nova havoc`. Nova's jump is launch variant B (thrusters lit in both frames). The strips were drawn at different zoom levels (run about half size, jump/fall 1.3 to 1.4x), so `ROBOT_ZOOM` rescales each animation from the idle scale, as for Rumble; Havoc is shaved to 0.92 like Rumble because he is wide.
- **Effect art**: `tools/process_fx_sheets.py <fx dir>` writes `art/fx/{popbomb,dashburst,unlock}.png` and the manifest `fx` section; `embed_art_v2.py` embeds them in `ART_DATA.fx`. All frames of a sheet share one scale; the dash streak is right-aligned in its cells so its head sits on the pilot; the unlock flash is cut by connected piece rather than by column because the burst spills over its cell.
- **Size**: `index.html` grew from 1.6 MB to 2.0 MB (about 350 KB of sprites, portraits and effects).
- **Tests**: `test/v2_nova_havoc.mjs` added (six cards, Nova and Havoc selectable, practice, Dash Burst, Pop-up Bomb stun and blast art, art loaded); `v2_pilots` now expects six cards and `v2_art` checks six pilots and the effect strips. Set `SHOTS=<dir>` to save screenshots.
