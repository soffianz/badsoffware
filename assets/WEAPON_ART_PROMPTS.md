# Badsoffware weapon art: prompt pack (draft v1)

Nothing here is built into the game yet. This is the art brief for the weapons idea. Assumes ONE weapon per pilot. If we go to two each, the weapon blocks below get a second "Mk II" variant.

## How to use this
1. Paste the **Shared style block** at the start of every prompt, then the weapon prompt after it.
2. Ask for a **flat solid magenta background (#FF00FF)** every time. Image tools cannot reliably make transparency, so I will remove the magenta afterwards. Never ask for checkerboards, shadows on the ground, or gradients behind the subject.
3. Generate each effect as **4 separate frames in one image, left to right, evenly spaced**, then ask the tool to keep the same design across frames. If it fumbles the layout, generate one frame at a time and send me all of them.
4. Make 3 to 4 attempts per weapon and send the best. Do not worry about exact pixel sizes: I will crop, scale and align. Square images are best.
5. Name files as listed under each weapon. Drop them in a folder and send them over.

## Shared style block (paste first, every time)
```
Game effect sprite for a 2D side-scrolling tag game called Badsoffware, mecha pilots on a dark computer desktop. Chunky sticker style: thick dark navy outline (#0a0d14), flat cel-shaded colour with one soft highlight and one darker shade, small glossy white rim-light on the top edge. Bold readable silhouette, clean vector look, slightly cartoon and playful, bright saturated neon colours on dark. No text, no letters, no logos, no characters, no ground, no drop shadow, no realistic textures, no blur, no soft airbrush glow. Flat solid magenta (#FF00FF) background. Subject facing right. Same design repeated in each frame.
```

## Pilot palettes (so each weapon matches its owner)
| Pilot | Main | Accent |
|---|---|---|
| Patch | mint #3df5c4 | white, cyan eye #9ffcff |
| Bolt | blue #4db8ff | yellow #ffd23d |
| Glitch | violet #b48cff | hot pink #ff4fa3 |
| Rumble | orange #ff8a3d | yellow #ffd23d |
| Nova | white #e8f4ff | cyan and lime |
| Havoc | crimson #ff4d6a | yellow #ffd23d, graphite |

## The six weapons

### 1. Patch: Patch Cable (grapple)
Gameplay: a short cable shoots out and yanks Patch towards the nearest platform edge.
Files: `patch_cable_fx.png` (4 frames: fire, extend, reach, retract) and `patch_cable_icon.png`.
```
[Shared style block] A mint-green charging cable shot sideways like a grapple. Frame 1: cable just launched, small round plug head at the tip. Frame 2: cable stretched out long and slightly wavy with a few white highlight dashes. Frame 3: cable at full length, plug head clamping onto a small invisible anchor with a tiny white spark burst. Frame 4: cable going slack and curling back. Mint #3df5c4 body, white connector tip, dark navy outline. Four frames in a row, left to right.
```
Icon: `A single round mint cable plug with a short curl of cable, centred, big and simple, chunky outline, icon style.`

### 2. Bolt: Zap Pulse (freeze shock)
Gameplay: short range shock in front of Bolt, freezes the other pilot for about 1 second.
Files: `zap_pulse_fx.png` (4 frames) and `zap_pulse_icon.png`.
```
[Shared style block] A short-range electric shock burst. Frame 1: small yellow spark at the start. Frame 2: a blue ring with sharp zigzag lightning bolts shooting outward to the right. Frame 3: biggest, blue and yellow lightning forks with a bright white centre. Frame 4: fading, a few thin yellow zigzags and tiny sparks. Blue #4db8ff and yellow #ffd23d, white core, dark navy outline on the lightning shapes. Four frames in a row, left to right.
```
Frozen state art for the victim (optional): `Ice-blue chunky outline shell of crackling electricity around a mecha silhouette, hint only, no character.`
Icon: `A bold yellow lightning bolt inside a blue circle, chunky outline.`

### 3. Glitch: Phase Blink (teleport and decoy)
Gameplay: Glitch teleports a short way forward and leaves a flickering decoy behind.
Files: `phase_blink_fx.png` (4 frames) and `phase_blink_icon.png`.
```
[Shared style block] A digital teleport glitch effect. Frame 1: violet pixel squares starting to break apart in a vertical column. Frame 2: column of violet and hot pink pixel blocks and thin horizontal glitch slices, scattered unevenly. Frame 3: pixel blocks racing to the right in a streak, with a few cyan pixel specks. Frame 4: small pink and violet pixel dust fading out. Violet #b48cff and pink #ff4fa3, dark navy outline on the biggest blocks. No character. Four frames in a row, left to right.
```
Decoy hint: `A flat solid translucent-looking violet silhouette ring, only an outline shape of a tall rectangle with rounded shoulders, no face, no details, with pixel glitch notches cut into its edges.`
Icon: `Two overlapping violet and pink pixel squares offset diagonally, chunky outline.`

### 4. Rumble: Ground Slam (shove shockwave)
Gameplay: shockwave on landing that pushes nearby pilots away. Never tags.
Files: `ground_slam_fx.png` (4 frames) and `ground_slam_icon.png`.
```
[Shared style block] A ground shockwave seen from the side, flat on the bottom edge as if on the floor. Frame 1: small orange impact star at the bottom centre. Frame 2: orange and yellow ring of force starting to spread left and right, with chunky grey-brown rock chips flying up. Frame 3: the widest, wide flat orange-yellow shock arc spreading both ways with debris chunks and a few dust puffs. Frame 4: fading, thin orange line and a few falling chips. Orange #ff8a3d and yellow #ffd23d, dark navy outline. Four frames in a row, left to right.
```
Icon: `A big orange fist smashing downward with a yellow shock ring under it, chunky outline.`

### 5. Nova: Dash Burst (air dash)
Gameplay: very short, fast dash forward. Pure speed, no damage.
Files: `dash_burst_fx.png` (4 frames) and `dash_burst_icon.png`.
```
[Shared style block] A speed dash streak that trails behind something moving fast to the right. Frame 1: small cyan burst at the left end. Frame 2: long white streak with three horizontal cyan speed lines and one lime line. Frame 3: longest, bold white and cyan streaks tapering to a point on the left with lime sparkles. Frame 4: streaks shrinking and fading. White #e8f4ff with cyan and lime accents, dark navy outline on the thickest streak. No character. Four frames in a row, left to right.
```
Icon: `Three bold white speed streaks pointing right with a cyan chevron arrow, chunky outline.`

### 6. Havoc: Pop-up Bomb (fake window mine)
Gameplay: drops a fake pop-up window that blows up after about 1.5 seconds, knocking pilots back.
Files: `popup_bomb_fx.png` (6 frames: 2 armed, 1 warning flash, 3 explosion) and `popup_bomb_icon.png`.
```
[Shared style block] A fake computer pop-up window trap. Frame 1: a small crimson window with a title bar and tiny close-button squares, drawn like a 2D app window, with a little round black bomb icon in the middle. Frame 2: same window, slightly bigger bomb, a yellow fuse spark. Frame 3: same window flashing bright yellow-white warning. Frames 4 to 6: the window exploding into crimson and yellow fragments and a cartoon starburst, getting wider, then fading into smoke puffs. Crimson #ff4d6a, yellow #ffd23d, graphite grey, dark navy outline. Six frames in a row, left to right.
```
Icon: `A small round black bomb with a lit yellow fuse inside a crimson pop-up window frame, chunky outline.`

## Shared extras
| File | What |
|---|---|
| `weapon_unlock_fx.png` | 4 frames, a gold star-burst and ring that flashes when a weapon unlocks. Gold #ffd23d, white core. |
| `charge_pip.png` | One small hexagonal charge pip, two states side by side: empty (dark outline only) and full (glowing yellow). |
| `weapon_button_frame.png` | A hex-shaped phone button frame in dark navy with a gold rim, empty in the middle, matching the existing jump button. |

```
[Shared style block] (For weapon_unlock_fx) A gold star-burst celebration flash: Frame 1 small white spark, Frame 2 gold ring with eight short rays, Frame 3 biggest with a white core and pointed rays and a few small stars, Frame 4 fading ring and sparkles. Four frames in a row, left to right.
```

## Checklist of what I need back
- 6 weapon effect strips (Havoc has 6 frames, the rest have 4)
- 6 weapon icons
- 3 shared extras
- Optional: Glitch decoy and Bolt frozen-shell art

## What I will do with the art
Remove the magenta, crop the frames, scale them to the game's size, line them up on the same baseline as the pilot sprites, embed them like the other art, and tell you honestly if anything reads badly on a phone-sized screen. They stay `AVAILABLE` until you approve how they look.
