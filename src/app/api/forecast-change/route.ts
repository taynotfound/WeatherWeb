// Forecast change: compare yesterday's forecast for today vs today's current forecast.
// Open-Meteo previous-runs API supports HOURLY `_previous_day1` variants.
// We pull 24h of today's data + the same 24h as forecast 1 day ago, then derive daily aggregates.

import { NextRequest, NextResponse } from 'next/server';

const PREV_RUNS_URL = 'https://previous-runs-api.open-meteo.com/v1/forecast';

export const revalidate = 1800; // 30 min

function maxOf(arr: (number | null | undefined)[]): number | null {
  const v = arr.filter((x): x is number => typeof x === 'number' && isFinite(x));
  return v.length ? Math.max(...v) : null;
}
function minOf(arr: (number | null | undefined)[]): number | null {
  const v = arr.filter((x): x is number => typeof x === 'number' && isFinite(x));
  return v.length ? Math.min(...v) : null;
}
function sumOf(arr: (number | null | undefined)[]): number {
  return arr.reduce<number>((a, b) => a + (typeof b === 'number' && isFinite(b) ? b : 0), 0);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '');
  const lon = parseFloat(searchParams.get('lon') || '');
  if (!isFinite(lat) || !isFinite(lon)) {
    return NextResponse.json({ error: 'lat+lon required' }, { status: 400 });
  }

  try {
    const u = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      hourly: [
        'temperature_2m',
        'temperature_2m_previous_day1',
        'precipitation',
        'precipitation_previous_day1',
        'precipitation_probability',
        'precipitation_probability_previous_day1',
      ].join(','),
      timezone: 'auto',
      forecast_days: '1',
    });

    const r = await fetch(`${PREV_RUNS_URL}?${u.toString()}`, { next: { revalidate: 1800 } });
    if (!r.ok) return NextResponse.json({ available: false, reason: 'upstream ' + r.status });
    const j = await r.json();

    const h = j?.hourly;
    if (!h?.time?.length) return NextResponse.json({ available: false, reason: 'no hourly' });

    const curT = h.temperature_2m as (number | null)[];
    const prevT = h.temperature_2m_previous_day1 as (number | null)[];
    const curP = h.precipitation as (number | null)[];
    const prevP = h.precipitation_previous_day1 as (number | null)[];
    const curPop = h.precipitation_probability as (number | null)[];
    const prevPop = h.precipitation_probability_previous_day1 as (number | null)[];

    const prevHas = Array.isArray(prevT) && prevT.some(x => typeof x === 'number' && isFinite(x));
    if (!prevHas) return NextResponse.json({ available: false, reason: 'no previous run' });

    const curMax = maxOf(curT);
    const prevMax = maxOf(prevT);
    const curMin = minOf(curT);
    const prevMin = minOf(prevT);
    const curPrecip = sumOf(curP);
    const prevPrecip = sumOf(prevP);
    const curPopMax = maxOf(curPop);
    const prevPopMax = maxOf(prevPop);

    return NextResponse.json({
      available: true,
      date: h.time[0]?.slice(0, 10) || null,
      max: curMax != null && prevMax != null ? { previous: prevMax, current: curMax, delta: curMax - prevMax } : null,
      min: curMin != null && prevMin != null ? { previous: prevMin, current: curMin, delta: curMin - prevMin } : null,
      pop: curPopMax != null && prevPopMax != null ? { previous: prevPopMax, current: curPopMax, delta: curPopMax - prevPopMax } : null,
      precip: { previous: prevPrecip, current: curPrecip, delta: curPrecip - prevPrecip },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'fetch failed' }, { status: 500 });
  }
}
