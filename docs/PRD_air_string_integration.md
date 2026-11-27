# PRD: Air String inside Badsoffware (BSW)

Status: draft for Claude Code. Owner: Soff. Date: 2026-11-27.

## 1. Summary

Air String is a webcam hand-tracking instrument that already runs live at
`https://soffianz.github.io/badsoffware/air-string/`. You pinch thumb and index on both hands, a glowing
string appears between them, and you play it in the air. This PRD adds Air String to the Badsoffware
title screen as a fourth menu entry, so one link opens the whole BSW toybox. It does **not** rebuild Air
String inside the game.

## 2. Where things live today (verified)

| Item | Fact |
|---|---|
| Air String source | Branch `ccr-124ae4d4-q3aj9o`: `air-string/index.html` (about 100 KB) plus `air-string/samples/` (13 voice MP3s, about 330 KB, CC BY 3.0, `CREDITS.txt` must ship with them) |
| Air String deploy | `tools/deploy_air_string.sh` on that branch. Copies `air-string/` to `gh-pages`, leaves the game's `index.html` alone |
| Game deploy | `tools/deploy_pages.sh` on the dev branch. Copies only `index.html` to `gh-pages`, so it does not touch `air-string/` |
| Game | One `index.html`, canvas only, portrait 390 x 844 logical, shows ROTATE YOUR PHONE in landscape |
| Title screen | `drawTitle()`: three `menuBtn()` buttons (HOST GAME, JOIN GAME, PRACTICE VS BOTS), 290 x 60, 10 px gap, starting at y = 58.5% of height. A fourth fits (ends about y = 774 of 844) |
| Air String tech | Vanilla JS, MediaPipe Tasks Vision 0.10.14 from jsDelivr, hand model from `storage.googleapis.com`, Web Audio, front camera, full-screen canvas plus DOM panels |
| Air String storage | `localStorage` key `airstring` (instrument, music, theme, mute). BSW uses its own keys. Both sit on the same origin, so keys must stay distinct |
| Orientation | Air String is orientation-free but asks Android to lock **landscape** when you go full screen. BSW is **portrait only** |

Branch problem to fix first: Air String's source is not on the BSW dev branch (`ccr-c0c265f5-bhrx5o`).
The live page only exists because it was deployed from a side branch.

## 3. Goals

1. A fourth button on the BSW title screen opens Air String in one tap.
2. A way back to BSW from Air String in one tap, landing on the title screen in portrait.
3. Air String source lives in the same repo and branch as the game, with one documented deploy path.
4. The game's frame rate, bundle size and offline practice mode are unchanged.
5. Camera permission is asked only after the player chooses to start, never on BSW load.

## 4. Non-goals

- No merging Air String code into `index.html`. No iframe.
- No multiplayer, scoring, tags, bots or networking for Air String.
- No new instruments, gestures, themes or music in this PRD.
- No change to Air String's audio, tracking or rendering behaviour beyond the items in section 6.
- No recording, upload or analytics. The camera feed stays on the device, as the start screen already promises.

## 5. Decision: link out, same origin (recommended)

| Option | Verdict |
|---|---|
| **A. Navigate to `./air-string/`** | **Pick this.** Tiny change, zero risk to game fps, Air String keeps its own fullscreen and camera behaviour, same origin so storage and permissions carry over |
| B. Iframe with `allow="camera"` | Rejected. Fullscreen and orientation lock misbehave inside frames, and a canvas game plus a webcam pipeline in one page is a frame-rate risk on the Reno 2F |
| C. Merge into `index.html` | Rejected. Pulls a CDN ML runtime and DOM UI into a canvas-only single file that is meant to run without a backend |

Use a **relative** URL (`air-string/`), not an absolute one, so it works on GitHub Pages, a local server
and any fork.

## 6. Requirements

### 6.1 Repo and build (do first)

- R1. Bring `air-string/` (HTML, `samples/`, `CREDITS.txt`) onto the dev branch from `ccr-124ae4d4-q3aj9o`
  without losing its history if possible (`git merge` or cherry-pick of the `air-string/` paths).
- R2. Bring `tools/deploy_air_string.sh` over too.
- R3. Make the two deploy scripts safe together. Each must leave the other's files alone on `gh-pages`
  (they already do, since each copies only its own paths). Add a one-line note to `README.md` for both.
- R4. Add a section to `README.md` and `DECISIONS.md`: what Air String is, where it deploys, the CDN
  dependency, the licence note for the voice samples.

### 6.2 Title screen

- R5. Add a fourth `menuBtn` below PRACTICE VS BOTS. Label **AIR STRING**, subtitle **play a string in the air, uses your camera**.
- R6. Add a new icon function (a taut string with two pinch points) in the same style as `iconPeople`,
  `iconArrowIn` and `iconRobotHead`.
- R7. Register `UI.title.airString` and handle the tap in the existing `pointerdown` branch for `S.ph === 'title'`.
- R8. On tap, call `Snd.init()` as other taps do, then `location.href = 'air-string/'`. Do not request
  the camera from BSW.
- R9. Keep the button hit area at least 44 px tall and keep all four buttons clear of the hero art's logo and tagline.
- R10. Do not change the hero art, the other three buttons, or their positions, unless four buttons do not fit.
  If they do not fit, tighten the gap, not the button height.

### 6.3 Air String changes

- R11. Add a **BSW** back button to Air String's `#controls` bar (icon plus the word "BSW", same style as the
  other buttons). It navigates to `../` (the game).
- R12. Before navigating back, if full screen is active, exit it and call `screen.orientation.unlock()` so
  BSW is not stuck in landscape. Stop the camera tracks and close the audio context first so the camera
  light goes off and no sound leaks.
- R13. Add `?from=bsw` support only if needed to show or hide the back button. Default is to always show it, since a standalone visit can still go to the game.
- R14. Use the browser back button as a fallback. Do not trap history.
- R15. Leave the Air String start screen as is, including the line "Everything stays on this device".

### 6.4 Camera and privacy

- R16. The camera prompt appears only after the player taps Start in Air String.
- R17. If permission is denied or no camera exists, Air String already shows a friendly error. Add a second
  button on that error state: **Back to BSW**.
- R18. Add one line to the BSW title button subtitle or a tooltip-free equivalent so nobody is surprised:
  the subtitle already says "uses your camera".

### 6.5 Orientation

- R19. Air String works in portrait and landscape. Do not force either. Only the full-screen button may request landscape, as today.
- R20. After returning to BSW, the existing rotate screen logic must work normally with no stale lock.

## 7. Acceptance criteria

1. On the live site, BSW title shows four buttons, none overlapping the logo or tagline, on a 390 x 844 viewport and on the OPPO Reno 2F.
2. Tap AIR STRING, Air String loads, tap Start, camera prompt appears, pinching two hands makes a string and sound.
3. Tap BSW in Air String: camera light goes off, sound stops, title screen shows in portrait.
4. Repeat 2 and 3 five times with no crash, no doubled audio, no stuck orientation.
5. Deny camera: error shows and Back to BSW works.
6. BSW fps in a practice round is unchanged (existing `test/perf.mjs`), and `index.html` size grows by under 5 KB.
7. Existing tests still pass (`node test/run_all.mjs`). Add one Playwright test that taps the new button and asserts the URL ends in `/air-string/`.
8. Both deploy scripts run in either order and both apps are still live afterwards.
9. `air-string/samples/CREDITS.txt` is present on the live site.
10. Air String's `airstring` storage key does not collide with any BSW key.

## 8. Risks and open questions

| Risk | Notes |
|---|---|
| Phone performance | Hand tracking on the Reno 2F is untested. Test early. If it lags, lower the camera resolution or detection rate in Air String, not in BSW |
| CDN and model hosts | Needs internet for jsDelivr and `storage.googleapis.com`. Offline, Air String will not start. State this plainly on its error screen. BSW practice mode stays offline |
| Portrait feel | Pinching with two hands in portrait is cramped. Landscape feels better. Consider a "tip: turn your phone sideways" line on Air String's start screen |
| iOS Safari | Best effort only. Camera, audio unlock and fullscreen all behave differently |
| Branch drift | Air String lives on a side branch today. R1 fixes this. Without it, a future game deploy cannot rebuild Air String |
| Licence | Voice samples are CC BY 3.0 and need the credit line kept in the help panel and `CREDITS.txt` |
| Name | The page title is "Air String". You wrote "Air Strings". Pick one for the button and docs. This PRD uses **Air String** because that is what ships |

## 9. Suggested build order for Claude Code

1. Read `PRD.md`, `docs/PRD_v2.md`, `DECISIONS.md` and this file.
2. R1 to R4: move Air String and its deploy script onto the dev branch, update docs.
3. R5 to R10: title button, icon, tap handler, one Playwright test.
4. R11 to R15 and R17: back button and denied-camera button in Air String.
5. R12: camera stop, audio close, orientation unlock on exit. Test by hand on a phone.
6. Run `node test/run_all.mjs`, then both deploy scripts, then walk the acceptance list on the live site.
7. Log every judgement call in `DECISIONS.md`.

## 10. Out of scope, parked for later

- A shared hub page that lists BSW, Air String and any future toys.
- Unifying the two visual styles (BSW blueprint-grid cyberpunk, Air String neon gradients).
- Two-player Air String duet over BSW's PeerJS room code.
- Saving or sharing a clip of a performance.
