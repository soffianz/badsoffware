# Asset QA Report — Draft v1

## Automated checks

- Required file presence: checked.
- Exact required dimensions: checked.
- Transparent PNG mode for character, portrait, drone and effect assets: checked.
- Sprite frame occupancy and adjacent-frame pixel differences: checked.
- Manifest paths: checked.

## Limitations

Automated checks do not validate painted-art quality, faithful likeness to the approved concept art, animation readability, colour accuracy against reference artwork, in-game visual balance, or integration with the existing game. The current artwork is vector-illustrated draft art and must remain `AVAILABLE`, not `COMPLETE`, until human art-direction review. The existing game source and `tools/embed_art.py` were not included in this execution environment, so embedding and browser/game tests were not run.
