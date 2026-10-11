// Gridded weather fields for the map: fetches fixed lattice blocks from /api/grid, assembles them
// into a dense grid for one forecast hour, and paints a smooth colour image (Mercator-exact rows)
// that MapLibre drapes over the map as an image source.
import { sample, type Stops } from '@/lib/palette';

const B = 8;
const STEPS = [0.125, 0.25, 0.5, 1, 2, 4, 8];
type Block = { step: number; bx: number; by: number; times: number[]; t: (number | null)[][]; ws: (number | null)[][]; wd: (number | null)[][] };

export type Bounds = { w: number; s: number; e: number; n: number };
export type Field = { step: number; i0: number; j0: number; cols: number; rows: number; times: number[]; blocks: Block[]; missing: number };
export type Grid = { step: number; i0: number; j0: number; cols: number; rows: number; t: Float32Array; u: Float32Array; v: Float32Array };

/** Lattice spacing so the viewport holds ~14 columns. */
export const stepFor = (spanLon: number) => STEPS.find(s => s >= spanLon / 14) ?? 8;

const cache = new Map<string, Promise<Block | null>>();
function block(step: number, bx: number, by: number) {
  const k = `${step}/${bx}/${by}`;
  let p = cache.get(k);
  if (!p) {
    p = fetch(`/api/grid?step=${step}&bx=${bx}&by=${by}`).then(r => (r.ok ? r.json() : null)).then(j => (j?.times?.length ? j : null)).catch(() => null);
    p.then(b => { if (!b) cache.delete(k); }); // retry failures next time
    cache.set(k, p);
    if (cache.size > 400) cache.delete(cache.keys().next().value!);
  }
  return p;
}

export async function loadField(b: Bounds, step: number): Promise<Field | null> {
  const s = Math.max(-84, b.s), n = Math.min(84, b.n);
  const bx0 = Math.floor(b.w / step / B), bx1 = Math.floor(b.e / step / B);
  const by0 = Math.floor(s / step / B), by1 = Math.floor(n / step / B);
  if ((bx1 - bx0 + 1) * (by1 - by0 + 1) > 48) return null;
  const jobs: Promise<Block | null>[] = [];
  for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) jobs.push(block(step, bx, by));
  const blocks = (await Promise.all(jobs)).filter((x): x is Block => !!x);
  if (!blocks.length) return null;
  // the shared timeline: hours every block has (blocks fetched at different moments may be offset by an hour)
  const times = blocks[0].times.filter(t => blocks.every(bl => bl.times.includes(t)));
  return { step, i0: bx0 * B, j0: by0 * B, cols: (bx1 - bx0 + 1) * B, rows: (by1 - by0 + 1) * B, times: times.length ? times : blocks[0].times, blocks, missing: jobs.length - blocks.length };
}

/** Dense arrays for one hour. Rows are south->north (j), columns west->east (i). NaN = no data. */
export function gridAt(f: Field, time: number): Grid {
  const N = f.cols * f.rows;
  const t = new Float32Array(N).fill(NaN), u = new Float32Array(N).fill(NaN), v = new Float32Array(N).fill(NaN);
  for (const bl of f.blocks) {
    let h = bl.times.indexOf(time);
    if (h < 0) { h = bl.times.findIndex(x => x >= time); if (h < 0) h = bl.times.length - 1; }
    for (let r = 0; r < B; r++) for (let c = 0; c < B; c++) {
      const j = bl.by * B + r - f.j0, i = bl.bx * B + c - f.i0, k = r * B + c, o = j * f.cols + i;
      const tv = bl.t[h]?.[k], ws = bl.ws[h]?.[k], wd = bl.wd[h]?.[k];
      if (tv != null) t[o] = tv;
      if (ws != null && wd != null) { const a = (wd * Math.PI) / 180; u[o] = -ws * Math.sin(a); v[o] = -ws * Math.cos(a); }
    }
  }
  return { step: f.step, i0: f.i0, j0: f.j0, cols: f.cols, rows: f.rows, t, u, v };
}

/** Bilinear sample at lon/lat; NaN outside or across gaps. */
export function at(g: Grid, arr: Float32Array, lon: number, lat: number) {
  const x = lon / g.step - g.i0, y = lat / g.step - g.j0;
  const i = Math.floor(x), j = Math.floor(y);
  if (i < 0 || j < 0 || i >= g.cols - 1 || j >= g.rows - 1) return NaN;
  const fx = x - i, fy = y - j, o = j * g.cols + i;
  const a = arr[o], b = arr[o + 1], c = arr[o + g.cols], d = arr[o + g.cols + 1];
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const latOf = (y: number) => (360 / Math.PI) * Math.atan(Math.exp(y)) - 90;

export type Painted = { url: string; coordinates: [[number, number], [number, number], [number, number], [number, number]] };

/** Paint `kind` over the lattice extent. Returns a data URL + corner coordinates for an image source. */
export function paint(g: Grid, kind: 'temp' | 'wind', stops: Stops, canvas: HTMLCanvasElement): Painted {
  const lonW = g.i0 * g.step, lonE = (g.i0 + g.cols - 1) * g.step;
  const latS = g.j0 * g.step, latN = (g.j0 + g.rows - 1) * g.step;
  const W = Math.min(768, (g.cols - 1) * 12), H = Math.min(768, (g.rows - 1) * 12);
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const img = ctx.createImageData(W, H), d = img.data;
  // colour lookup table
  const [lo, hi] = kind === 'temp' ? [-45, 50] : [0, 130];
  const lut = Array.from({ length: 256 }, (_, k) => sample(stops, lo + ((hi - lo) * k) / 255));
  const yN = mercY(latN), yS = mercY(latS);
  for (let y = 0; y < H; y++) {
    const lat = latOf(yN + ((yS - yN) * (y + 0.5)) / H);
    for (let x = 0; x < W; x++) {
      const lon = lonW + ((lonE - lonW) * (x + 0.5)) / W;
      const val = kind === 'temp' ? at(g, g.t, lon, lat) : Math.hypot(at(g, g.u, lon, lat), at(g, g.v, lon, lat));
      const o = (y * W + x) * 4;
      if (!isFinite(val)) { d[o + 3] = 0; continue; }
      const c = lut[Math.max(0, Math.min(255, Math.round(((val - lo) / (hi - lo)) * 255)))];
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { url: canvas.toDataURL('image/png'), coordinates: [[lonW, latN], [lonE, latN], [lonE, latS], [lonW, latS]] };
}

/** Sparse value labels, roughly `px` apart on screen at the current zoom. */
export function labels(g: Grid, zoom: number, fmt: (k: 'temp' | 'wind', v: number) => string, kind: 'temp' | 'wind', px = 84) {
  const pxPerDeg = (512 * 2 ** zoom) / 360;
  const k = Math.max(1, Math.round(px / (g.step * pxPerDeg)));
  const feats: any[] = [];
  for (let j = 0; j < g.rows; j++) for (let i = 0; i < g.cols; i++) {
    if ((g.i0 + i) % k || (g.j0 + j) % k) continue;
    const o = j * g.cols + i;
    const val = kind === 'temp' ? g.t[o] : Math.hypot(g.u[o], g.v[o]);
    if (!isFinite(val)) continue;
    feats.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [(g.i0 + i) * g.step, (g.j0 + j) * g.step] }, properties: { l: fmt(kind, val) } });
  }
  return { type: 'FeatureCollection', features: feats } as const;
}
