# Badsoffware: Grey Matter (Consumer Central map rebuild)

Single-file game (`index.html`, three.js + Tone.js from CDN). Serve it, do not open it from disk:

    python3 -m http.server 8123   # then http://localhost:8123/greymatter/

## What changed: the Consumer Central map

The goo now starts inside Dad's house at the exact centre of a 96 x 96 map (1 tile = 1 world unit, house at 48, 48) and eats outward.

| Zone | Radius | Stage it plays in | Contents |
|---|---|---|---|
| Dad's House | 0 to ~8 | Small | Lab clutter, enclosed by walls and a see-through roof |
| The Taman | to ~16 | Small to Medium | Terrace houses, gates, fences, cars, motorbikes, bins, cats, letterboxes, guardhouse, playground, lamps, trees |
| Shoplot Row | to ~28 | Medium to Advanced | Two-storey shoplots, mamak with plastic tables and chairs, convenience stores, petrol station, bus stops, stalls, lorries, signboards, ATMs |
| The Township | to ~40 | Advanced to Critical Mass | Apartment blocks, offices, school, park with pond, surface car park, multi-storey car park, the neon tower |
| The Outer Edge | to the border | Critical Mass | Big Critical-Mass-only buildings; the mall is the largest object on the map |

Zones blend through `zoneF(x, z)` (a continuous 0 to 4 value). Every placement table picks by a tent weight of that value, so a corner shop can sit among the last terraces and a lone apartment block among the shoplots. Roads (`ROADS`) widen with distance from the centre (lanes, two-lane, highway) and are broken on purpose so nothing forms a ring. Object size scales outward; pacing is the existing size gating (`edibleRatio` against goo size), not walls.

No places of worship are generated anywhere.

## Start sequence and collapse

1. Comic ends on panel 12, the existing countdown runs, the goo is at (0, 0) with `CFG.house.zoom` (tight) and the house walls as the boundary.
2. Lab clutter totals 68 mass (`LAB` in the source), 10 to 15% above the first threshold (60). The containment tube sits in the far corner and is not needed.
3. At the first growth threshold `stageUp()` starts `startCollapse()`: shake, cracks, roof drop, walls tip outward, 44 dormant debris objects fly out and become edible, the boundary is removed, the camera pulls back to the stage-1 zoom, then the existing Camo Mode notice shows after the camera has settled. Timings are in `CFG.house`.
4. If the lab is ever cleared without hitting the threshold, the house still comes down (failsafe in `stepCollapse`).

Unchanged: growth stages and thresholds, goo powers, end condition (everything consumed), comic, goo visuals. Mass per type on this map is overridden in `defineTypes()` (`MASS`) so the unchanged 60 / 350 / 900 thresholds land on the zone seams (about 200 house, 200 taman, 500 shoplots, 600 township, 1000 outer).

## Performance notes

- Instanced meshes are split into spatial chunks for common types and frustum-culled per frame (`cullWorld`), so a tight early zoom only draws what is on screen.
- Roughly 200 draw calls and 110k triangles at the heaviest typical view, about 245 calls when the whole centre is on screen at Critical Mass.
- When the existing slow-frame detector trips (`low`), outline passes for small props are dropped too.

## Checks

    npm i three@0.149.0 tone@14.8.49 playwright
    node test/check.mjs

Asserts the lab mass window, mall size and zone, no worship buildings, that every object is reachable by a perfect player as the goo grows (grid flood fill), and runs the real start flow to verify the collapse timeline and notification order.
