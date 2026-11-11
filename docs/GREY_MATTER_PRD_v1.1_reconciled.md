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
| Win condition | City consumed (eat everything). Landmarks are zone-flip milestones. |
| Run length | About 8 to 10 minutes. |
| Consumability | Everything is consumable. |
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
| Capture all five districts as the win | Changed. Win is City consumed. Landmarks are milestones. |
| Native Android, object pooling, modular engine architecture | Replaced by the single-file browser approach. Keep systems separated inside the file where practical. |
| Hybrid OSM, satellite and photo mapping pipeline | Reduced. Use OSM for road and building footprints, then compress to the 96 x 96 tile grid. |
| 100 m buffer, one persistent world, no zone gating | Buffer kept as Outer Edge scenery. No gating, as built. |
| Section 19 "locked, no new features" | Replaced by section 7 below. |
| Name "Badsoftware" | Correct name is **Badsoffware**. |
| Small stage "one short tendril" | Dropped. Keep the build's limb counts (0, 2, 3, 3). |

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

## 8. Resolved questions and what is left

Resolved by Soff:

1. **Win condition:** "City consumed" (eat everything) ends the run. The five landmarks are milestones that flip zones and give score bonuses.
2. **Real places:** everything is consumable, including schools and places of worship. No special-casing.
3. **Run length:** a full run takes about 8 to 10 minutes. The USJ 11 map is compressed to fit.
4. **Stage limbs:** keep the current build (0, 2, 3, 3). The approved-art counts (1, 2, 3, 3) are not used.
5. **Kids:** the two Kids mini agents are a quiet nod to Soff's daughters. Keep the name and the joke, hint at it in the intro comic, nothing explicit.
6. **Mid-run save:** not needed. Pause only.

Still open:

7. **Dad's house start point:** which real USJ 11 location. To be proposed during the map pass and chosen by button.

## 9. Suggested order of work

1. Map pass: pull USJ 11 data, compress, define five zones and five landmarks.
2. Swap the map into the build and keep every existing system working.
3. Hazards and mass loss.
4. Regeneration.
5. Zone flip and landmark cinematic.
6. Darker late-game tone pass (visuals, toasts).
7. Balance and phone testing.
