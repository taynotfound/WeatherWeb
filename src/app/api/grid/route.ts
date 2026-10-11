// Gridded temperature + wind for the map's field layers, from Open-Meteo (keyless).
// The world is cut into fixed 8×8-point blocks on a lattice of `step` degrees, so a block's URL is
// identical for every viewer and pan — the CDN and the fetch cache absorb almost all traffic.
import { NextRequest, NextResponse } from 'next/server';

const B = 8;
const STEPS = [0.125, 0.25, 0.5, 1, 2, 4, 8];
const r1 = (v: unknown) => (typeof v === 'number' && isFinite(v) ? Math.round(v * 10) / 10 : null);

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const step = parseFloat(sp.get('step') || '');
  const bx = parseInt(sp.get('bx') || '', 10), by = parseInt(sp.get('by') || '', 10);
  if (!STEPS.includes(step) || !Number.isInteger(bx) || !Number.isInteger(by)) {
    return NextResponse.json({ error: 'step, bx, by required' }, { status: 400 });
  }

  // lattice points; lon is unwrapped for the client, normalised for the request
  const pts: { lat: number; lon: number; k: number }[] = [];
  for (let r = 0; r < B; r++) for (let c = 0; c < B; c++) {
    const lat = (by * B + r) * step, lon = (bx * B + c) * step;
    if (Math.abs(lat) <= 84) pts.push({ lat, lon: ((lon + 540) % 360) - 180, k: r * B + c });
  }
  if (!pts.length) return NextResponse.json({ step, bx, by, n: B, times: [], t: [], ws: [], wd: [] });

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${pts.map(p => p.lat).join(',')}&longitude=${pts.map(p => p.lon).join(',')}` +
      `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m&forecast_hours=25&timezone=GMT`;
    const get = () => fetch(url, { signal: AbortSignal.timeout(9000), next: { revalidate: 1800 } });
    // Open-Meteo occasionally rejects a burst of parallel multi-point calls; one retry clears it.
    let r = await get().catch(() => null);
    if (!r?.ok) { await new Promise(res => setTimeout(res, 700)); r = await get(); }
    if (!r.ok) throw new Error(`open-meteo ${r.status}`);
    const j = await r.json();
    const arr: any[] = Array.isArray(j) ? j : [j];
    const times: number[] = (arr[0]?.hourly?.time ?? []).map((s: string) => Date.parse(s + 'Z'));
    // time-major arrays of B*B values; points outside ±84° stay null
    const grid = (key: string) => times.map((_, h) => {
      const row: (number | null)[] = new Array(B * B).fill(null);
      pts.forEach((p, i) => { row[p.k] = r1(arr[i]?.hourly?.[key]?.[h]); });
      return row;
    });
    return NextResponse.json(
      { step, bx, by, n: B, times, t: grid('temperature_2m'), ws: grid('wind_speed_10m'), wd: grid('wind_direction_10m') },
      { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' } },
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'grid failed' }, { status: 502 });
  }
}
