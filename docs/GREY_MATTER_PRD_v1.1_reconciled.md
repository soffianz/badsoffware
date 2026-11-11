# Badsoffware: Grey Matter (BSWGM)

Reconciled PRD, v1.1. Supersedes the ChatGPT v1.0 draft.
Baseline: the existing Grey Matter browser build ("as built"). This document amends it. It does not replace it.

## 1. What the game is

A short arcade run. A swarm of grey goo escapes Dad's lab, eats the house, then eats the whole neighbourhood. You are scored on clear time, mass and combo. Replay to beat your run.

Setting: a compressed, reskinned version of the real USJ 11, Subang Jaya. Tone: satire up top (Swarm, Camo Mode, Reckless Token Mode, Kids mini agents), turning darker and properly mechanical as zones flip.

Platform: single-file browser game (three.js, portrait, phone-first, Android Chrome). Same delivery model as the rest of this repo. Not a native app.

## 2. Decisions (locked by Soff)

| Topic | Decision |
|---|---|
| Format | Arcade run, as built. Not a persistent campaign. |
| Strategy layer | One landmark per zone. No full hub or capture simulation. |
| Map | Real USJ 11 layout and buildings, reskinned. Replaces the fictional Consumer Central layout. |
| Hazards | Full PRD version: chain-reaction hazards, mass loss, zero-mass regeneration. |
| Regeneration cost | Return at 10% mass, keep your evolution stage and unlocked powers. Clock keeps running, combo resets. |
| Tone | Satire early, darker late game. |
| Existing features | All kept: score and combo, Camo, Reckless, Kids, fleeing humans and robots, Dad's house collapse start, intro comic. |

## 3. Kept from the ChatGPT PRD

- Touch-to-consume with physical engulfment. Mass gain scales with size, material and category (configurable).
- Four evolution stages with a cinematic transformation, not a plain scale-up. Critical Mass looks like an intensified Large.
- Destruction with consequences: rubble that blocks movement and can be eaten, collision updated, roads and infrastructure damaged.
- Secondary hazards caused by destruction: electrical, fire, chemical, industrial. No human enemies or military.
- Mass loss from hazards. No passive healing. Mass comes back only by eating.
- Unlimited regeneration at a previously consumed, safe location.
- Zone transformation: darker, metallic, tendrils across streets and rooftops, with the original layout still readable.
- Config-driven values (speeds, thresholds, mass values, damage rates, regen fraction).
- Stylised, chunky, readable art. Mobile performance first.

## 4. Cut or changed

| ChatGPT PRD item | Outcome |
|---|---|
| Persistent campaign, cross-session world state | Cut. World state persists within a run only. Optional mid-run resume is a later nice-to-have. |
| Production hubs auto-growing tendril networks, tendril simulation | Replaced. Tendrils are visual, spreading from eaten matter and flipped landmarks. No logic network, no branching and merging simulation. |
| Capture all five districts as the win | Changed. See open question 1. |
| Native Android, object pooling, modular engine architecture | Replaced by the single-file browser approach. Keep systems separated inside the file where practical. |
| Hybrid OSM, satellite and photo mapping pipeline | Reduced. Use OSM for road and building footprints, then compress to the 96 x 96 tile grid. |
| 100 m buffer, one persistent world, no zone gating | Buffer kept as Outer Edge scenery. No gating, as built. |
| Section 19 "locked, no new features" | Replaced by section 7 below. |
| Name "Badsoftware" | Correct name is **Badsoffware**. |
| Small stage "one short tendril" | Reconcile with art: the build's Basic stage currently has no limbs. See open question 4. |

## 5. Changes to the build

1. **Map:** replace the concentric Consumer Central rings (house, taman, shoplots, township, outer edge) with five zones laid out on real USJ 11 geography. Dad's house is placed at a chosen start point, not necessarily the centre.
2. **Zones:** five game zones from verified USJ 11 data. Working names: Residential North, Shoplot Row, Community and Recreation, High-density Condos, Perimeter Roads. Final boundaries come from the map pass.
3. **Landmarks:** one per zone. Eating it flips the whole zone to its infected look and fires a short cinematic.
4. **Hazards:** destruction spawns hazards (snapped cables, fires, spills, machinery). Hazards drain mass and flash red.
5. **Regeneration:** at zero mass, a remnant survives, a regen sequence plays, you return at 10% mass at a previously eaten, hazard-free spot. Stage and powers are kept. Combo resets. The timer keeps running.
6. **HUD:** add hazard warnings and a zone and landmark indicator to the existing stage bar, score and combo.
7. **Config:** hazard intensity, drain rates, regen fraction and landmark values go in `CFG`.

## 6. Core loop (unchanged)

Explore, eat small things, grow, evolve, unlock powers, eat bigger things, trigger collapses and hazards, eat landmarks to flip zones, finish the run.

## 7. Rules for building (replaces section 19 of the old PRD)

1. This document is the spec. Decisions in section 2 are locked.
2. Do not remove anything listed in section 3 or kept in section 2 without asking.
3. Do not add new systems beyond this document without approval.
4. Build in increments and test on a phone-sized viewport after each.
5. Keep gameplay numbers in `CFG`.
6. Use sensible defaults for unspecified details, and note them in `DECISIONS.md`.

## 8. Open questions

1. **Win condition.** Recommended: keep "City consumed" (eat everything) as the finish, with the five landmarks as milestones that flip zones and score bonuses. Alternative: the run ends when all five landmarks are eaten. Needs a decision.
2. **Real places.** USJ 11 has schools, a surau and real homes. Recommended: keep real road layout and building footprints, but use fictional shop and building names and make anything religious or school-related non-destructible or visually generic. Needs a decision.
3. **Run length.** Real USJ 11 is larger than a few-minute run allows. Compression target needs setting after the map pass, so the full run stays short.
4. **Stage limbs.** Match the approved art (1, 2, 3, 3 limbs) or keep the build's current limb counts.
5. **Kids.** Confirm that the two Kids mini agents are meant to be the daughters, and how much that should show in the intro comic.
6. **Dad's house.** Which real USJ 11 location is the start point?
7. **Mid-run save.** Needed, or a run is always played in one go?

## 9. Suggested order of work

1. Map pass: pull USJ 11 data, compress, define five zones and five landmarks.
2. Swap the map into the build and keep every existing system working.
3. Hazards and mass loss.
4. Regeneration.
5. Zone flip and landmark cinematic.
6. Darker late-game tone pass (visuals, toasts).
7. Balance and phone testing.
