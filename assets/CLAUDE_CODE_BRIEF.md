# Claude Code Brief — Badsoffware Art Integration

Read this file and `ASSET_MANIFEST.json` before changing the game.

## Art direction
Use the supplied reference boards as visual guidance only. Badsoffware's art style is polished 2D game art with toy-like mecha figures, angular armour, chunky readable silhouettes, crisp cel shading, glossy edge highlights, and a dark navy cyber-desktop world with mint, cyan, blue, pink and warning-yellow accents.

### Patch — P-01 Repair Frame
- Leaner silhouette than Bolt.
- Mint and white armour over dark joints.
- Yellow V-shaped head crest.
- Black visor with one glowing cyan eye slit.
- Hexagonal mint chest reactor with a dark medic cross.
- Mint knee plates, white hands and feet.

### Bolt — P-02 Striker Frame
- Visibly bulkier silhouette than Patch.
- Blue armour, dark joints and yellow accents.
- Twin yellow horns, two yellow eyes.
- Yellow lightning-bolt chest emblem.
- Wide shoulders with yellow hazard stripes, large blue fists and yellow toe caps.

## Required asset integration behaviour
1. Treat `references/*.png` as reference boards, never as character sprites or game backgrounds without explicit approval.
2. If production sprite files are not present, use clearly marked temporary code-drawn placeholders. Do not pretend that a concept board is a valid sprite sheet.
3. Load all production images once at startup and cache them. Do not parse SVGs or allocate image objects in the game loop.
4. Draw sprites with a bottom-centre anchor. Keep collision boxes independent from the visual sprite dimensions.
5. Flip horizontally when a character faces left, unless the final sprite design contains asymmetric details that make mirroring undesirable.
6. Use code for the IT badge, shield, speed trail, ghost opacity, frozen effect, jet flames, pickup particles, tag flash and BOING text.
7. Keep the grid, scanlines, movable windows, platforms, taskbar, HUD and UI panels procedural so they remain crisp and gameplay geometry stays separate from scenery.
8. Do not bake platforms, movable windows, the taskbar or HUD into the final desktop background.
9. If producing the final single-file `index.html`, embed approved image assets as data URIs or inline SVG. Validate that no local asset paths remain in the final build.
10. Update `ASSET_MANIFEST.json` whenever a production asset is added or replaced.

## Production sprite requirements
For each pilot, create a transparent PNG sprite sheet with uniform 192×192 frames and a bottom-centre anchor. Suggested order:
- idle (1 frame)
- run1, run2, run3, run4
- jumpUp, jumpPeak, jumpDown
- land

Keep the whole character inside each frame with consistent proportions and foot baseline. No text, frame labels, background, shadow baked outside the silhouette, or decorative border. Any glow should preferably be drawn in code.

For each rogue app, create transparent 128×128 PNG artwork with the same lighting and outline style. The app designs are: Bopster (pink speaker), Grumpulator (orange calculator), and Sneakfolder (yellow folder). Hover bob, jets and pop effects can be procedural.

## Background requirements
The current `backgrounds/desktop_background_reference.png` is a draft crop from concept art. It is for visual prototyping only. The final background should be 1688×780, dark and low contrast behind gameplay, with no characters, labels, taskbar, HUD, or movable gameplay platforms/windows. Keep the central play area visually uncluttered and reserve contrast for sprites.
