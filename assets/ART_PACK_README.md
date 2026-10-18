# Badsoffware Art Asset Pack (v1 draft)

This package is organised for Claude Code and the Badsoffware PRD. It contains the approved visual direction boards and a cropped desktop-background reference.

## Important status note
The reference boards are **concept art**, not production sprite sheets. Their checkerboard backgrounds are baked into the images, and the multi-panel boards include labels and multiple poses. Do not crop them blindly and treat the crops as transparent, animation-ready sprites. The desktop image is a draft/reference crop from the concept board and contains illustrative scenery; inspect it in-game before using it as a final background.

## Contents
- `references/badsoffware_visual_direction.png` — visual north star for style and palette.
- `references/character_sprite_reference_board.png` — character pose and sprite layout reference.
- `references/asset_pack_reference_board.png` — asset inventory, drones, effects and background reference.
- `backgrounds/desktop_background_reference.png` — 1688×780 draft background crop for visual testing only.
- `ASSET_MANIFEST.json` — intended paths, frame dimensions and status.
- `CLAUDE_CODE_BRIEF.md` — copy/paste implementation instructions.

## Recommended workflow
1. Give Claude Code `CLAUDE_CODE_BRIEF.md`, `ASSET_MANIFEST.json`, and the `references/` boards.
2. Use the background crop only as a temporary visual prototype. The map's platforms/windows/taskbar must still be drawn as game geometry, not baked into the background.
3. Before calling the art complete, create isolated transparent PNGs for each character and drone. Each frame must have consistent canvas dimensions and a bottom-centre anchor. Verify transparency and frame alignment.
4. After the final game is working, embed approved assets into `index.html` if the single-file delivery requirement remains mandatory.

## Suggested initial animation set
For each pilot: idle (1 frame), run (4 frames), jump-up (1), jump-peak (1), jump-down (1), land (1). Use code-driven squash/stretch and effects for frozen, shield, speed boost, ghost and IT states where practical.
