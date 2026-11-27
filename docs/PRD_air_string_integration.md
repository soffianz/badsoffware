# PRD: Air String inside Badsoffware (BSW)

Status: draft v2 for Claude Code. Owner: Soff. Date: 2026-11-27.

## 1. Summary

Air String is a webcam hand-tracking instrument already live at
`https://soffianz.github.io/badsoffware/air-string/`. Pinch thumb and index on both hands, a glowing string
appears between them, and you play it in the air.

This PRD makes Air String a **game mode you pick inside BSW, after the title screen**, on the existing
battle-settings screen next to BADSOFFWARES and CHARACTER POWERS. It also **cuts Air String down to three
instruments: Synth, Bells and Guitar**. It does not rebuild Air String inside the game.

## 2. Where things live today (verified)

| Item | Fact |
|---|---|
| Air String source | Branch `ccr-124ae4d4-q3aj9o`: `air-string/index.html` (about 100 KB) plus `air-string/samples/` (13 voice MP3s, used only by the Voice instrument) |
| Air String deploy | `tools/deploy_air_string.sh` on that branch. Copies `air-string/` to `gh-pages`, leaves the game's `index.html` alone |
| Game deploy | `tools/deploy_pages.sh` on the dev branch. Copies only `index.html`, so it does not touch `air-string/` |
| Game | One `index.html`, canvas only, portrait 390 x 844 logical, ROTATE YOUR PHONE in landscape |
| Menu flow | Title (HOST, JOIN, PRACTICE VS BOTS) then, for practice, the **battle-settings screen** (`S.ph = 'battleSettings'`): bot count, match length, game mode via `segRow()` tiles, then START. Host lobby has its own mode toggle |
| Air String tech | Vanilla JS, MediaPipe Tasks Vision 0.10.14 from jsDelivr, hand model from `storage.googleapis.com`, Web Audio, front camera, full-screen canvas plus DOM panels |
| Instruments today | Synth, Violin, Harp, Guitar, Bells, Voice. Guitar and Bells are synthesised in code. Only Voice uses the MP3s |
| Storage | `localStorage` key `airstring` (saved instrument is an **index** into the list). BSW uses its own keys |
| Orientation | Air String asks Android for **landscape** in full screen. BSW is **portrait only** |

Branch problem to fix first: Air String's source is not on the BSW dev branch (`ccr-c0c265f5-bhrx5o`).

## 3. Goals

1. Player taps through title, into battle settings, picks **AIR STRING** as the mode, taps START, and Air String opens.
2. One tap back to the BSW title screen, in portrait.
3. Air String is simpler: three instruments, no voice samples, no licence baggage.
4. Air String source lives on the same branch as the game with one documented deploy path.
5. BSW frame rate, size and offline practice mode are unchanged.
6. Camera permission is asked only after the player taps Start inside Air String.

## 4. Non-goals

- No merging Air String code into `index.html`. No iframe.
- No Air String over the network, no scoring, tags or bots.
- No new instruments, gestures or themes.
- No change to the backing music (Orchestra, EDM, Off), the six visual themes, five-string mode or duet. Only the instruments are cut.
- No recording, upload or analytics. The camera feed stays on the device.

## 5. Decision: pick it as a mode, launch by navigation

- Air String is chosen from the **game-mode row** on the battle-settings screen. The title screen gets no new button.
- On START with AIR STRING selected, BSW navigates to the relative URL `air-string/`. Relative so it works on GitHub Pages, a local server and forks.
- Rejected: iframe (fullscreen, orientation and fps problems) and merging into `index.html` (drags an ML runtime and DOM UI into a canvas-only single file).

Assumption to confirm: "a setting chosen from inside the game, after the main screen" means the battle-settings
mode row. If you meant a separate new screen or a gear icon, only section 6.2 changes.

## 6. Requirements

### 6.1 Repo and build (do first)

- R1. Bring `air-string/` and `tools/deploy_air_string.sh` onto the dev branch from `ccr-124ae4d4-q3aj9o`, keeping history if practical.
- R2. Make sure the two deploy scripts leave each other's files alone on `gh-pages`. Note both in `README.md`.
- R3. Add Air String notes to `README.md` and `DECISIONS.md`: what it is, where it deploys, the CDN dependency.

### 6.2 BSW: new game mode

- R4. Extend the game-mode `segRow()` on the battle-settings screen from two tiles to three: **BADSOFFWARES, CHARACTER POWERS, AIR STRING**. Check the labels fit at the current font size; shorten or drop to a smaller font before touching tile height.
- R5. With AIR STRING selected, grey out and ignore the **bot count** and **match length** rows (they do not apply). Change the START button label to **OPEN AIR STRING**. Add a one-line hint under the row: "Uses your camera. Play a string in the air."
- R6. Selecting AIR STRING must **not** change `S.battleCfg.mode` values the game logic reads (`'drones' | 'powers'`). Store the choice separately (for example `S.battleCfg.airString = true`) or add a distinct launch path, so no match code ever sees an unknown mode.
- R7. START in this state calls `Snd.init()` like other taps, then `location.href = 'air-string/'`. BSW never requests the camera.
- R8. Remember the last chosen mode tile in BSW's existing storage, with the same safe fallbacks.
- R9. **Host lobby: no change.** Air String is solo. The lobby's `NET.gameMode` toggle stays `drones | powers`, so nothing is replicated over the network.
- R10. Leave the title screen, hero art and the three title buttons exactly as they are.
- R11. Hit areas stay at least 44 px tall.

### 6.3 Air String: cut to three instruments

- R12. In `INSTRUMENTS`, keep **Synth, Bells, Guitar** only, in that order. Delete **Violin, Harp, Voice**.
- R13. Remove everything only the cut instruments use: the vocal and Voice code path, sample loading and decoding, the bowed and harp synthesis paths if nothing else calls them, and the `mode:"vocal"` handling.
- R14. Delete `air-string/samples/` (13 MP3s and `CREDITS.txt`) and the deploy script's `samples` copy lines. Delete the CC BY 3.0 credit line from the help panel. Confirm nothing else in the page references the files before deleting.
- R15. Fix the help text: the Instrument line lists Synth, Bells and Guitar only, and the Voice mention goes. Check the "wiggle a hand for vibrato (or a re-pluck on Harp, Guitar and Bells)" line and reword for Guitar and Bells.
- R16. **Saved state migration:** the saved instrument is an index, so old saves can point at the wrong sound. Save and read it by `id` (`synth`, `bells`, `guitar`), and map any unknown or old value to `synth`. Make the old numeric saves fall back safely.
- R17. The instrument panel shows three big buttons. Check it still lays out cleanly on a 390 px wide phone.
- R18. Orchestra and EDM backing must still work with the instrument change. Check that neither reuses the deleted violin or harp voices. If one does, keep the shared code and remove only the instrument entry.

### 6.4 Air String: way back to BSW

- R19. Add a **BSW** button to the `#controls` bar (same style as the others). It goes to `../`.
- R20. Before leaving: stop the camera tracks, close the audio context, exit full screen if active and call `screen.orientation.unlock()`, so BSW is not stuck in landscape and the camera light goes off.
- R21. On the camera-denied or no-camera error, show a second button: **Back to BSW**.
- R22. Do not trap browser history. The browser back button must also work.
- R23. Keep the start-screen line "Everything stays on this device".

### 6.5 Camera and orientation

- R24. Camera prompt appears only after Start in Air String.
- R25. Air String works in portrait and landscape. Only its full-screen button may request landscape, as today.
- R26. After returning to BSW the existing rotate-screen logic must behave normally with no stale lock.

## 7. Acceptance criteria

1. Title, then PRACTICE VS BOTS, then the mode row shows three tiles including AIR STRING.
2. Selecting AIR STRING greys out bots and length, and START reads OPEN AIR STRING. Selecting another tile restores them.
3. OPEN AIR STRING loads Air String. Tap Start, allow the camera, pinch two hands: a string and sound appear.
4. The instrument panel shows exactly Synth, Bells, Guitar. Each plays and sounds right, including Orchestra and EDM backing on each.
5. An old save with instrument index 4 or 5 (or any junk) loads as Synth with no error.
6. No requests to `samples/` appear in the network log. The `samples/` folder is gone from the live site and the repo.
7. BSW button: camera light off, sound off, title screen in portrait. Repeat five times with no doubled audio and no stuck orientation.
8. Deny the camera: error shows and Back to BSW works.
9. Normal BADSOFFWARES and CHARACTER POWERS matches, and the host lobby, behave exactly as before. Existing tests pass (`node test/run_all.mjs`), `test/perf.mjs` shows no fps change, and `index.html` grows by under 5 KB.
10. Add one Playwright test: pick AIR STRING, START, assert the URL ends in `/air-string/`.
11. Both deploy scripts run in either order and both apps stay live.
12. Air String's `airstring` key does not collide with any BSW key.

## 8. Risks and open questions

| Risk | Notes |
|---|---|
| Menu placement | Assumed the battle-settings mode row. Confirm before building |
| Slightly odd fit | Air String is not a match, so it borrows a "mode" tile for launching. Acceptable for now, and the hint line explains it |
| Phone performance | Hand tracking on the Reno 2F is untested. Test early. If it lags, lower detection rate or camera size inside Air String |
| CDN and model hosts | Needs internet for jsDelivr and `storage.googleapis.com`. Offline, Air String will not start. Say so on its error screen. BSW practice stays offline |
| Portrait feel | Two-hand pinching is cramped in portrait. Optional tip on the Air String start screen: turn your phone sideways |
| iOS Safari | Best effort only |
| Dead code | Removing three instruments can leave helpers nobody calls. Remove only what a search proves is unused |
| Name | Page title is "Air String", you wrote "Air Strings". This PRD uses the singular because that is what ships |

## 9. Suggested build order for Claude Code

1. Read `PRD.md`, `docs/PRD_v2.md`, `DECISIONS.md` and this file.
2. R1 to R3: move Air String and its deploy script onto the dev branch.
3. R12 to R18: cut the instruments, delete the samples, migrate saved state. Test each remaining instrument with each backing option.
4. R19 to R23: back button, denied-camera button, cleanup on exit.
5. R4 to R11: third mode tile, greyed rows, launch path, Playwright test.
6. Test on a real phone, then run `node test/run_all.mjs`, both deploy scripts, and walk the acceptance list on the live site.
7. Log every judgement call in `DECISIONS.md`.

## 10. Parked for later

- A shared hub page for BSW, Air String and future toys.
- Matching Air String's neon look to BSW's blueprint-grid style.
- Two-player Air String duet over BSW's PeerJS room code.
- Saving or sharing a clip of a performance.
