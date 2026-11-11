#!/usr/bin/env python3
"""Grey Matter map pass, step 1: turn raw OSM data for USJ 11 into compact game data.

Usage: usj11_process.py RAW_OSM_JSON OUT_DIR

RAW_OSM_JSON comes from:
  https://api.openstreetmap.org/api/0.6/map.json?bbox=101.5745,3.0386,101.5836,3.0513
Boundary is OSM way 884036769 (USJ 11). Playable area is the boundary plus a 100 m buffer.
Output coordinates are metres from the USJ 11 boundary centroid (x east, y north).
"""
import json
import math
import sys
from collections import Counter

from shapely.geometry import LineString, Polygon, Point

BOUNDARY_WAY = 884036769
BUFFER_M = 100
ARCADIA_WAY = 222153547

src, out = sys.argv[1], sys.argv[2]
import os
os.makedirs(out, exist_ok=True)

raw = json.load(open(src))["elements"]
nodes = {e["id"]: e for e in raw if e["type"] == "node"}
ways = {e["id"]: e for e in raw if e["type"] == "way"}

b_ways = ways[BOUNDARY_WAY]
lat0 = sum(nodes[n]["lat"] for n in b_ways["nodes"]) / len(b_ways["nodes"])
lon0 = sum(nodes[n]["lon"] for n in b_ways["nodes"]) / len(b_ways["nodes"])
KX = 111320 * math.cos(math.radians(lat0))
KY = 110574


def proj(n):
    return ((n["lon"] - lon0) * KX, (n["lat"] - lat0) * KY)


def coords(w):
    return [proj(nodes[i]) for i in w["nodes"] if i in nodes]


boundary = Polygon(coords(b_ways))
area = boundary.buffer(BUFFER_M)
minx, miny, maxx, maxy = area.bounds


def r(v):
    return round(v, 1)


def ring(poly):
    return [[r(x), r(y)] for x, y in poly.exterior.coords]


buildings, roads, landuse, leisure, pois = [], [], [], [], []

for w in ways.values():
    t = w.get("tags", {})
    pts = coords(w)
    if len(pts) < 2:
        continue
    closed = w["nodes"][0] == w["nodes"][-1] and len(pts) >= 4

    if "building" in t and closed:
        p = Polygon(pts)
        if not p.is_valid or not p.intersects(area):
            continue
        c = p.centroid
        a = p.area
        buildings.append({
            "id": w["id"], "type": t["building"], "name": t.get("name"),
            "amenity": t.get("amenity"), "levels": t.get("building:levels"),
            "area": round(a), "c": [r(c.x), r(c.y)],
            "in": boundary.contains(c), "ring": ring(p),
        })
    elif "highway" in t:
        ln = LineString(pts)
        if not ln.intersects(area):
            continue
        clip = ln.intersection(area)
        parts = list(clip.geoms) if clip.geom_type == "MultiLineString" else [clip]
        for part in parts:
            if part.geom_type != "LineString" or part.length < 1:
                continue
            roads.append({"id": w["id"], "hw": t["highway"], "name": t.get("name"),
                          "oneway": t.get("oneway") == "yes",
                          "pts": [[r(x), r(y)] for x, y in part.coords]})
    elif closed and ("landuse" in t or "leisure" in t or t.get("amenity") in ("school", "kindergarten", "place_of_worship", "townhall")):
        p = Polygon(pts)
        if not p.is_valid or not p.intersects(area):
            continue
        key = "landuse" if "landuse" in t else "leisure" if "leisure" in t else "amenity"
        rec = {"id": w["id"], "kind": t.get(key), "class": key, "name": t.get("name"),
               "area": round(p.area), "ring": ring(p)}
        (landuse if key == "landuse" else leisure).append(rec)

for n in nodes.values():
    t = n.get("tags", {})
    if t.get("name") and ("amenity" in t or "shop" in t):
        x, y = proj(n)
        if area.contains(Point(x, y)):
            pois.append({"id": n["id"], "name": t["name"], "amenity": t.get("amenity"),
                         "shop": t.get("shop"), "p": [r(x), r(y)]})


def size_class(a):
    return "tiny" if a < 60 else "house" if a < 200 else "medium" if a < 1000 else "large" if a < 4000 else "massive"


for b in buildings:
    b["size"] = size_class(b["area"])

arc = ways[ARCADIA_WAY]
arc_poly = Polygon(coords(arc))
arc_c = arc_poly.centroid
arcadia = {"way": ARCADIA_WAY, "centroid": [r(arc_c.x), r(arc_c.y)],
           "inside_usj11": boundary.contains(arc_c), "landuse_area_m2": round(arc_poly.area),
           "buildings_inside": [b["id"] for b in buildings if arc_poly.contains(Point(*b["c"]))]}

data = {
    "meta": {"source": "OpenStreetMap contributors, ODbL 1.0", "origin_lat_lon": [lat0, lon0],
             "boundary_way": BOUNDARY_WAY, "buffer_m": BUFFER_M,
             "bounds_m": [r(minx), r(miny), r(maxx), r(maxy)],
             "boundary_ring": ring(boundary), "arcadia": arcadia},
    "buildings": buildings, "roads": roads, "landuse": landuse, "leisure": leisure, "pois": pois,
}
json.dump(data, open(os.path.join(out, "usj11_osm.json"), "w"), separators=(",", ":"))

print("bounds_m", data["meta"]["bounds_m"], "boundary area km2", round(boundary.area / 1e6, 3))
print("buildings", len(buildings), Counter(b["size"] for b in buildings))
print("in USJ11:", sum(b["in"] for b in buildings), "in buffer only:", sum(not b["in"] for b in buildings))
print("roads", len(roads), Counter(r_["hw"] for r_ in roads).most_common(8))
print("arcadia", arcadia)

# preview
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as MP

fig, ax = plt.subplots(figsize=(10, 11), dpi=110)
ax.set_facecolor("#05060d"); fig.patch.set_facecolor("#05060d")
for l in leisure:
    ax.add_patch(MP(l["ring"], fc="#12301f", ec="none"))
for b in buildings:
    col = {"tiny": "#4a5068", "house": "#8f99ad", "medium": "#FF8A1F", "large": "#FF2BD6", "massive": "#FFD21F"}[b["size"]]
    ax.add_patch(MP(b["ring"], fc=col, ec="none", alpha=0.9 if b["in"] else 0.45))
w_for = {"secondary": 2.2, "secondary_link": 1.6, "tertiary": 1.8, "tertiary_link": 1.2, "residential": 1.0, "unclassified": 1.0, "service": 0.5}
for rd in roads:
    if rd["hw"] in ("footway", "steps"):
        continue
    xs, ys = zip(*rd["pts"])
    ax.plot(xs, ys, color="#23E5FF", lw=w_for.get(rd["hw"], 0.6), alpha=0.8, solid_capstyle="round")
bx, by = zip(*data["meta"]["boundary_ring"])
ax.plot(bx, by, color="#FFD21F", lw=1.5, ls="--")
ax.plot(*zip(*[[r(x), r(y)] for x, y in area.exterior.coords]), color="#8B5CFF", lw=1, ls=":")
ax.plot(*arcadia["centroid"], marker="*", ms=16, color="white")
ax.annotate("Dad's house (Arcadia)", arcadia["centroid"], color="white", fontsize=9, xytext=(8, 8), textcoords="offset points")
for b in buildings:
    if b["name"] and b["in"]:
        ax.annotate(b["name"], b["c"], color="#eaf6ff", fontsize=6)
ax.set_aspect("equal"); ax.set_xlim(minx - 20, maxx + 20); ax.set_ylim(miny - 20, maxy + 20)
ax.tick_params(colors="#8f99ad", labelsize=7)
ax.set_title("USJ 11 (yellow dashed) + 100 m buffer (purple dotted), metres from centroid", color="#eaf6ff", fontsize=9)
fig.savefig(os.path.join(out, "usj11_preview.png"), facecolor=fig.get_facecolor())
