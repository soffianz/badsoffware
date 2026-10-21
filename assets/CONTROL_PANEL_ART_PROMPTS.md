# Badsoffware control panel art: prompt pack (draft v1)

Nothing here is built into the game yet. This is the art brief for the control panel redesign. The panel is currently drawn in code (`drawPanel` in `index.html`); these assets replace the joystick, JUMP button, power button and panel background. The layout stays as it is: joystick bottom left, power button top right, JUMP button bottom right.

## How to use this
1. **Run prompt 0 first** (the style-lock sheet). Pick the best result and keep it open. Regenerate until you love it, because everything else is matched to it.
2. For prompts 1 to 12, **attach the style-lock sheet** to the message and paste the **Shared style block** followed by the asset prompt. This is what stops ChatGPT drifting between generations.
3. Always ask for a **flat solid magenta (#FF00FF) background**. The pipeline removes it afterwards. No checkerboards, no ground shadows, no gradients behind the subject.
4. Do 3 to 4 attempts per asset and keep the best. Exact pixel sizes do not matter: ask for 1024x1024 (or 1536x1024 where noted) and keep the subject centred with about 15% empty margin all round. Resizing is done afterwards.
5. Name files as listed and drop them in one folder.
6. **Do not let it add text.** Labels such as JUMP are drawn in code. If a prompt comes back with letters on it, regenerate.

## Why the pieces are separate
Positions, press states, cooldown rings and per-power tinting all happen in code. Baking the controls into one picture would lock the layout and kill the animation. Each control is therefore its own sprite on its own background.

## Shared style block (paste first, every time)
```
Game UI sprite for a mobile 2D game called Badsoffware: mecha pilots on a dark computer desktop. Mecha cockpit console crossed with retro computer hardware. Chunky sticker style: thick dark navy outline (#0a0d14), flat cel-shaded colour with one soft highlight and one darker shade, small glossy white rim-light on the top edge. Bold readable silhouette, clean vector look, slightly cartoon and playful. Palette: panel #121a2a, border #2b3a55, trim #e8f4ff, mint #3df5c4, eye cyan #9ffcff, blue #4db8ff, pink #ff4fa3, yellow #ffd23d, orange #ff8a3d. Straight-on front view, centred. No text, no letters, no numbers, no logos, no hands, no characters, no ground, no drop shadow, no outer glow, no realistic textures, no blur. Flat solid magenta (#FF00FF) background.
```

## Asset list

| # | File | Final size | Notes |
|---|---|---|---|
| 0 | (reference only) | n/a | Style-lock sheet, not shipped |
| 1 | ui/panel_base.png | 780x480 | Empty console plate, no controls |
| 2 | ui/panel_seam.png | 780x24 | Strip between playfield and panel, tiles horizontally |
| 3 | ui/joy_well.png | 220x220 | Joystick ring and socket |
| 4 | ui/joy_knob.png | 96x96 | Idle |
| 5 | ui/joy_knob_down.png | 96x96 | Pushed, same silhouette |
| 6 | ui/jump_idle.png | 200x176 | |
| 7 | ui/jump_down.png | 200x176 | Pressed |
| 8 | ui/pwr_bezel.png | 176x176 | Empty socket, the "nothing held" state |
| 9 | ui/pwr_cap.png | 144x144 | Neutral cap. Code tints it per power |
| 10 | ui/pwr_cap_down.png | 144x144 | Pressed |
| 11 | ui/icons_sheet.png | 6 icons, 96x96 each | Jump, drop, pause, mute, unmute, exit |
| 12 | ui/fx_press_ring.png | 256x256 | Optional press and cooldown-ready flash |
| 13 | ui/hud_strip.png | 780x96 | Optional. Skins the top HUD strip to match |

Existing `weapons/weapon_button_frame.png` and `weapons/charge_pip.png` stay in use unless they clash with the new look. Say so after step 0 and we regenerate them in the same style.

---

## Prompt 0: style-lock sheet (no reference needed)
```
[Shared style block, but replace the last line about a single centred sprite with:] Lay out these pieces separately with generous space between them on one image, flat solid magenta (#FF00FF) background:
(1) a wide empty console plate, landscape, with riveted edges and subtle vents, nothing mounted on it,
(2) a circular joystick well, a recessed ring socket with faint direction ticks,
(3) a round joystick knob, glossy dome top, mint accent,
(4) a large rounded-rectangle JUMP button, chunky arcade style, blue,
(5) a hexagonal power button sitting in an empty hexagonal socket, yellow rim,
(6) a thin horizontal seam strip with small rivets.
All pieces share one consistent material language, lighting direction (top left) and outline weight. Chunky, friendly, readable at thumb size.
```

## Prompt 1: console base plate (1536x1024, attach style-lock sheet)
```
[Shared style block] Use the attached sheet as the exact style reference. A single wide console panel plate, landscape, filling most of the image. Dark navy metal (#121a2a) with a thin lighter border (#2b3a55), softly rounded corners, small rivets in the four corners, a few shallow vent slots and one thin mint (#3df5c4) accent line along the top edge. The middle of the plate must be calm and EMPTY, with no sockets, buttons, screens or large details, because controls are placed on top later. Decoration only near the edges. Keep the outline weight and lighting identical to the reference.
```

## Prompt 2: top seam strip (1536x1024, attach style-lock sheet)
```
[Shared style block] Use the attached sheet as the exact style reference. A very thin, very wide horizontal strip, about 60 times wider than tall, centred in the image. Dark navy metal with a bright trim line (#e8f4ff) along the top edge and a few small evenly spaced rivets. It must tile seamlessly left to right: identical pattern at both ends, no corner caps, no end details.
```

## Prompt 3: joystick well (attach style-lock sheet)
```
[Shared style block] Use the attached sheet as the exact style reference. A circular joystick well seen straight-on: a deep recessed round socket with a thick raised outer ring in dark navy (#121a2a) with a lighter rim (#2b3a55), eight small direction tick marks around the ring, and a darker empty centre where a knob will sit. The centre must be empty. Perfectly circular, centred, 15% margin.
```

## Prompts 4 and 5: joystick knob (attach style-lock sheet, then knob idle for prompt 5)
```
[Shared style block] Use the attached sheet as the exact style reference. A round joystick knob seen from above, glossy mint (#3df5c4) dome with a white rim-light on the top left, a darker mint underside, a dark navy outline and a small grip ring around the base. Perfect circle silhouette, centred, 15% margin.
```
Prompt 5, same chat, attach the result of prompt 4:
```
Exactly the same knob, same size, same silhouette, same outline, but in a PUSHED state: slightly darker and less saturated, the highlight dimmed and smaller, as if pressed deeper into its socket. Nothing else changes.
```

## Prompts 6 and 7: JUMP button (attach style-lock sheet, then jump idle for prompt 7)
```
[Shared style block] Use the attached sheet as the exact style reference. A large arcade-style rounded-rectangle button seen straight-on, wider than tall (about 8:7). Glossy blue (#4db8ff) top face with a white rim-light, darker blue raised bezel, dark navy outline. Leave the centre of the top face PLAIN: no icon, no text, no arrow. Centred, 15% margin.
```
Prompt 7, same chat, attach the result of prompt 6:
```
Exactly the same button, same size and silhouette, in a PRESSED state: top face a darker blue, highlight dimmed, bezel appears pushed in. No other changes.
```

## Prompt 8: power button bezel, empty (attach style-lock sheet)
```
[Shared style block] Use the attached sheet as the exact style reference. A hexagonal button socket seen straight-on: a raised hexagonal bezel in dark navy with a yellow (#ffd23d) inner rim, and an EMPTY dark recessed hexagon in the middle, with a faint dotted outline inside it. This is the "nothing loaded" state. No icon, no text, no cap. Centred, 15% margin.
```

## Prompts 9 and 10: power cap (attach style-lock sheet and the bezel, then cap ready for prompt 10)
```
[Shared style block] Use the attached sheet as the exact style reference. A hexagonal glass button cap seen straight-on, sized to fit inside the hexagonal socket of the attached bezel. NEUTRAL colour only: pale silver-white translucent glass with a soft white highlight and a light grey shade, thin dark navy outline. No colour tint, no icon, no text, because the game tints it per power. Centred, 15% margin.
```
Prompt 10, same chat, attach the result of prompt 9:
```
Exactly the same cap, same size and silhouette, in a PRESSED state: slightly darker grey, highlight dimmed, looks pushed in. No other changes.
```

## Prompt 11: icon sheet (attach style-lock sheet)
```
Flat UI icon set for a mobile game. Six icons in a 3 by 2 grid, evenly spaced, flat solid magenta (#FF00FF) background. Every icon is PURE WHITE fill with a thin dark navy (#0a0d14) outline and nothing else, so the game can recolour them. Chunky rounded shapes, same stroke weight, same style as the attached sheet. No text, no letters.
Top row: (1) a double upward chevron (jump), (2) a downward arrow with a small flat line under it (drop through the floor), (3) pause: two vertical bars.
Bottom row: (4) a speaker with sound waves (sound on), (5) the same speaker with a diagonal slash (muted), (6) an X inside a circle (exit).
```

## Prompt 12 (optional): press ring and ready flash (attach style-lock sheet)
```
[Shared style block] Use the attached sheet as the exact style reference. Two separate sprites on one image, side by side. Left: a thin circular ring burst in bright white (#e8f4ff) with a soft cyan (#9ffcff) inner edge, expanding-ring look, hollow centre. Right: a hexagonal sparkle flash with four short rays, also white and cyan. Both neutral enough for the game to recolour. Hollow centres, no filled background.
```

## Prompt 13 (optional): HUD strip (1536x1024, attach style-lock sheet)
```
[Shared style block] Use the attached sheet as the exact style reference. A very wide, short HUD strip plate, about 8 times wider than tall, centred in the image. Dark navy metal with a thin lighter border and a mint (#3df5c4) accent line along the BOTTOM edge. The middle is calm and EMPTY: no text, no numbers, no icons, no panels, because the game draws the timer and scores on top. Small rivets at both ends only.
```

---

## After you generate
Send me the files and tell me which attempt of each is the keeper. I'll strip the magenta, crop and scale to the final sizes, embed them (same pipeline as the weapons art) and swap `drawPanel` over to sprites.

**New characters:** the control panel does not depend on them. The neutral power cap is tinted per power, so a new character only needs a colour entry in `CONFIG.ROBOTS`.
