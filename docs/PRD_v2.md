# Badsoffware PRD v2 (offline reference copy)

**Source of truth**: https://claude.ai/code/artifact/836071af-41a8-44c2-a459-487df8c5efed
("Badsoffware: PRD v2", a live Claude Docs page). This file is a condensed copy for offline
reference and for future sessions that don't have access to that link - if the two disagree,
the live doc wins. Appendices B and C (the art-generation prompt pack and the Patch art
integration walkthrough) aren't reproduced here; see the live doc.

## Summary

Badsoffware is a 2-4 player phone tag game. Robots climb a city tower, portrait screens, on the
same Wi-Fi. The It robot passes It on by touching another robot. Catching a Badsoffware (a rogue
drone) gives a one-shot power-up. Least total time as It wins.

## What changed from v1

| Area | v1 | v2 |
|---|---|---|
| Orientation | Landscape, 844x390 | Portrait, 390x844 |
| Players | Exactly 2 | 2-4, no bots needed online |
| Winning | Most tags | Least total time as It |
| Tower | 3 screens tall | 2 screens tall (1112px), fixed, camera follows each player |
| Round length | 120s fixed | Host picks 1, 2 or 3 minutes |
| Room code | Random | Host chooses it (random pre-filled) |
| Roster | 2 pilots | 4 robots, identical stats: Patch, Bolt, Glitch, Havoc. Rumble and Nova benched |
| Abilities | Each pilot's own weapon | No robot weapons. Caught Badsoffwares give power-ups |
| Controls | Overlaid on the playfield | Solid panel below the playfield |
| Drop-outs | 2-player pause and wait | Round continues; a random robot takes It if needed |
| Theme | Mecha pilots on a computer desktop | Robots in a cyberpunk city, BSWV21 pixel art |

## Users and platform

Primary users: Soff (adult), daughters (10 and 16), friends. Primary device: OPPO Reno 2F,
Android Chrome, portrait. Also: desktop with keyboard, iOS Safari (best effort). Portrait only;
landscape shows "ROTATE YOUR PHONE". Logical canvas 390x844, letterboxed, DPR capped at 2.
Screen split: HUD strip 48px top, playfield 390x556, control panel 240px bottom. Target 55+ fps
on the Reno 2F with 4 robots on screen. Delivery: one `index.html`, no build step.

## Goals / non-goals

Goals: 2-4 players on their own phones, same Wi-Fi, playing a full round within 60s; comfortable
one-handed portrait play; fair for a 10 year old against adults (identical physics, a bot to
practise against, no dead time); zero install/accounts/backend; mechanics proven on greybox before
the art pack lands.

Non-goals (v2): >4 players, spectators, matchmaking, accounts, leaderboards; bots filling empty
online slots; cross-network play (needs TURN); host migration; anti-camping rules (test first);
IAP/ads/analytics/native apps; Rumble and Nova (benched, no art/code needed yet); robot weapons
(every ability now comes from a Badsoffware); pop-up billboard platforms (parked until the art
exists - billboards are now just the frames Badsoffwares spawn from); final art for every asset
(early build ships with BSWV21 + documented stopgaps).

## Core game rules

1. A round lasts 1, 2 or 3 minutes (host's choice, default 2), 3s countdown + "GO!".
2. 2-4 players, slots 0-3, host is slot 0.
3. All robots start on the street: x = 49, 146, 244, 341 for slots 0-3 (spread evenly with fewer
   players).
4. One robot starts It, random at GO.
5. The It robot passes It by touching any other robot (hitboxes 28x40px, within 2px locally or
   24px host-validated with lag compensation).
6. On a tag: tagged robot becomes It, frozen 1s. 1s tag cooldown applies game-wide. Tag-backs are
   allowed once the freeze/cooldown end.
7. Each robot has an It clock, running while It during play (incl. post-tag freeze), stopped during
   countdown/pause. At 0:00 the lowest It clock wins (compared to 0.1s; ties share the win).
8. Playfield wraps horizontally. All robots share physics/hitbox; robot choice is cosmetic only.
9. Any player can pause (pauses everyone); only the host can leave to the lobby for everyone.
10. Drop-outs: round continues. If the dropped robot was It, host picks a random remaining robot,
    no freeze. If only one player is left, the round ends.

## Movement and physics (`CONFIG`)

Run 220px/s (accel 1800, friction 2400, air control 0.7, skid x2.2). Gravity 1800px/s^2, max fall
900px/s. Single jump: initial velocity 645 (~115px). Double jump: one per airtime, velocity 565
(~194px total). Variable jump: early release cuts upward velocity to 45%. Coyote time 80ms, input
buffer 100ms. Drop-through: hold down on a platform for 220ms of falling. Pop-up bounce (parked,
section 9): 380 horizontal/520 vertical, 0.32s lock. Platforms one-way. Hitbox 28x40, anchored at
the feet. No fall damage/stun/freeze from falling. No robot-to-robot collision.

## The tower

Fixed world, 1112px tall (2 screens of 556), 390px wide, does not scroll on its own; each player's
camera follows their own robot. 12 rows, 86px apart. Three zones bottom to top: street (ground,
spawn), mid-rise (most of the height, ledges + drop-through), rooftop (top rows, sparse, longer
gaps). Every layout has at least one open drop shaft top to ground (fall takes ~1.5s). 6 billboard
frames per layout (2 per zone), mounted as background decoration, not standable - Badsoffwares pop
out of them. 5 layouts (Brickwork, Twin Shafts, Spiral, Scatter, Wide and Narrow), fixed seeds, no
runtime randomness - every phone builds the identical tower. Platform skins per zone: block on the
street, ledge/truss/neon mid-rise, ledge on the rooftop. Reachability: every platform reachable
from the ground with rise <= 165px and horizontal gap <= 110px (wrap-aware), verified by simulating
real jumps. Platform widths 60-140px. Camera: vertical only, follows the local robot, anchored to
the last platform stood on, looks slightly ahead, catches up faster when falling; client-side only.
Minimap: thin strip down the right edge, whole tower, a dot per robot in its colour, It's dot
larger and outlined, live Badsoffwares as small white dots. Off-screen arrows as backup (e.g. "1.4
SCREENS UP"). Altitude in the HUD, metres, 10px = 1m (tower ~111m tall).

## Robots

| # | Name | Colour | Look | Status |
|---|---|---|---|---|
| 0 | Patch | #3df5c4 | Teal and white, yellow V crest | Playable |
| 1 | Bolt | #4db8ff | Blue and yellow, horned helmet | Playable |
| 2 | Glitch | #b48cff | Purple with a lilac rim light | Playable |
| 3 | Havoc | #ff4d6a | Crimson and black, spiked crest | Playable |
| 4 | Rumble | #ff8a3d | Orange heavy | Benched, future unlockable |
| 5 | Nova | #e8f4ff | White and cyan | Benched, future unlockable |

Patch: chibi mecha, medic/repair role, mint-teal and white armour, round helmet with dark visor,
two glowing white-cyan eyes, swept-back yellow V crest, teal cross emblem on chest, dark grey
joints, chunky round fists, short sturdy legs.

## Badsoffware power-ups

One spawns every 10s (first at 5s). At most 3 alive at once, at most 1 Hijacker. Host picks a
random billboard frame that's empty and has no robot within 80px; the drone plays its spawn
animation there, then hovers. Uncaught, it glitches out after 20s, freeing its slot. Every catch
is announced in a one-line HUD feed ("GLITCH HIJACKED IT TO PATCH"). Each robot holds one power-up
at a time (new catch replaces it; Hijacker never goes in the slot, it fires on catch). Power button
shows the held icon or "CATCH A BADSOFFWARE"; one tap uses it. Held power-up survives a tag,
clears at round end. Usable during play only (not countdown/pause/post-tag freeze/stunned).
Power-ups never tag - they move you or disrupt others. Ground Slam hits everyone in range
(wrap-aware).

| Badsoffware | Look | Spawn weight | Power-up | Effect |
|---|---|---|---|---|
| Bopster | Pink cat-eared drone | 35% | Dash Burst (held) | 0.17s dash at 760px/s, no gravity, then +25% run speed for 2s |
| Grumpulator | Orange radio drone | 25% | Ground Slam (held) | Stuns every other robot within 120px for 0.9s (still taggable while stunned) |
| Sneakfolder | Yellow folder drone | 30% | Phase Blink (held) | Teleport 110px forward (wrap), leaving a decoy for 1.4s |
| Hijacker | Black/cyan browser window with a claw | 10% | Hijack (instant on catch) | It flips to a random robot other than the current It (can be the catcher); normal freeze+cooldown apply |

## Screens and flow

Title -> How to play (4 cards) -> Mode (Host/Join/Practice) -> Host code (host picks it, keypad
pre-filled random) -> Join (keypad, "ROOM FULL" for a 5th) -> Lobby + robot select (one combined
screen: code, up to 4 slots with robot/ready/ping, 4 robot cards, host sets round length, START
enables at 2+ players all ready) -> Play (HUD + playfield + control panel) -> Pause (Resume/Mute/
Leave, shows who paused) -> Round over (ranked by It clock ascending: time, tags made, Badsoffwares
caught per robot; winner(s) highlighted; host gets Rematch/Lobby, guests see "WAITING FOR HOST") ->
Message screen (host disconnected, room full, code taken, link error, reconnecting).

Host code: typed on the same keypad joiners use, random pre-filled so tapping Host works
immediately. Letters only, no look-alikes (no O/0, I/1/L). Becomes the PeerJS peer ID with a fixed
prefix (e.g. `bsw-ABCD`). "CODE TAKEN, TRY ANOTHER" if the broker reports it's in use. Last code
remembered in local storage.

## Multiplayer architecture

Host = slot 0, guests = slots 1-3 in join order. Each phone simulates its own robot and streams it
(client-authoritative movement). Host owns shared state: phase, timer, round length, layout, It
holder, It clocks, freezes, tag cooldown, billboard frames, Badsoffwares, stun and decoy timers,
robot picks, ready flags, held power-ups and power-up events. Guests mirror shared state and send
requests (robot choice, ready, pause, leave) inside their own state. The host relays each guest's
own state to the other guests, so every phone sees every robot.

Claims: tags validated by the host (distance, lag compensation, cooldown, freeze). It clock counted
on the host only, broadcast with shared state. Badsoffware catches validated by the host by
distance, then either filled into the catcher's slot or the Hijacker's It flip applied, broadcast.
Power-ups: the user's phone applies self-movement at once (Dash Burst, Phase Blink); the host
checks the held power-up/freeze/stun, then broadcasts one event; for Ground Slam, each other phone
checks range against its own accurate position and applies the stun itself. Drop-outs: silent 6s =
"RECONNECTING", can't be tagged; If was It, It passes at once to a random remaining robot; rejoin
within 20s keeps slot/robot/It clock, else removed after 20s; host drop ends the round for
everyone.

Rates: own state 25Hz per robot; host relay batched per tick; shared state 10Hz + immediately on
change; remote robots: snapshot interpolation, 100ms buffer, 150ms extrapolation, snap if >80px
off; lag compensation up to 250ms of history per robot for tag claims; ping every 2s; peer timeout
6s, reconnect window 20s.

## Controls

| Input | Touch | Keyboard |
|---|---|---|
| Move | Left joystick (dead zone 18%, full speed at 75%) | A/D or arrows |
| Jump | Jump button | W, Up or Space |
| Drop through | Pull joystick down | S or Down |
| Power-up | Power button (icon, cooldown ring, charge pips) | E, F, Left/Right Shift |
| Pause/mute | On-screen buttons | P/Escape, M |

## Practice vs bots

1-3 bots, same lobby flow. Bot reacts ~380ms late, runs at 82% speed, re-plans ~130ms. When It,
chases the nearest robot, climbing towards their height. When not It, keeps distance from the It
robot, climbs/drops to escape, goes for nearby Badsoffwares when safe. Uses held power-ups with
simple distance rules. Difficulty in `CONFIG.BOT`, needs play-testing with a 10 year old.

## Visual direction (section 14)

Palette: navy/blue/teal city, magenta on small signs only, robots/Badsoffwares carry bright
colours to always read over the scenery. One locked 31-colour master palette (appendix B). Scenery
from BSWV21: far sky layer, mid buildings layer (tiles vertically), street strip, 4 platform skins,
rooftop props; backgrounds stay darker than platforms, platform tops carry a bright cyan edge.
Robots: BSWV21 sprite strips, 64x64 frames, foot pivot at (32,62), mirrored for left. It marker:
white outline + "IT" tag, drawn in code. Badsoffwares: BSWV21 hover/spawn strips, 48x48, pivot at
centre. Effects drawn in code: speed trail, dust, tag hit, sparks, frozen overlay, catch burst,
Ground Slam ring, Phase Blink puff + decoy shimmer, Hijack swirl + It-flip flash, light screen
shake. UI drawn in code: HUD, minimap, joystick, Jump/Power hexes, power-up icons, arrows, menus.
System fonts only. Audio: v1's synthesised set stays (jump, tag, catch, countdown, warnings,
power-ups, win/lose), starts after first tap, mute remembered. Art hook: sprites load from `art/`
beside `index.html`; gameplay code must not depend on art sizes.

## Acceptance criteria (section 16)

Host + 3 guests join/pick/start in under 60s; a full 3-minute 4-player round plays without
disconnects; 55fps+ on the Reno 2F as host and guest with 4 robots; tags/Badsoffware effects/
power-ups look the same on every phone and It clocks agree to 0.1s at round end; a mid-round
drop-out leaves the round running, someone else becomes It within 1s; a rejoin within 20s keeps
slot/robot/It clock; a taken code shows "CODE TAKEN", a 5th joiner "ROOM FULL"; every platform in
every layout reachable with a clear drop to the ground; a 10 year old understands the portrait
controls unprompted and beats a single bot; Jump and Power are easy to hit with a thumb without
mis-taps.

## Risks (section 17, condensed)

Host phone load simulating/validating/relaying for 3 guests (let a stronger phone host if needed);
no anti-camping yet, watch It clocks in play-tests; with least-time-as-It scoring a weaker It player
can bleed time; 4 robots in 390px may feel cramped, run speed/platform widths need tuning; tag-back
loops (raise cooldown for the same pair if they ping-pong); cross-network play needs TURN (out of
scope); PeerJS broker/CDN unconfirmed from the build sandbox; power-up balance (stun length/radius,
Blink distance, Dash speed, 10s spawn rate, spawn weights, 3-drone cap, Hijacker swing) all need
real play; BSWV21 robots are ~40px tall over the 28x40 hitbox, confirm scale/readability on a real
phone; art stopgaps (Patch idle, Havoc tagged, Grumpulator/Sneakfolder spawn) need swapping as
better art arrives; scoring rule decided 19 Oct: least-time-as-It, points-for-tags was tried and
dropped because only It can tag, so players would run towards It to get tagged; Hijacker's black
body is the weakest silhouette on the navy city, a code-drawn cyan glow is the fallback if
play-tests miss it.

## Build order (section 18)

1. Portrait canvas, screen split, control panel, rotate screen.
2. Physics and BSWV21 robot sprites (greybox fallback) in a 390px wrapped playfield.
3. Two-screen tower, five layouts, reachability/drop-shaft checks, camera, minimap, arrows,
   BSWV21 scenery and platform skins.
4. It rules, It clocks, round timer, round-length choice, round-over ranking.
5. Practice mode with 1-3 bots.
6. Networking for 4: star relay over the tabs transport first, then PeerJS, host code, lobby,
   drop-out and rejoin.
7. Badsoffwares (all four kinds) spawning from billboard frames, the power-up slot, the Power
   button and every power-up effect.
8. Audio, effects, polish.
9. Real-phone play-testing with 4 players and tuning from `CONFIG`.
10. Swap the BSWV21 stopgaps for regenerated art as it arrives, following Appendix A.

This repo's build has done 1-8 in full (see DECISIONS.md's "V2" section for exactly what was
simplified and why); 9 needs a real phone and hasn't happened in this environment; 10 is ongoing -
scenery (Page tileset) is still greybox.
