# Badsoffware: visual assets needed

Status key: NEEDED = game works without it but looks placeholder, OPTIONAL = polish, HAVE = already in the game (generated, replaceable).
Rules for every asset: transparent PNG (backgrounds may be WebP/PNG), no text or labels baked in, no checkerboard, no baked shadow or glow outside the silhouette, same style as the concept boards (polished 2D, toy-like mecha, cel shading, dark outline, glossy edge highlights, navy world with mint / cyan / blue / pink / yellow accents). Palette: bg #0a0d14, panel #121a2a, border #2b3a55, trim #e8f4ff, mint #3df5c4, eye #9ffcff, blue #4db8ff, pink #ff4fa3, yellow #ffd23d, orange #ff8a3d.

## 1. Pilots (highest priority)
| File | Size | Status |
|---|---|---|
| characters/patch/patch_sprites.png | 1728x192 (9 frames of 192x192: idle, run1-4, jumpUp, jumpPeak, jumpDown, land) | HAVE (generated from vectors, flat). NEEDED: painted version |
| characters/bolt/bolt_sprites.png | same | HAVE (generated). NEEDED: painted version |
Frame rules: facing right, feet on one baseline (bottom-centre anchor), whole figure inside the frame, consistent scale. Patch lean, Bolt clearly bulkier.
Optional extra frames per pilot (not used yet): idle2, doubleJump, frozen, IT pose, run5-8 for smoother run.
Designs: Patch = mint and white armour, yellow V crest, black visor with one cyan eye slit, hex mint chest reactor with dark medic cross, mint knees, white hands and feet. Bolt = blue armour, twin yellow horns, two yellow eyes, yellow lightning chest emblem, hazard-striped wide shoulders, big blue fists, yellow toe caps, back thrusters.

## 2. Rogue apps (drones)
| File | Size | Status |
|---|---|---|
| drones/bopster.png (pink speaker) | 128x128 | HAVE (generated). NEEDED: painted |
| drones/grumpulator.png (orange calculator) | 128x128 | HAVE (generated). NEEDED: painted |
| drones/sneakfolder.png (yellow folder) | 128x128 | HAVE (generated). NEEDED: painted |
No jet flames in the art (code draws them). Optional: 4-frame hover loops each, and a pop/burst frame.

## 3. Background
| File | Size | Status |
|---|---|---|
| backgrounds/desktop_background.png | 1688x780 | NEEDED. Current one is a dimmed concept crop. Final: dark, very low contrast, uncluttered centre, simple dark reflective lower fifth, props only at far left and right, NO characters, text, taskbar, HUD, windows, floating bars or platform-like shapes |
Optional: purple and green colour variants; separate far/near parallax layers.

## 4. Effects (all currently drawn in code; only if you want art)
Transparent, 256x256 each: jet flame blue, jet flame pink, speed trail, shield bubble (hexagon, mint), frozen FX (ice static), tag hit burst, pickup burst, BOING text (comic burst), sparks.

## 5. UI and branding (all currently drawn in code)
- NEEDED for a proper web launch: favicon / app icon 512x512 (plus 192x192), social share image 1200x630, optional splash 1080x1920.
- Logo BADSOFFWARE: pink BAD / mint SOFF / blue WARE, skewed -8 degrees, as a transparent PNG or SVG (title screen).
- Desktop icon set 40x40 (platform ledges): 8 glyphs (folder, document, gear/disc, chart, plus 4 more) in the dark panel style.
- Window chrome: title bar with 2 square buttons, panel body texture, 12 px title bar in 6 colours (mint, blue, pink, yellow, orange, violet).
- Taskbar strip 844x46 (top border 2 px blue), start/system tray motifs.
- Touch controls: joystick base and knob, hexagon JUMP button (idle and pressed), mute and pause icons.
- How-to-play card illustrations x4 (tag to score, don't get tagged, catch apps, dodge windows) at about 128x128.
- Pilot-select portraits for Patch and Bolt, 256x256, optional.

## 6. Not needed
Audio files (all sound is synthesised), fonts (Google Fonts), level art for platforms (drawn as windows in code), per-layout backgrounds.

## Delivery
Same file names and frame order as above. After delivery: run `python3 tools/embed_art.py` to embed them in index.html (it reads assets/ paths), then `tools/deploy` steps in README. The game also accepts `?patchSheet=` / `?boltSheet=` URLs for quick dev tests, and `?noart=1` to compare against the code-drawn look.
