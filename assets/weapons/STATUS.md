# Weapon art status (draft 1)

Source: `badsoffware_weapon_effects_production_pack_draft1.zip`, kept untouched in `raw_draft1/`.

## Usable now (AVAILABLE, pending Soff's approval)
- `*_icon.png` x6 (256x256, transparent), `charge_pip.png` (128x128), `weapon_button_frame.png` (256x256).

## Not usable, needs the ORIGINAL generated images
The pack's frame strips were pre-sliced into equal-width cells, which cut frames through the middle or left only fragments.
- `patch_cable_fx`, `zap_pulse_fx`: both came from one mixed composite, frames are wrong and half-cut. Regenerate.
- `shared_extras` unlock flash: right half clipped. Regenerate.
- `phase_blink_fx`, `ground_slam_fx`, `dash_burst_fx`, `popup_bomb_fx`: all frames exist but several have flat cut edges or loose slivers. Best rebuilt from the original un-sliced images.

Nothing here is wired into the game yet. Weapons gameplay is not built.
