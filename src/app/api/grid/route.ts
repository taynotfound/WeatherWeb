// Sample a lat/lon grid from Open-Meteo for the map's temperature / wind / cloud layers.
// One multi-coordinate request; keyless.
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 600;

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const [s, w, n, e] = ['south', 'west', 'north', 'east'].map(k => parseFloat(sp.get(k) || ''));
  if ([s, w, n, e].some(v => !isFinite(v))) return NextResponse.json({ error: 'bounds required' }, { status: 400 });
  const cols = 7, rows = 5;
  const pts: { lat: number; lon: number }[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    pts.push({
      lat: Math.max(-85, Math.min(85, s + ((r + 0.5) / rows) * (n - s))),
      lon: ((w + ((c + 0.5) / cols) * (e - w) + 540) % 360) - 180,
    });
  }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${pts.map(p => p.lat.toFixed(2)).join(',')}&longitude=${pts.map(p => p.lon.toFixed(2)).join(',')}` +
      `&current=temperature_2m,wind_speed_10m,wind_direction_10m,cloud_cover,precipitation&timezone=UTC`;
    const r = await fetch(url, { signal: AbortSignal.timeout(9000) });
    if (!r.ok) throw new Error(`open-meteo ${r.status}`);
    const j = await r.json();
    const arr = Array.isArray(j) ? j : [j];
    return NextResponse.json({
      points: arr.map((o: any, i: number) => ({
        lat: pts[i].lat, lon: pts[i].lon,
        temp: o.current?.temperature_2m, wind: o.current?.wind_speed_10m, dir: o.current?.wind_direction_10m,
        cloud: o.current?.cloud_cover, precip: o.current?.precipitation,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ points: [], error: err?.message }, { status: 502 });
  }
}
