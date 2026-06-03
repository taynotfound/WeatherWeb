// Anomaly API: compares today's forecast (max temp + precip) vs the 30-year
// climatological normal for this calendar day at the same location.
// Uses Open-Meteo Archive API. Free, no key, slow first request, cached after.

import { NextRequest, NextResponse } from 'next/server';
import { buildAnomalyVerdict, type Anomaly } from '@/lib/anomaly';

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

export const revalidate = 21600; // 6h — climatology doesn't change

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '');
  const lon = parseFloat(searchParams.get('lon') || '');
  const todayMaxC = parseFloat(searchParams.get('todayMax') || 'NaN');
  const todayPrecipMm = parseFloat(searchParams.get('todayPrecip') || '0');
  if (!isFinite(lat) || !isFinite(lon)) {
    return NextResponse.json({ error: 'lat+lon required' }, { status: 400 });
  }

  // Build date list: same month-day across the last 15 years (skip current year).
  const today = new Date();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(today.getUTCDate()).padStart(2, '0');
  const yearNow = today.getUTCFullYear();
  const startYear = yearNow - 16;
  const endYear = yearNow - 1;

  // Open-Meteo archive accepts a date range; we'll fetch 15 years of just one
  // day per year via a wider range and filter client-side. Cheaper: fetch full
  // range and pick matches.
  const start = `${startYear}-01-01`;
  const end = `${endYear}-12-31`;
  const url = `${ARCHIVE_URL}?latitude=${lat}&longitude=${lon}` +
    `&start_date=${start}&end_date=${end}` +
    `&daily=temperature_2m_max,precipitation_sum&timezone=auto`;

  try {
    const r = await fetch(url, { next: { revalidate: 21600 } });
    if (!r.ok) return NextResponse.json({ error: `archive ${r.status}` }, { status: 502 });
    const j = await r.json();
    const times: string[] = j?.daily?.time ?? [];
    const tmax: number[] = j?.daily?.temperature_2m_max ?? [];
    const psum: number[] = j?.daily?.precipitation_sum ?? [];

    // Collect values for matching month-day (±3 day window for smoothing)
    const targetDoy = doy(today);
    const tVals: number[] = [];
    const pVals: number[] = [];
    for (let i = 0; i < times.length; i++) {
      const d = new Date(times[i] + 'T00:00:00Z');
      if (Math.abs(diffDays(d, targetDoy)) <= 3) {
        if (typeof tmax[i] === 'number') tVals.push(tmax[i]);
        if (typeof psum[i] === 'number') pVals.push(psum[i]);
      }
      // tiny fast path
      if (tVals.length > 200) break;
    }

    if (!tVals.length) {
      return NextResponse.json({ error: 'no climatology data' }, { status: 502 });
    }

    const normalMaxC = avg(tVals);
    const normalPrecipMm = avg(pVals);
    const deltaC = isFinite(todayMaxC) ? todayMaxC - normalMaxC : 0;
    const precipDeltaMm = todayPrecipMm - normalPrecipMm;

    const out: Anomaly = {
      todayMaxC: isFinite(todayMaxC) ? todayMaxC : normalMaxC,
      normalMaxC,
      deltaC,
      todayPrecipMm,
      normalPrecipMm,
      precipDeltaMm,
      verdict: buildAnomalyVerdict(deltaC, precipDeltaMm),
      daysSampled: tVals.length,
    };
    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'anomaly failed' }, { status: 500 });
  }
}

function doy(d: Date) {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const diff = d.getTime() - start;
  return Math.floor(diff / 86400_000);
}

function diffDays(d: Date, targetDoy: number) {
  return doy(d) - targetDoy;
}

function avg(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
