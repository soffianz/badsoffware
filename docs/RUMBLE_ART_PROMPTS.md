# Rumble: in-game sprite prompts (for ChatGPT image generation)

Rumble is the 4th pilot on the select screen. His 512px portrait is in `art/pilots/rumble_portrait.png`,
but the match needs side-view sprite strips like the other pilots. Until they exist the game borrows
Havoc's sprites tinted orange (`rumbleStandIn()` in `index.html`), so he is already playable.

## How to use these
1. Open a new ChatGPT image chat. Attach `art/pilots/rumble_portrait.png` AND one existing pilot strip
   for style (for example `art/robots/bolt_run.png`, or the Bolt sheet from the BSWV21 pack).
2. Paste the **common brief** once, then one **animation prompt** per message. Ask for one image per message.
3. Save each result as the filename shown, into a folder called `BSWV21_Rumble/`.
4. Run: `python3 tools/process_bswv21.py <folder containing BSWV21_Rumble> art rumble`
   then `python3 tools/embed_art_v2.py`. The real art replaces the tinted stand-in automatically.

If a strip comes back with the wrong frame count or the character drifts between frames, regenerate it
rather than fixing by hand. The slicer finds frames by the gaps between them, so keep a clear green gap.

## Common brief (paste first)
```
I am making a 2D side-scrolling mobile game and need sprite sheet strips for one robot character,
RUMBLE. The attached portrait is the character: a heavy, stocky orange armoured bruiser robot. Orange
plating with black joints and dark gunmetal undersuit, amber glowing visor eyes, a round yellow
ring on the shoulder, chunky oversized fists, a small fist emblem on the chest. Wider and heavier
than the attached reference robot (Bolt), but the same overall height.

Art style: pixel art, crisp hard pixel edges, no anti-aliasing, no blur, limited palette, dark 1px
outline, same chunky cel-shaded look as the reference strip. Do not redesign the character.

Technical rules for EVERY sheet:
- Perfectly flat pure green background, exactly #00FF00, no gradient, no shadow, no floor line, no glow
  spilling onto the background. Nothing green on the character.
- Character in SIDE VIEW, facing RIGHT, full body visible, never cropped.
- Frames are laid out in ONE horizontal row, left to right, equal-sized cells, with at least 20px of
  clear green between neighbouring frames so they never touch.
- The feet sit on the same baseline in every frame; the character is centred in its cell and the
  character is the same size in every frame and every sheet.
- No text, no labels, no frame numbers, no borders, no ground, no effects (no dust, no sparks).
- Output a single wide PNG, the number of frames I ask for, no more and no fewer.
```

## Animation prompts (one per message)

**`rumble_idle_4_frames.png`** (4 frames)
```
Rumble IDLE animation, 4 frames, a calm breathing loop: heavy chest rises slightly, shoulders drop,
fists hang low, visor glow pulses very slightly. Frame 4 flows back into frame 1. Minimal movement.
```

**`rumble_run_8_frames.png`** (8 frames)
```
Rumble RUN cycle, 8 frames, facing right, a seamless loop. Heavy, powerful stride: leaning forward,
fists pumping, each footfall looks weighty. Frames 1 and 5 are the contact poses (opposite legs
forward), frames 3 and 7 the passing poses. Frame 8 flows into frame 1.
```

**`rumble_jump_2_frames.png`** (2 frames)
```
Rumble JUMP, 2 frames: frame 1 is the take-off crouch-and-launch with arms swinging up; frame 2 is
the rising pose, legs tucked slightly, fists up.
```

**`rumble_fall_2_frames.png`** (2 frames)
```
Rumble FALL, 2 frames: frame 1 is just past the peak, arms out for balance; frame 2 is full descent,
arms raised and legs reaching down, bracing to land.
```

**`rumble_land_3_frames.png`** (3 frames)
```
Rumble LAND, 3 frames: frame 1 is impact with a deep heavy crouch, one fist planted; frame 2 is the
lowest squash; frame 3 is rising back toward standing. A heavy ground-pound feel.
```

**`rumble_tagged_4_frames.png`** (4 frames)
```
Rumble TAGGED (hit and stunned), 4 frames: frame 1 is the hit, head snapping back; frames 2 and 3
are a dazed stagger, visor flickering dim, one fist raised to the head; frame 4 is shaking it off.
```

## Optional: extra portrait
`Ground Slam` and the other powers use icons from `assets/weapons/`. Havoc is benched, so no portrait
is needed for him. If Havoc returns as a 5th pilot, he needs a 512px profile portrait in the same
style as the four in `art/pilots/`, saved as `art/pilots/havoc_portrait.png`, and an entry added to
`PILOTS` in `tools/embed_pilots.py`.
