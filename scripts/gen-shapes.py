# Generates the .sh-* mask classes at the end of src/app/globals.css (M3 Expressive-style shapes).
# Each shape is a polar curve r(t) = R(1 + a*cos(n t)); `p` < 1 rounds the valleys.
# Usage: python3 scripts/gen-shapes.py  (prints CSS; paste over the block in globals.css)
import math, urllib.parse

def shape(n, a, pts=144, rot=-90, p=1.0):
    out = []
    for i in range(pts):
        t = 2 * math.pi * i / pts
        w = math.cos(n * t)
        w = math.copysign(abs(w) ** p, w)
        r = 48 * (1 + a * w) / (1 + a)
        x = 50 + r * math.cos(t + math.radians(rot)); y = 50 + r * math.sin(t + math.radians(rot))
        out.append(f"{x:.1f} {y:.1f}")
    return "M" + " L".join(out) + "Z"

SHAPES = {
    'cookie7': shape(7, .09), 'cookie9': shape(9, .075), 'cookie12': shape(12, .055),
    'sunny': shape(8, .12, p=.7), 'clover': shape(4, .22, p=.6), 'flower': shape(6, .16, p=.55), 'burst': shape(16, .06, p=.5),
}
for k, d in SHAPES.items():
    svg = f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='{d}'/></svg>"
    uri = "data:image/svg+xml," + urllib.parse.quote(svg, safe="/:=' ")
    print(f'.sh-{k} {{ -webkit-mask: url("{uri}") center / 100% 100% no-repeat; mask: url("{uri}") center / 100% 100% no-repeat; }}')
