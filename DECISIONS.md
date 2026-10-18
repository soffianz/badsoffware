# Decisions

Judgement calls where the PRD was silent or ambiguous.

- **PeerJS URL**: pinned to `cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js`. 1.5.4 exists on npm (checked), but the build sandbox blocks cdnjs, so the CDN URL itself was NOT verified from here. Check it loads from a normal connection. If it fails, the game still runs and practice works.
- **Third transport**: added a BroadcastChannel transport (`?net=tabs`) so two tabs can test multiplayer offline and in CI. Game code never knows which transport is active.
- **ClaudeRoom API shape**: only `presence(patch)` and `onPeers(fn)` are used. The shape of the peers list is not documented in the PRD, so the code normalises arrays, Maps and objects, and finds "self" by an id it writes into its own presence. Tested only against a mock, not the real runtime. Host = alphabetically first peer label; roles resolve once both players are present.
- **Window timing**: the 3 s warning starts at 1:33, 1:03, 0:33 so the window actually appears/closes at 1:30, 1:00, 0:30. Each event picks a random slot and toggles it.
- **First app spawn** at 4 s after GO (then every 10 s), so the first drone shows up early.
- **Scoring/It**: reading the rules literally, the tagger scores and the tagged pilot becomes It, so the "don't be It" card is worded "DON'T GET TAGGED".
- **Lag compensation**: the host accepts a guest's tag claim if the 24 px check passes against the host's latest position OR any of its own positions in the last ~250 ms (interp buffer + half ping). Without this, ~150 ms latency would reject fair tags.
- **Host-direct detection** uses the positions the host actually sees (interpolated remote), overlap plus 2 px.
- **Jump numbers** tuned by measurement: single jump ~110 px, double jump ~190 px total.
- **Spawns** at x=211 and x=633 (422 px apart both ways, so still over 300 px wrap-aware).
- **Layout reachability** is checked by a script (rise <= 165 px, gap <= 130 px, every platform and slot reachable from the floor); the controls areas (bottom left and right) are kept clear.
- **Popup slots only spawn apps when fully open**; a closing window relocates its apps when the closing warning ends.
- **Guest pilot conflict**: guest auto-picks the opposite of the host on join. If the host later takes the guest's pilot, the guest's READY is disabled and they are told to switch. If the host switches away, the guest's pick becomes valid again.
- **LOBBY / LEAVE in a networked round** sends both pilots to the lobby (a round cannot continue alone). Only the other pilot sees "PILOT LEFT TO LOBBY".
- **Guest reconnect**: a dropped guest auto-retries for 20 s, then shows HOST DISCONNECTED. A silent link (no packets for 6 s) counts as dropped.
- **Intents** (pilot pick, ready, rematch, pause, lobby) travel inside the guest's own state message, because ClaudeRoom has only presence.
- **No render interpolation** between physics steps (target is a 60 Hz phone, steps equal frames).
- **Bot** is deliberately gentle: 380 ms reaction delay, 82% speed. Tunable in `CONFIG.BOT`.
- **Practice button** lives on the connect screen (not inside a networked lobby, where leaving would drop the link).
- **Not verified on real hardware**: the 55+ fps target on the Reno 2F, real PeerJS broker traffic, and real ClaudeRoom. Headless Chromium measured ~2.5 ms/frame render and ~0.03 ms/step.
