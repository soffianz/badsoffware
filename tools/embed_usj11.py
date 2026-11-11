#!/usr/bin/env python3
"""Embed the USJ 11 game map into greymatter/index.html.

Usage: embed_usj11.py data/usj11/usj11_game.json greymatter/index.html

Finds a clear square near the Arcadia towers for Dad's house, translates every coordinate so that
square is at (0, 0) (the game's house logic lives at the origin), and writes the data between the
/*USJ-DATA*/ and /*END-USJ-DATA*/ markers as `const USJ = {...};`.
"""
import json
import math
import re
import sys

src, html = sys.argv[1], sys.argv[2]
G = json.load(open(src))
objs = G["objects"]
HOUSE_HALF = 4.9        # 8 x 8 footprint plus the claim margin the game uses
MARGIN = 0.6


def aabb(o):
    th = -o["rot"]
    c, s = abs(math.cos(th)), abs(math.sin(th))
    hw = (o["w"] * c + o["d"] * s) / 2
    hd = (o["w"] * s + o["d"] * c) / 2
    return o["x"] - hw, o["x"] + hw, o["z"] - hd, o["z"] + hd


boxes = [(o, aabb(o)) for o in objs]
towers = [o for o in objs if o.get("role") == "finale_arcadia_tower"]
tx = sum(t["x"] for t in towers) / len(towers)
tz = sum(t["z"] for t in towers) / len(towers)
xs = [p[0] for r in G["roads"] for p in r["pts"]] + [p[0] for p in G["boundary"]]
zs = [p[1] for r in G["roads"] for p in r["pts"]] + [p[1] for p in G["boundary"]]
bx0, bx1, bz0, bz1 = min(xs), max(xs), min(zs), max(zs)

best = None
step = 0.5
x = bx0 + 6
while x < bx1 - 6:
    z = bz0 + 6
    while z < bz1 - 6:
        x0, x1, z0, z1 = x - HOUSE_HALF - MARGIN, x + HOUSE_HALF + MARGIN, z - HOUSE_HALF - MARGIN, z + HOUSE_HALF + MARGIN
        free = True
        for o, (a0, a1, c0, c1) in boxes:
            if o.get("role") == "finale_arcadia_tower" or True:
                if x0 < a1 and x1 > a0 and z0 < c1 and z1 > c0:
                    free = False
                    break
        if free:
            d = math.hypot(x - tx, z - tz)
            if best is None or d < best[0]:
                best = (d, x, z)
        z += step
    x += step

if best is None:
    sys.exit("no free spot for Dad's house")
_, hx, hz = best
print("house spot (map coords)", round(hx, 2), round(hz, 2), "distance to towers", round(best[0], 1))


def T(p):
    return [round(p[0] - hx, 2), round(p[1] - hz, 2)]


ROADCODE = {"secondary": 0, "secondary_link": 1, "tertiary": 2, "tertiary_link": 3, "residential": 4, "unclassified": 4, "service": 5}
GROUNDCODE = {"park": 0, "pitch": 1}

out = {
    "bounds": [round(bx0 - hx - 1.5, 2), round(bx1 - hx + 1.5, 2), round(bz0 - hz - 1.5, 2), round(bz1 - hz + 1.5, 2)],
    "zones": [{"id": z["id"], "name": z["name"], "seed": T(z["seed"])} for z in G["zones"]],
    "landmarks": G["landmarks"],
    "boundary": [T(p) for p in G["boundary"]],
    "objects": [],
    "roads": [],
    "ground": [],
}
for o in objs:
    rec = {"id": o["id"], "k": 0 if o["kind"] == "block" else 1, "x": round(o["x"] - hx, 2), "z": round(o["z"] - hz, 2),
           "w": o["w"], "d": o["d"], "h": o["h"], "r": round(-o["rot"], 3), "zn": o["zone"], "u": o["units"], "a": o["area_m2"]}
    if o["kind"] == "building":
        rec["ty"] = o.get("type")
        rec["s"] = o.get("size")
    if o.get("role"):
        rec["ro"] = o["role"]
    if o.get("arcadia") and not o.get("role"):
        rec["arc"] = 1
    out["objects"].append(rec)
for r in G["roads"]:
    out["roads"].append([ROADCODE.get(r["hw"], 5), r["w"], [v for p in r["pts"] for v in T(p)]])
for g in G["ground"]:
    out["ground"].append([GROUNDCODE.get(g["kind"], 0), [v for p in g["ring"] for v in T(p)]])

# the old dad's-house object (small Arcadia unit) is no longer the start: drop its role so it is an ordinary building
for rec in out["objects"]:
    if rec.get("ro") == "dads_house":
        del rec["ro"]

js = "const USJ = " + json.dumps(out, separators=(",", ":")) + ";"
s = open(html).read()
pat = re.compile(r"/\*USJ-DATA\*/.*?/\*END-USJ-DATA\*/", re.S)
block = "/*USJ-DATA*/" + js + "/*END-USJ-DATA*/"
if pat.search(s):
    s = pat.sub(lambda m: block, s)
else:
    marker = "// ================= GAME (needs three.js) ================="
    assert marker in s, "marker not found"
    s = s.replace(marker, block + "\n" + marker, 1)
open(html, "w").write(s)
print("embedded", len(js), "bytes; bounds", out["bounds"], "objects", len(out["objects"]), "roads", len(out["roads"]))
