#!/usr/bin/env python3
"""Grey Matter map pass, step 2: raw USJ 11 data -> game-ready map.

Usage: usj11_gamemap.py data/usj11/usj11_osm.json OUT_DIR

Produces usj11_game.json (objects, roads, zones, landmarks, start) and usj11_game_preview.png.
Game units: map is scaled so the 1,395 m long axis is 96 units. Game x = east, game z = -north
(north is up the screen). Real names stay in the data. In-game names get reskinned later.
"""
import json
import math
import os
import sys

from shapely.geometry import MultiPoint, Point, Polygon
from shapely.ops import unary_union
from shapely.strtree import STRtree

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
D = json.load(open(src))
M = D["meta"]
minx, miny, maxx, maxy = M["bounds_m"]
SCALE = 96.0 / (maxy - miny)            # game units per metre
TARGET_MAX_BLOCKS = 300
HEIGHT_BOOST = 3.0                      # heights are exaggerated so buildings read on a compressed map

B = D["buildings"]
arcadia_ids = set(M["arcadia"]["buildings_inside"])

# ---------- zones: Voronoi-style by seed, with the east strip and far north forced to zone 5 ----------
SEEDS = {1: (-150, -480), 2: (230, -330), 3: (-120, -30), 4: (0, 380), 5: (480, 560)}
ZONE_NAMES = {1: "Arcadia Corner", 2: "Southern Terraces", 3: "Fields and Schools",
              4: "Northern Terraces", 5: "North-East Edge"}


def zone_of(x, y):
    if x > 500 or y > 620 or (x > 150 and y > 150):
        return 5
    return min(SEEDS, key=lambda z: (x - SEEDS[z][0]) ** 2 + (y - SEEDS[z][1]) ** 2)


def to_game(x, y):
    return round((x - (minx + maxx) / 2) * SCALE, 2), round(-(y - (miny + maxy) / 2) * SCALE, 2)


def height_m(b):
    if b["levels"]:
        try:
            return float(b["levels"]) * 3.2
        except ValueError:
            pass
    return {"tiny": 3, "house": 7, "medium": 9, "large": 18, "massive": 25}[b["size"]]


def obb(poly):
    r = poly.minimum_rotated_rectangle
    pts = list(r.exterior.coords)[:4]
    e1 = (pts[1][0] - pts[0][0], pts[1][1] - pts[0][1])
    e2 = (pts[2][0] - pts[1][0], pts[2][1] - pts[1][1])
    l1, l2 = math.hypot(*e1), math.hypot(*e2)
    if l1 < l2:
        e1, l1, l2 = e2, l2, l1
    ang = math.atan2(e1[1], e1[0])
    c = r.centroid
    return (c.x, c.y), l1, l2, ang


def make_obj(oid, kind, polys, b_list, name=None, extra=None):
    u = unary_union(polys)
    (cx, cy), L, W, ang = obb(u)
    gx, gz = to_game(cx, cy)
    h = max(0.7, max(height_m(b) for b in b_list) * SCALE * HEIGHT_BOOST)
    o = {"id": oid, "kind": kind, "x": gx, "z": gz,
         "w": round(max(L * SCALE, 0.25), 2), "d": round(max(W * SCALE, 0.25), 2),
         "h": round(h, 2), "rot": round(-ang, 3), "zone": zone_of(cx, cy),
         "units": len(b_list), "area_m2": round(u.area)}
    if extra:
        o.update(extra)
    return o


# ---------- cluster the house footprints into terrace blocks ----------
houses = [b for b in B if b["size"] in ("house", "tiny") and b["id"] not in arcadia_ids]
others = [b for b in B if b not in houses]
hpolys = [Polygon(b["ring"]).buffer(0) for b in houses]
TOL = 0.6                               # metres: houses closer than this share a terrace row
tree = STRtree(hpolys)
parent = list(range(len(houses)))


def find(i):
    while parent[i] != i:
        parent[i] = parent[parent[i]]
        i = parent[i]
    return i


for i, p in enumerate(hpolys):
    pb = p.buffer(TOL)
    for j in tree.query(pb):
        if j != i and pb.intersects(hpolys[j]):
            parent[find(i)] = find(j)

rows = {}
for i in range(len(houses)):
    rows.setdefault(find(i), []).append(i)
blocks = list(rows.values())          # one block per terrace row (at most about 17 houses)

# Rows are still more than the object budget, so pair up parallel back-to-back rows (shortest gap first).
info = []
for k, idxs in enumerate(blocks):
    u = unary_union([hpolys[i] for i in idxs])
    c, L, W, ang = obb(u)
    info.append((c, ang % math.pi))
cands = []
for i in range(len(blocks)):
    for j in range(i + 1, len(blocks)):
        dx, dy = info[i][0][0] - info[j][0][0], info[i][0][1] - info[j][0][1]
        dist = math.hypot(dx, dy)
        da = abs(info[i][1] - info[j][1])
        da = min(da, math.pi - da)
        if dist < 40 and da < math.radians(8):
            cands.append((dist, i, j))
cands.sort()
used, merged = set(), []
count = len(blocks)
for dist, i, j in cands:
    if count <= TARGET_MAX_BLOCKS - 30:
        break
    if i in used or j in used:
        continue
    used.update((i, j)); merged.append(blocks[i] + blocks[j]); count -= 1
blocks = [b for k, b in enumerate(blocks) if k not in used] + merged
chunk = 0

objects = []
for k, blk in enumerate(blocks):
    objects.append(make_obj(f"blk{k}", "block", [hpolys[i] for i in blk], [houses[i] for i in blk]))

for b in others:
    p = Polygon(b["ring"]).buffer(0)
    objects.append(make_obj(f"b{b['id']}", "building", [p], [b], extra={
        "size": b["size"], "osm": b["id"], "type": b["type"], "real_name": b["name"],
        "arcadia": b["id"] in arcadia_ids}))
for b in [b for b in B if b["id"] in arcadia_ids]:
    pass  # arcadia buildings are in `others` already (excluded from houses)

# ---------- Dad's house and landmarks ----------
arc = [o for o in objects if o.get("arcadia")]
towers = sorted([o for o in arc if o["size"] in ("large", "massive")], key=lambda o: -o["area_m2"])
small_arc = sorted([o for o in arc if o["size"] not in ("large", "massive")], key=lambda o: o["area_m2"])
dad = small_arc[0] if small_arc else arc[-1]
dad["role"] = "dads_house"
start = {"x": dad["x"], "z": dad["z"], "object": dad["id"]}
for t in towers:
    t["role"] = "finale_arcadia_tower"

LANDMARK_OVERRIDE = {5: "b222514811"}   # chosen by Soff: Wisma TNB tower is zone 5's landmark
landmarks = {}
for z in range(1, 6):
    if z in LANDMARK_OVERRIDE:
        o = next(o for o in objects if o["id"] == LANDMARK_OVERRIDE[z])
        o["role"] = f"landmark_z{z}"
        landmarks[z] = o["id"]
        continue
    cand = [o for o in objects if o["zone"] == z and o["kind"] == "building" and not o.get("arcadia")
            and o.get("type") not in ("place_of_worship",) and o["size"] in ("medium", "large", "massive")
            and "role" not in o and o.get("real_name") not in ("Surau al-Muttaqun",)]
    if z == 5:
        cand = [o for o in cand if o["area_m2"] > 3000] or cand
    if z == 1:
        cand = [o for o in cand if o["area_m2"] >= 400]
    if not cand:
        continue
    pick = max(cand, key=lambda o: o["area_m2"]) if z in (5,) else max(cand, key=lambda o: o["area_m2"])
    pick["role"] = f"landmark_z{z}"
    landmarks[z] = pick["id"]

# ---------- roads and ground ----------
HW_W = {"secondary": 14, "secondary_link": 8, "tertiary": 11, "tertiary_link": 7, "residential": 7,
        "unclassified": 7, "service": 4}
roads = []
for r in D["roads"]:
    if r["hw"] in ("footway", "steps", "path", "pedestrian"):
        continue
    pts = [list(to_game(x, y)) for x, y in r["pts"]]
    roads.append({"hw": r["hw"], "w": round(max(0.35, HW_W.get(r["hw"], 5) * SCALE), 2), "pts": pts})

ground = []
for l in D["leisure"]:
    if l["kind"] in ("park", "pitch") and l["area"] > 3000:
        ground.append({"kind": l["kind"], "name": l.get("name"), "ring": [list(to_game(x, y)) for x, y in l["ring"]]})
boundary = [list(to_game(x, y)) for x, y in M["boundary_ring"]]

game = {
    "meta": {"source": M["source"], "scale_units_per_m": round(SCALE, 5), "units_long_axis": 96,
             "height_boost": HEIGHT_BOOST, "house_chunk": chunk, "origin_note": "x east, z = -north"},
    "zones": [{"id": z, "name": ZONE_NAMES[z], "seed": list(to_game(*SEEDS[z]))} for z in SEEDS],
    "start": start, "landmarks": landmarks,
    "finale": [t["id"] for t in towers],
    "objects": objects, "roads": roads, "ground": ground, "boundary": boundary,
}
json.dump(game, open(os.path.join(out, "usj11_game.json"), "w"), separators=(",", ":"))

from collections import Counter
print("scale units/m", round(SCALE, 4), "house chunk", chunk)
print("objects", len(objects), Counter(o["kind"] for o in objects))
print("blocks per zone", Counter(o["zone"] for o in objects if o["kind"] == "block"))
print("buildings per zone", Counter(o["zone"] for o in objects if o["kind"] == "building"))
print("start", start, "dad", dad.get("area_m2"), "towers", [(t["id"], t["area_m2"]) for t in towers])
for z, i in landmarks.items():
    o = next(o for o in objects if o["id"] == i)
    print("landmark z%d" % z, i, o["size"], o["area_m2"], o.get("real_name"), o.get("type"), (o["x"], o["z"]))

# ---------- preview ----------
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as MP

ZC = {1: "#FF2BD6", 2: "#FF8A1F", 3: "#2fdf5a", 4: "#23E5FF", 5: "#8B5CFF"}
fig, ax = plt.subplots(figsize=(8, 11), dpi=110)
ax.set_facecolor("#05060d"); fig.patch.set_facecolor("#05060d")
for g in ground:
    ax.add_patch(MP(g["ring"], fc="#12301f", ec="none"))
for r in roads:
    xs, ys = zip(*r["pts"])
    ax.plot(xs, ys, color="#2A3045", lw=max(0.4, r["w"] * 6), solid_capstyle="round", zorder=1)
for o in objects:
    w, d, rot = o["w"], o["d"], -o["rot"]
    c, s = math.cos(rot), math.sin(rot)
    pts = [(o["x"] + (px * c - py * s), o["z"] - (px * s + py * c)) for px, py in
           [(-w / 2, -d / 2), (w / 2, -d / 2), (w / 2, d / 2), (-w / 2, d / 2)]]
    ax.add_patch(MP(pts, fc=ZC[o["zone"]], ec="none", alpha=0.55 if o["kind"] == "block" else 0.95, zorder=2))
bx, by = zip(*boundary)
ax.plot(bx, by, color="#FFD21F", lw=1.2, ls="--")
for z, i in landmarks.items():
    o = next(o for o in objects if o["id"] == i)
    ax.plot(o["x"], o["z"], marker="*", ms=15, color="white", zorder=5)
    ax.annotate("L%d" % z, (o["x"], o["z"]), color="white", fontsize=9, xytext=(6, 6), textcoords="offset points")
for t in towers:
    o = next(o for o in objects if o["id"] == t["id"])
    ax.plot(o["x"], o["z"], marker="D", ms=9, color="white", zorder=5)
ax.annotate("START: Dad's house", (start["x"], start["z"]), color="white", fontsize=9, xytext=(10, -14), textcoords="offset points")
ax.plot(start["x"], start["z"], marker="o", ms=9, color="#FFD21F", zorder=6)
for z in SEEDS:
    sx, sz = to_game(*SEEDS[z])
    ax.annotate("%d %s" % (z, ZONE_NAMES[z]), (sx, sz), color=ZC[z], fontsize=10, fontweight="bold", ha="center", alpha=0.95)
ax.set_aspect("equal"); ax.autoscale(); ax.invert_yaxis()
ax.tick_params(colors="#8f99ad", labelsize=7)
ax.set_title("Game map: zones, landmarks (stars), Arcadia finale towers (diamonds)", color="#eaf6ff", fontsize=9)
fig.savefig(os.path.join(out, "usj11_game_preview.png"), facecolor=fig.get_facecolor())
