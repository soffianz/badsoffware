# Badsoffware: Product Requirements Document

Version 1.0, as built (art pack v2, weapons v1, tower mode). Written so a team or a coding agent could rebuild the game from scratch and end up with the same game.

## 1. Summary

Badsoffware is a 2-player online tag game that runs in a phone browser as a single `index.html`. Two mecha pilots chase each other round a dark computer desktop for 2 minutes. The pilot who is "It" tries to touch the other. Most tags wins. The desktop is a tower three screens tall, so players can climb to escape and fall to come back down. Catching rogue app drones unlocks each pilot's unique weapon.

It exists so a single dad and his 10 year old daughter can play together on two phones.

## 2. Goals and non-goals

### Goals
1. Two people on two phones, same Wi-Fi, playing a full round within 60 seconds of opening the link.
2. Feels good under a thumb: responsive, forgiving, readable on a small landscape screen.
3. Fair for a 10 year old against an adult: cosmetic stats, a bot to practise against, no frustrating dead time.
4. Zero install, zero accounts, zero backend to run. Hosted as a static file.
5. A single self-contained file that any static host can serve.

### Non-goals (v1)
- More than 2 players, spectators, matchmaking, accounts, leaderboards.
- Playing across different mobile networks (needs a TURN relay).
- In-app purchases, ads, analytics.
- Per-pilot movement or hitbox differences.
- Native apps.

## 3. Users and platform

| Item | Requirement |
|---|---|
| Primary user | Soff (adult) and daughter (10), also a 16 year old sibling |
| Primary device | OPPO Reno 2F, Android Chrome, landscape |
| Also works on | Desktop browsers with keyboard, iOS Safari (best effort) |
| Orientation | Landscape only. Portrait shows a "ROTATE YOUR PHONE" screen |
| Logical canvas | 844 x 390, letterboxed, device pixel ratio capped at 2 |
| Target frame rate | 55+ fps on the Reno 2F (headless Chromium measured about 1.5 ms per frame) |
| Delivery | One `index.html` with all art embedded as data URIs. No build step |

## 4. Core game rules

1. A round lasts **120 seconds**, preceded by a 3 second countdown and a "GO!" banner.
2. One pilot starts as **It** (random). Both start on the ground, at x = 211 and x = 633.
3. The It pilot scores **+1** by touching the other pilot. Touching means the two hitboxes (28 x 40 px each) are within 2 px locally, or within 24 px when the host validates a guest's claim (with lag compensation).
4. On a tag: the tagged pilot becomes It and is **frozen for 1 second**. A **1 second tag cooldown** applies to the whole game, so nobody is tagged twice in a row.
5. Most tags at 0:00 wins. Equal scores are a draw.
6. The player area wraps horizontally: leaving the left edge enters the right edge.
7. All pilots have identical physics and hitboxes. Pilots, stats and weapons are cosmetic or situational, not speed or size differences.
8. Pause: either player can pause, which pauses both. Leaving a round returns both to the lobby.

## 5. Movement and physics

All values live in a single `CONFIG` object so they can be tuned.

| Parameter | Value |
|---|---|
| Run speed | 220 px/s (acceleration 1800, friction 2400, air control 0.7, skid x2.2) |
| Gravity / max fall | 1800 px/s^2 / 900 px/s |
| Single jump | initial velocity 645, about 115 px high |
| Double jump | one allowed per airtime, velocity 565, about 194 px total |
| Variable jump | releasing early cuts upward velocity to 45% |
| Coyote time / input buffer | 80 ms / 100 ms |
| Drop through | hold down (or pull the joystick down) on a window for 220 ms of falling |
| Pop-up bounce | 380 horizontal, 520 vertical, 0.32 s lock |
| Platforms | one-way: you land on top, jump up through them |
| Hitbox | 28 wide, 40 tall, anchored at the feet |
| Falling | no fall damage, no stun, no freeze |

## 6. The tower

- World is **1170 px tall** (3 screens of 390). The ground and taskbar are at the bottom, and the sides wrap.
- **12 rows** of windows, 86 px apart (reachable with a single jump), plus three desktop-icon ledges on the edges and **three pop-up window slots** (rows 2, 5, 8).
- **Five layouts**, picked at random each round: Brickwork, Twin Shafts, Spiral, Scatter, Wide and Narrow. They are generated from fixed seeds with no randomness at runtime, so both phones build the identical tower.
- **Reachability rule**: every platform must be reachable from the floor with a rise of at most 165 px and a horizontal gap of at most 110 px, and verified by simulating real jumps.
- **Camera** follows the local pilot, anchored to the last platform stood on (so hops do not shake the view), looks slightly ahead, and catches up faster when falling. It is client side only and sends nothing over the network.
- **Finding the other pilot**: when they are off screen, an arrow at the top or bottom edge shows their side, whether they are It, and the distance in screens (for example "IT 2.6 SCREENS DOWN").
- **Altitude**: the HUD shows altitude in metres (10 px = 1 m). The world has height ticks every 13 m.

## 7. Pilots

Six pilots, cosmetic only. Patch and Bolt are the defaults. The same pilot cannot be picked by both players.

| # | Pilot | Frame | Colour | Weapon |
|---|---|---|---|---|
| 0 | Patch | Repair | #3df5c4 | Patch Cable |
| 1 | Bolt | Striker | #4db8ff | Zap Pulse |
| 2 | Glitch | Stealth | #b48cff | Phase Blink |
| 3 | Rumble | Heavy | #ff8a3d | Ground Slam |
| 4 | Nova | Scout | #e8f4ff | Dash Burst |
| 5 | Havoc | Assault | #ff4d6a | Pop-up Bomb |

Stat bars on pilot cards (SPD, PWR, AGI) are flavour text only.

## 8. Rogue app drones and weapons

### Drones
- Hovering drones wander round platforms and hop between them. Up to **4** at once, a new one every **8 seconds** (first at 4 seconds).
- They spawn within about one screen of a random pilot so weapons stay reachable, and never right next to a pilot.
- Touching one catches it. The drone is removed and the catcher gains **2 weapon charges** (maximum 3).
- Three drone looks (Bopster, Grumpulator, Sneakfolder) exist but all give the same charges.

### Weapons
- Locked at 0 charges. A weapon button shows "CATCH A DRONE".
- **3 second cooldown** between uses. Charges reset each round and are kept when tagged.
- Usable by both pilots during play (not in countdown, pause or the post-tag freeze, or while stunned).
- **Weapons never tag.** They only move you or push, stun or shove the other pilot.

| Weapon | Effect |
|---|---|
| Patch Cable | Grapple up and across to the nearest window within 230 px sideways and 230 px up, else a hop forward |
| Zap Pulse | Stuns the other pilot for 0.9 s if within 120 px in front and 64 px vertically. Stunned pilots can still be tagged |
| Phase Blink | Teleport 130 px forward, leaving a cosmetic decoy for 1.4 s |
| Ground Slam | Shoves the other pilot away if within 150 px |
| Dash Burst | 0.17 s dash at 760 px/s with no gravity |
| Pop-up Bomb | Drops a fake window. After 1.5 s it blasts the other pilot within 115 px. It never hurts its owner |

Effects on the other pilot are applied by that pilot's own phone (see section 11). Effects are drawn in code. The six weapon icons are art.

## 9. Pop-up windows

Three events per round, at 90, 60 and 30 seconds remaining. A random slot shows "INCOMING WINDOW" with a 3 second countdown, then opens. Anyone overlapping the slot when it opens is bounced away ("BOING"). The window then acts as a platform, and can later warn "WINDOW CLOSING" and fade.

## 10. Screens and flow

1. **Title**: logo, two random pilots standing on the desktop, "DEPLOY".
2. **How to play**: four cards (tag to score, don't get tagged, catch rogue apps, dodge pop-up windows).
3. **Mode**: Host Game, Join Game, Practice vs Bot. Shows which connection type is active and a plain error if the connection library fails to load.
4. **Host**: shows a 4 letter room code (alphabet without look-alike characters) and "WAITING FOR PILOT".
5. **Join**: big on-screen keypad for the 4 letter code, connect status, error text.
6. **Pilot select**: six cards (portrait, name, frame, stat bars, weapon). Your pick and the other player's pick are marked, a taken pick is rejected. "I'M READY" toggles. Both ready starts the round. Shows ping.
7. **Play**: HUD with taskbar (names, scores, charge pips, timer), IT badge, weapon chip, touch controls, pause and mute buttons, altitude, off-screen arrow.
8. **Pause**: Resume, Mute, Leave. Shows "WAITING FOR PILOT" if the other player disconnected, with a 30 second countdown to the lobby.
9. **Round over**: winner title, both pilots' scores, apps caught, longest escape, MVP tag, portraits, Rematch and Lobby.
10. **Message screen**: host disconnected, link error, reconnecting.

## 11. Multiplayer architecture

### Roles
- One phone is the **host** (slot 0), the other the **guest** (slot 1). No server.
- Each phone **simulates its own pilot** and streams it (client-authoritative movement). This keeps controls instant and avoids prediction errors.
- The **host owns the shared game state**: phase, timer, scores, who is It, freezes, windows, drones, pilot picks, ready flags, weapon charges and weapon events.
- The guest mirrors shared state and sends requests (pilot choice, ready, rematch, leave, pause) inside its own state.

### Transport
One interface, three transports. The game only calls the interface.
1. **PeerJS** (primary): WebRTC data channel via a hosted broker, loaded from cdnjs (pinned, v1.5.4), two STUN servers. Needs both phones on the same Wi-Fi in v1.
2. **ClaudeRoom**: works only inside a published claude.ai artifact, for sharing a link without a code.
3. **BroadcastChannel tabs** (`?net=tabs`): two tabs in one browser, for offline testing.

### Rates and tolerances
| Item | Value |
|---|---|
| Own state | 25 Hz (position, velocity, facing, animation, jump and bounce counters, claims, weapon counter) |
| Shared state | 10 Hz, plus immediately on any change |
| Remote pilot | snapshot interpolation with a 100 ms buffer, 150 ms extrapolation, snap if more than 80 px off |
| Lag compensation | up to 250 ms history for validating tag claims |
| Ping | every 2 s, shown in the HUD |
| Peer timeout | 6 s, reconnect window 20 s, host waits 30 s for a dropped guest |

### Authority details
- **Tags**: the It pilot's phone claims a tag. The host validates (distance, lag compensation, cooldown, freeze) and applies it.
- **Drone catches**: the catching phone claims a catch. The host validates distance and applies it. Host catches are detected locally.
- **Weapons**: the user's phone applies self-movement at once. The host confirms the charge and broadcasts one event (counter plus payload: slot, weapon, x, y, facing, aim point). The host rejects a use with no charge, during a freeze, or inside the cooldown window. Effects on the other pilot (stun, shove, bomb blast) are computed and applied by that pilot's own phone, using their own accurate position. Nothing about positions needs correcting afterwards.
- **Pop-up window bounce**: each phone bounces its own pilot when the host reports a window opened.
- **Reconnect**: a guest that rejoins gets the current state and its own counters are re-synchronised.

## 12. Controls

| Input | Touch | Keyboard |
|---|---|---|
| Move | Left joystick (dead zone 18%, full speed at 75%) | A / D or arrows |
| Jump | Big hex button, bottom right | W, Up arrow or Space |
| Drop through window | Pull the joystick down | S or Down arrow |
| Weapon | Hex button above JUMP, with icon, cooldown ring and charge pips | E, F, Left Shift or Right Shift |
| Pause / mute | On-screen buttons | P or Escape / M |

Multi-touch is required (move and jump and weapon at once, tracked by touch identifier). In `?debug=2p` two players share one keyboard (WASD plus E, and arrows plus Right Shift or `/`).

## 13. Practice vs bot

- One human against a bot in the same pilot-select flow.
- The bot reacts about 380 ms late, runs at 82% speed, and re-plans every 130 ms or so.
- It chases when It, climbs and hops towards the human's height, flees and sometimes climbs when the human is It, goes for nearby drones when safe, and uses its weapon with simple distance rules.
- Difficulty is tuned in `CONFIG.BOT` and needs play-testing with a 10 year old.

## 14. Art, audio and effects

- **Pilots**: six sprite sheets, each 1728 x 192, nine frames of 192 x 192: idle, run1 to run4, jumpUp, jumpPeak, jumpDown, land. Right-facing, feet on the bottom centre (baseline y = 180), mirrored in code when facing left. Drawn at 42% scale. Sprites are independent of hitboxes.
- **Pilot portraits**: six 256 x 256 transparent images, used on the round-over screen.
- **Drones**: three 128 x 128 transparent images, drawn at 28%.
- **Weapon icons**: six, used on the weapon button and chip.
- **Background**: a 1688 x 780 dark, low-contrast desktop image with an uncluttered centre. Grid and scanlines drawn in code on top.
- **Code-drawn**: platforms, windows, desktop icons, taskbar, HUD, touch controls, weapon effects, particles, floating text, screen shake, IT badge, frozen look, jet flames.
- **Audio**: all synthesised in the browser (no audio files): jump, double jump, land, tag, frozen, drone catch, window warning, boing, countdown, go, tick, win, lose, draw, UI click, six weapon sounds, bomb blast, unlock, error. Starts after the first tap. Mute is remembered.
- **Typography**: Orbitron (display), Chakra Petch (UI), Share Tech Mono (data), loaded from Google Fonts with fallbacks.
- **Look**: dark navy computer desktop, neon pilot colours, chamfered buttons, hazard-stripe borders on pilot select and round over.
- **Debug**: `?noart=1` code-drawn pilots, `?bg=0` no background, `?<pilot>Sheet=<url>` swap a sprite sheet.

## 15. Technical requirements

- Vanilla JavaScript and Canvas 2D. No framework, no bundler, no runtime dependencies except the connection library (loaded only when needed).
- Fixed timestep of 1/60 s, up to 5 steps per frame.
- Objects pooled (particles 220, floating text 16). No allocation in the game loop except rare events.
- Every tunable in one `CONFIG`. A single `index.html`, about 1 MB with art embedded.
- Embedding tool turns the asset folder into data URIs inside the file (`tools/embed_art.py`).
- Runs without storage, without fonts and without audio: all failures degrade quietly.
- Remembers the last pilot choice and mute state in local storage, with safe fallbacks.
- Test hook `window.__bsw` exposes state for automated tests only.

## 16. Quality bar and acceptance criteria

The game is done when all of the following are true on two real phones:
1. Open link, host, join with a code, pick pilots and start in under 60 seconds.
2. A full 2 minute round plays without disconnects on home Wi-Fi.
3. Frame rate stays at 55 fps or better on the Reno 2F.
4. Tags, drone catches and weapons look the same on both phones and the scores agree at the end.
5. A guest dropping and rejoining resumes the round.
6. Every platform in every layout is reachable, and falling never traps anyone.
7. A 10 year old can understand the controls without being told, and the bot is beatable.
8. The weapon button is easy to hit with a thumb without covering the jump button.

Automated checks (Playwright against a local server): smoke, two-tab network, ClaudeRoom, touch, physics, performance, roster, weapons, tower reachability and real-jump simulation, climb and camera.

## 17. Risks and open questions

| Risk or question | Notes |
|---|---|
| Different networks | Players on different mobile networks need a TURN relay. Out of scope for v1 |
| PeerJS broker or CDN | Never confirmed from the build sandbox. First real test decides |
| Balance | Zap stun length, Phase Blink escapes, charge counts and the 3 second cooldown need real play |
| Stalemates in the tower | Nothing stops a pilot parking at the top. Options: closing top windows, a rising hazard |
| Start positions | Both pilots start on the ground. Starting apart is untested |
| Weapon effect art | Animation strips from the art pack were damaged, so effects are code-drawn for now |
| Bot difficulty | Untested with a 10 year old |
| Hosting | Static host (GitHub Pages). Public repo contains only the built file |

## 18. Suggested build order

1. Single-screen physics, one pilot, platforms, touch and keyboard controls.
2. Tag rules, scoring, timer, HUD, round states, bot.
3. Menus, lobby, pause, round over, rematch.
4. Networking: transport interface, tabs transport first, then PeerJS, host-authoritative state, claims, reconnect.
5. Drones, pop-up windows, particles, audio.
6. Art integration and the six-pilot roster.
7. Weapons and charges.
8. Tower: world height, camera, tall layouts, arrow, altitude, bot climbing.
9. Real-phone play-testing and tuning from `CONFIG`.

## 19. Deliverables

- `index.html` (the game), `README.md`, `DECISIONS.md` (every judgement call), `PRD.md`.
- `assets/` (art and manifests), `tools/` (embed and sprite scripts), `test/` (all automated tests).
- Public repo `badsoffware_Game` containing only the built `index.html` for hosting.
