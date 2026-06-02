// Rain truth endpoint — merges multiple sources into a single timeline
// the client can plot. Trust order (highest first):
//   1. RainViewer radar (measurement)
//   2. OpenWeatherMap OneCall minutely (60min minute-resolution forecast)
//   3. Met.no next_1_hours precipitation_amount
//   4. Open-Meteo minutely_15 nowcast
//
// We always return 8x15min buckets (= 2h). Bars are filled from whichever
// source has data, preferring higher-resolution sources for the near term.

import { NextRequest, NextResponse } from 'next/server';

const RAINVIEWER_INDEX = 'https://api.rainviewer.com/public/weather-maps.json';
const OWM_KEY = process.env.OWM_API_KEY;

export const revalidate = 60;

type Frame = { time: number; path: string };

async function getRainviewerIndex() {
  try {
    const r = await fetch(RAINVIEWER_INDEX, { next: { revalidate: 60 } });
    if (!r.ok) return null;
    const j = await r.json();
    return {
      host: j.host,
      past: (j?.radar?.past ?? []) as Frame[],
      nowcast: (j?.radar?.nowcast ?? []) as Frame[],
    };
  } catch { return null; }
}

function fmtRainviewerFrames(idx: any) {
  if (!idx) return null;
  return {
    host: idx.host,
    past: idx.past.map((f: Frame) => ({ time: f.time * 1000, path: f.path })),
    nowcast: idx.nowcast.map((f: Frame) => ({ time: f.time * 1000, path: f.path })),
    tileTemplate: `${idx.host}{path}/256/{z}/{x}/{y}/4/1_1.png`,
  };
}

async function getOpenMeteoNowcast(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&minutely_15=precipitation,precipitation_probability&forecast_days=1&timezone=auto`;
  try {
    const r = await fetch(url, { next: { revalidate: 300 } });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

async function getOwmOneCall(lat: number, lon: number) {
  if (!OWM_KEY) return null;
  // OneCall 3.0 is paid. Use free 2.5 forecast (5-day/3h) and synth hourly shape.
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}` +
    `&units=metric&appid=${OWM_KEY}&cnt=8`;
  try {
    const r = await fetch(url, { next: { revalidate: 300 } });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j?.list?.length) return null;
    // Reshape into { hourly: [{dt, rain:{'1h'}, snow:{'1h'}, pop}] } so existing
    // bucket-filler keeps working. 2.5 reports 3h-totals; divide by 3 for "per hour".
    return {
      minutely: [] as Array<{ dt: number; precipitation: number }>,
      hourly: j.list.map((it: any) => ({
        dt: it.dt,
        rain: { '1h': (it.rain?.['3h'] ?? 0) / 3 },
        snow: { '1h': (it.snow?.['3h'] ?? 0) / 3 },
        pop: it.pop ?? 0,
      })),
    };
  } catch { return null; }
}

async function getMetNoNextHour(lat: number, lon: number) {
  try {
    const r = await fetch(
      `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`,
      { headers: { 'User-Agent': 'TomatoWeather/1.0' }, next: { revalidate: 600 } }
    );
    if (!r.ok) return null;
    const j = await r.json();
    const ts = j?.properties?.timeseries?.slice(0, 6) ?? [];
    return ts.map((t: any) => ({
      time: t.time,
      next1h: t?.data?.next_1_hours?.details?.precipitation_amount ?? null,
      symbol: t?.data?.next_1_hours?.summary?.symbol_code ?? null,
    }));
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '');
  const lon = parseFloat(searchParams.get('lon') || '');
  if (!isFinite(lat) || !isFinite(lon)) {
    return NextResponse.json({ error: 'lat & lon required' }, { status: 400 });
  }

  const [rv, om, owm, metno] = await Promise.all([
    getRainviewerIndex(),
    getOpenMeteoNowcast(lat, lon),
    getOwmOneCall(lat, lon),
    getMetNoNextHour(lat, lon),
  ]);

  const sources = {
    used: [
      ...(rv ? ['rainviewer'] : []),
      ...(owm ? ['openweathermap'] : []),
      ...(om ? ['open-meteo'] : []),
      ...(metno ? ['met.no'] : []),
    ],
    failed: [
      ...(!rv ? ['rainviewer'] : []),
      ...(!owm ? ['openweathermap'] : []),
      ...(!om ? ['open-meteo'] : []),
      ...(!metno ? ['met.no'] : []),
    ],
  };

  // Build canonical 8x15min timeline ALWAYS — start exactly at the previous
  // 15-min boundary so bars align with wall clock.
  const now = Date.now();
  const startMs = Math.floor(now / (15 * 60 * 1000)) * (15 * 60 * 1000);
  const buckets: Array<{ time: string; mm: number; prob: number; src: string }> = [];
  for (let i = 0; i < 8; i++) {
    const t = startMs + i * 15 * 60 * 1000;
    buckets.push({ time: new Date(t).toISOString(), mm: 0, prob: 0, src: 'none' });
  }

  // Fill from OWM minutely (60min @ 1-min resolution): aggregate into 15-min buckets
  if (owm?.minutely?.length) {
    const minutely: Array<{ dt: number; precipitation: number }> = owm.minutely;
    for (const b of buckets) {
      const bStart = new Date(b.time).getTime();
      const bEnd = bStart + 15 * 60 * 1000;
      const slice = minutely.filter(m => m.dt * 1000 >= bStart && m.dt * 1000 < bEnd);
      if (slice.length) {
        const mmPer15min = slice.reduce((s, m) => s + (m.precipitation || 0), 0);
        b.mm = Math.max(b.mm, mmPer15min);
        b.prob = Math.max(b.prob, slice.some(m => m.precipitation > 0) ? 100 : 0);
        if (b.mm > 0) b.src = 'owm';
      }
    }
  }

  // Fill from OWM hourly (next 48h, 1-hour resolution): distribute hourly mm across its 4 buckets
  if (owm?.hourly?.length) {
    for (const h of owm.hourly as Array<any>) {
      const hStart = h.dt * 1000;
      const hEnd = hStart + 60 * 60 * 1000;
      const inWindow = buckets.filter(b => {
        const bStart = new Date(b.time).getTime();
        return bStart >= hStart && bStart < hEnd;
      });
      if (!inWindow.length) continue;
      const rain1h = (h.rain?.['1h'] ?? 0) + (h.snow?.['1h'] ?? 0);
      const prob = (h.pop ?? 0) * 100;
      for (const b of inWindow) {
        if (b.mm === 0 && rain1h > 0) {
          b.mm = rain1h / 4;
          b.src = b.src === 'none' ? 'owm-hourly' : b.src;
        }
        if (b.prob < prob) b.prob = prob;
      }
    }
  }

  // Fill from Open-Meteo minutely_15 (already 15-min): align by time
  if (om?.minutely_15) {
    const times: string[] = om.minutely_15.time;
    const mm: number[] = om.minutely_15.precipitation;
    const prob: number[] = om.minutely_15.precipitation_probability;
    for (let i = 0; i < times.length; i++) {
      const t = new Date(times[i]).getTime();
      const b = buckets.find(b => new Date(b.time).getTime() === t);
      if (b) {
        if (b.mm === 0 && (mm[i] ?? 0) > 0) {
          b.mm = mm[i];
          b.src = b.src === 'none' ? 'open-meteo' : b.src;
        }
        if (b.prob < (prob[i] ?? 0)) b.prob = prob[i] ?? 0;
      }
    }
  }

  // Final fallback: Met.no per-hour
  if (metno?.length) {
    for (const m of metno) {
      const mStart = new Date(m.time).getTime();
      const mEnd = mStart + 60 * 60 * 1000;
      const inWindow = buckets.filter(b => {
        const bStart = new Date(b.time).getTime();
        return bStart >= mStart && bStart < mEnd;
      });
      const v = m.next1h ?? 0;
      for (const b of inWindow) {
        if (b.mm === 0 && v > 0) {
          b.mm = v / 4;
          b.src = b.src === 'none' ? 'met.no' : b.src;
        }
      }
    }
  }

  // Headline
  const latestRadarFrameTime = rv?.past?.length
    ? rv.past[rv.past.length - 1].time * 1000
    : null;

  const firstWet = buckets.find(b => b.mm > 0.05);
  const anyHighProb = buckets.find(b => b.prob >= 60);
  let headline = 'no rain expected in the next 2 hours';
  let raining = false;

  if (firstWet) {
    raining = true;
    const minutesAhead = Math.max(0, Math.round((new Date(firstWet.time).getTime() - now) / 60000));
    if (minutesAhead <= 0) headline = `raining now (${firstWet.mm.toFixed(1)} mm/15min · ${firstWet.src})`;
    else headline = `rain in ~${minutesAhead} min · ${firstWet.mm.toFixed(1)} mm`;
  } else if (anyHighProb) {
    raining = true;
    const minutesAhead = Math.max(0, Math.round((new Date(anyHighProb.time).getTime() - now) / 60000));
    headline = `${Math.round(anyHighProb.prob)}% chance in ~${minutesAhead} min`;
  } else if (rv?.past?.length) {
    headline = `clear. no rain on radar in the last hour.`;
  }

  return NextResponse.json({
    sources,
    raining,
    headline,
    timeline: buckets,
    radar: fmtRainviewerFrames(rv),
    latestRadarFrameTime,
    metno: metno ?? [],
  });
}
