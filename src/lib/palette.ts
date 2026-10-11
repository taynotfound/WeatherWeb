// Shared colour scales for weather values: map fields, legends, forecast range bars.
export type Stops = [number, [number, number, number]][];

export const TEMP_STOPS: Stops = [
  [-30, [108, 63, 160]], [-20, [84, 92, 214]], [-10, [62, 138, 220]], [0, [96, 200, 230]], [8, [104, 214, 170]],
  [15, [178, 224, 112]], [21, [246, 214, 80]], [27, [246, 156, 62]], [33, [230, 84, 60]], [40, [178, 36, 62]], [47, [118, 22, 64]],
];
export const WIND_STOPS: Stops = [
  [0, [60, 94, 170]], [10, [64, 134, 210]], [20, [62, 182, 176]], [35, [128, 206, 104]], [50, [240, 202, 76]],
  [70, [242, 150, 72]], [90, [232, 86, 86]], [120, [164, 72, 210]],
];

export function sample(stops: Stops, v: number): [number, number, number] {
  if (!(v > stops[0][0])) return stops[0][1];
  for (let k = 0; k < stops.length - 1; k++) {
    const [a, ca] = stops[k], [b, cb] = stops[k + 1];
    if (v <= b) {
      const f = (v - a) / (b - a);
      return [ca[0] + (cb[0] - ca[0]) * f, ca[1] + (cb[1] - ca[1]) * f, ca[2] + (cb[2] - ca[2]) * f];
    }
  }
  return stops[stops.length - 1][1];
}

export const rgb = (c: [number, number, number]) => `rgb(${c.map(Math.round).join(',')})`;
export const tempColor = (c: number) => rgb(sample(TEMP_STOPS, c));

/** CSS linear-gradient across [lo, hi] of a scale. */
export function ramp(stops: Stops, lo: number, hi: number, dir = '90deg') {
  const n = 12;
  const parts = Array.from({ length: n + 1 }, (_, i) => {
    const v = lo + ((hi - lo) * i) / n;
    return `${rgb(sample(stops, v))} ${(i / n) * 100}%`;
  });
  return `linear-gradient(${dir}, ${parts.join(', ')})`;
}
