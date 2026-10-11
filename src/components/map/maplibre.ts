// Lazy MapLibre loader. Sets the worker URL (see scripts/copy-maplibre.mjs) and registers
// `cloudir://`, which turns grey infrared satellite tiles into white, alpha-blended clouds so the
// live satellite layer can sit on top of any basemap instead of hiding it.
import type * as ML from 'maplibre-gl';

let ready: Promise<typeof ML> | null = null;

// IR 10.8 µm brightness -> cloud opacity. Warm ground/sea is dark (~0.25–0.45), cloud tops are bright.
const LO = 0.36, HI = 0.8;

async function irToClouds(url: string, signal: AbortSignal) {
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error(`satellite ${r.status}`);
  const bmp = await createImageBitmap(await r.blob());
  const c = new OffscreenCanvas(bmp.width, bmp.height);
  const g = c.getContext('2d', { willReadFrequently: true })!;
  // the WMS upsamples ~4 km satellite pixels with nearest-neighbour; a touch of blur makes them read as cloud
  g.filter = 'blur(1.2px)';
  g.drawImage(bmp, 0, 0);
  g.filter = 'none';
  const img = g.getImageData(0, 0, bmp.width, bmp.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (d[i] + d[i + 1] + d[i + 2]) / 765;
    let a = (v - LO) / (HI - LO);
    a = a <= 0 ? 0 : a >= 1 ? 1 : a * a * (3 - 2 * a);
    // colder (brighter) tops read whiter; thin warm cloud gets a faint blue cast
    d[i] = 228 + 27 * a; d[i + 1] = 234 + 21 * a; d[i + 2] = 246 + 9 * a;
    d[i + 3] = a * 240 * (d[i + 3] / 255);
  }
  g.putImageData(img, 0, 0);
  return { data: await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer() };
}

export function loadMapLibre() {
  ready ??= import('maplibre-gl').then(mod => {
    const ml = ((mod as any).default ?? mod) as typeof ML;
    ml.setWorkerUrl(`${window.location.origin}/maplibre/maplibre-gl-worker.mjs`);
    ml.addProtocol('cloudir', (p, abort) => irToClouds('https://' + p.url.slice('cloudir://'.length), abort.signal));
    return ml;
  });
  return ready;
}
