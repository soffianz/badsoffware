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

7. **Dad's house start point:** resolved. Arcadia Apartments, in the south-west of USJ 11 (see section 10).

## 9. Suggested order of work

1. Map pass: pull USJ 11 data, compress, define five zones and five landmarks.
2. Swap the map into the build and keep every existing system working.
3. Hazards and mass loss.
4. Regeneration.
5. Zone flip and landmark cinematic.
6. Darker late-game tone pass (visuals, toasts).
7. Balance and phone testing.

## 10. Map pass findings (step 1)

Data: OpenStreetMap, fetched on 2026-11-11, processed by `tools/usj11_process.py` into `data/usj11/usj11_osm.json` (coordinates in metres from the USJ 11 centroid). Preview: `data/usj11/usj11_preview.png`.

- USJ 11 is about 0.85 km2. With the 100 m buffer the playable area is roughly 1,015 m by 1,395 m.
- 3,051 buildings: 2,956 terrace or semi-detached house footprints, 82 medium, 6 large, 2 massive, 5 tiny. 2,517 are inside USJ 11, 534 in the buffer.
- Roads: a ring road round the edge, a grid of residential streets inside, tertiary and secondary roads on the outside.
- **Arcadia Apartments** (OSM way 222153547, about 27,000 m2, six buildings including three of the largest in USJ 11) sits in the south-west corner, not the centre. Dad's house starts there.
- USJ 11 itself is almost entirely terraced houses. The commercial strip (banks, 99 Speedmart, petrol stations, Taipan shops), Wisma TNB and the MBSJ town hall are all in the buffer on the east and north edges.
- Two large open fields and the school and kindergarten sit in the middle.

Implications:
- The run is a journey from the south-west corner to the north-east, not a spread outward from the centre.
- 2,956 house footprints is too many objects for a phone. Houses get merged into terrace blocks of roughly 4 to 8, targeting a few hundred eatable objects in total.
- Real names stay in the data file only. In-game names are fictional.
- Relation-based (multipolygon) buildings are not yet extracted.

## 11. Map pass decisions (Soff)

| Topic | Decision |
|---|---|
| Zone layout | Journey from the south-west: 1 Arcadia and the southern edge (start), 2 southern terraces, 3 middle fields and schools, 4 northern terraces, 5 north-east edge (shops, Wisma TNB, MBSJ town hall). |
| Finale | Arcadia, full circle. The Arcadia towers are the last landmark eaten. |
| House density | Aggressive merging, about 200 to 300 objects for all terrace housing. |

Defaults I am applying, to be changed if wrong:
- The Arcadia towers are too big for the opening stages (size gating), so the player leaves, grows and comes back for them. That is how "full circle" works without a loop on the map.
- Dad's house is a single unit inside Arcadia. Eating it triggers the collapse start as built.
- Zone 1's own landmark is a smaller building in the Arcadia and southern-edge area, chosen in the next step.
- The town hall, Wisma TNB and the shops in zone 5 are consumable objects, and one of them is zone 5's landmark.

Next step: block the map into the game grid (object clustering, zone polygons, landmark picks) and generate a first game-ready map file.

## 12. Game-ready map (step 2)

Files: `data/usj11/usj11_game.json` (objects, roads, ground, zones, landmarks, start) and `data/usj11/usj11_game_preview.png`. Generated by `tools/usj11_gamemap.py` from `data/usj11/usj11_osm.json`.

- Scale: the 1,395 m long axis is 96 game units (about 0.069 units per metre). Game x is east, game z is minus north. Building heights are exaggerated 3x so they read on the compressed map.
- 362 objects: 270 terrace blocks (one per terrace row, with some back-to-back rows paired) and 92 individual buildings.
- Start: Dad's house is a small unit in Arcadia Apartments. Finale: the three Arcadia towers.
- Zones: 1 Arcadia Corner, 2 Southern Terraces, 3 Fields and Schools, 4 Northern Terraces, 5 North-East Edge. Zone shapes approved by Soff.
- Landmarks: Z1 CEC (south-west), Z2 large terrace block, Z3 school building on the west edge, Z4 Kinderland kindergarten, Z5 Wisma TNB tower. Z4 and Z5 chosen by Soff, the others are defaults. In-game names are still to be reskinned.

Not done yet:
- Wiring the map into the game and replacing the Consumer Central layout.
- Object categories and mass values for each block and building.
- Fictional in-game names and reskinned visuals.
- Hazard placement (electrical, fire, chemical, industrial) on the map.
