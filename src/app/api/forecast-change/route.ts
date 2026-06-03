// Forecast change: compare yesterday's forecast for today vs today's current forecast.
// Uses Open-Meteo previous-runs API to fetch the run from ~24h ago.
//
// Returns deltas for today's max temp, min temp, and precip probability.

import { NextRequest, NextResponse } from 'next/server';

const PREV_RUNS_URL = 'https://previous-runs-api.open-meteo.com/v1/forecast';
const CURRENT_URL = 'https://api.open-meteo.com/v1/forecast';

export const revalidate = 1800; // 30 min

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '');
  const lon = parseFloat(searchParams.get('lon') || '');
  if (!isFinite(lat) || !isFinite(lon)) {
    return NextResponse.json({ error: 'lat+lon required' }, { status: 400 });
  }

  try {
    const params = (extra: Record<string, string>) => {
      const u = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum',
        timezone: 'auto',
        forecast_days: '2',
        ...extra,
      });
      return u.toString();
    };

    // Today's current forecast
    const curR = await fetch(`${CURRENT_URL}?${params({})}`, { next: { revalidate: 1800 } });
    if (!curR.ok) return NextResponse.json({ error: 'current fetch failed' }, { status: 502 });
    const cur = await curR.json();

    // Yesterday's run for today (via previous_days=1)
    const prevR = await fetch(
      `${PREV_RUNS_URL}?${params({ daily: 'temperature_2m_max_previous_day1,temperature_2m_min_previous_day1,precipitation_probability_max_previous_day1,precipitation_sum_previous_day1' })}`,
      { next: { revalidate: 1800 } }
    );

    let prev: any = null;
    if (prevR.ok) prev = await prevR.json();

    const todayIdx = 0;
    const curMax = cur?.daily?.temperature_2m_max?.[todayIdx];
    const curMin = cur?.daily?.temperature_2m_min?.[todayIdx];
    const curPop = cur?.daily?.precipitation_probability_max?.[todayIdx];
    const curPrecip = cur?.daily?.precipitation_sum?.[todayIdx];

    const prevMax = prev?.daily?.temperature_2m_max_previous_day1?.[todayIdx];
    const prevMin = prev?.daily?.temperature_2m_min_previous_day1?.[todayIdx];
    const prevPop = prev?.daily?.precipitation_probability_max_previous_day1?.[todayIdx];
    const prevPrecip = prev?.daily?.precipitation_sum_previous_day1?.[todayIdx];

    if (prevMax == null) {
      return NextResponse.json({ available: false, reason: 'no previous run' });
    }

    return NextResponse.json({
      available: true,
      date: cur?.daily?.time?.[todayIdx] || null,
      max: { previous: prevMax, current: curMax, delta: curMax - prevMax },
      min: { previous: prevMin, current: curMin, delta: curMin - prevMin },
      pop: { previous: prevPop, current: curPop, delta: (curPop ?? 0) - (prevPop ?? 0) },
      precip: { previous: prevPrecip, current: curPrecip, delta: (curPrecip ?? 0) - (prevPrecip ?? 0) },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'fetch failed' }, { status: 500 });
  }
}
