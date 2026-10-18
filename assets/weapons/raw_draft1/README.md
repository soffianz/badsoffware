# Badsoffware Weapon Effects Pack (Draft 1)

Eight PNG assets prepared from the generated images in the conversation. Background pixels in the generated near-magenta colour range were keyed to alpha. The outputs use the exact requested filenames.

## Files
- patch_cable_fx.png — 4 frames
- zap_pulse_fx.png — 4 frames
- phase_blink_fx.png — 4 frames
- ground_slam_fx.png — 4 frames
- dash_burst_fx.png — 4 frames
- popup_bomb_fx.png — 6 frames
- weapon_icons.png — 6 icons in 3×2 grid
- shared_extras.png — 3 items in one row
- MANIFEST.json — dimensions, layout and known limitations

## Important QA notes
These are normalised draft sheets, not pixel-perfect final production sheets. Generated source artwork did not have reliably separated frame cells. Frames were split into equal-width regions and fitted into a common canvas; some stage boundaries may cut through or combine neighbouring artwork. The cable and zap assets were extracted from the first generated multi-panel sheet, not from dedicated single-effect images. Review every frame before using it in a game. Regenerate any sheet where an animation stage is incomplete or merged.

The generated backgrounds were near-magenta rather than exact #FF00FF, so a colour-range key was used to create transparent PNGs. Inspect fine outlines for any colour fringing.
