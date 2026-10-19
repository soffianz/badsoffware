# Badsoffware Visual Asset Pack (Draft v1)

This pack contains draft artwork files generated from the consolidated visual asset brief. It is a working starting point, not a final art-approved release. Assets are marked `AVAILABLE` until visually reviewed and accepted; none are falsely marked `COMPLETE`.

## Structure

- `characters/`: six 1728×192 PNG strips, nine 192×192 frames each.
- `ui/`: six 256×256 transparent pilot portraits.
- `drones/`: three 128×128 transparent drone sprites.
- `backgrounds/`: 1688×780 desktop background.
- `effects/`: optional transparent effects, 256×256.
- `branding/`: app icons, favicon, social-sharing image and SVG logo.
- `ASSET_MANIFEST.json`: dimensions, intended uses, frame metadata and statuses.

## Pilot frame order

`idle`, `run1`, `run2`, `run3`, `run4`, `jumpUp`, `jumpPeak`, `jumpDown`, `land`.

All pilot strips face right. Nominal anchor is bottom-centre; frame baseline is y=180 in the 192×192 cell. Keep gameplay physics and hitboxes identical across all pilots.

## Validation notes

Files have been generated and basic dimensions/alpha channels should be checked before use. The visual design is vector-illustrated and requires art-direction review against the approved concept artwork. In particular, compare the pilot silhouettes, frame motion, portrait likeness, background contrast and social-image typography. `AVAILABLE` does not mean final approved.

## Integration

Copy the `assets/` directory into the existing game project. Once assets are accepted, run `python3 tools/embed_art.py` from the project root and check its output. Use the project's existing supported URL syntax for `?patchSheet=`, `?boltSheet=` and `?noart=1`. This pack does not contain or modify game source code, and no game integration test has been performed here.
