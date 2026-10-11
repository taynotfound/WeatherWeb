// Rain truth: merges radar (measured) with four nowcast/forecast sources into one
// 2h timeline of 15-minute buckets, plus the RainViewer radar frame manifest.
// (RainViewer's free tier dropped satellite + nowcast and caps radar at zoom 7; live satellite
// comes from /api/sat instead.)

import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

export const revalidate = 60;

type Frame = { time: number; path: string };
const J = (url: string, init: RequestInit & { next?: any } = {}) =>
  fetch(url, { ...init, signal: AbortSignal.timeout(8000) }).then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); });

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const lat = parseFloat(sp.get('lat') || '');
  const lon = parseFloat(sp.get('lon') || '');
  if (!isFinite(lat) || !isFinite(lon)) return NextResponse.json({ error: 'lat & lon required' }, { status: 400 });

  const key = env.weatherApi();
  const [rvR, omR, mnR, waR] = await Promise.allSettled([
    J('https://api.rainviewer.com/public/weather-maps.json', { next: { revalidate: 60 } }),
    J(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&minutely_15=precipitation,precipitation_probability&forecast_days=1&timezone=auto`, { next: { revalidate: 300 } }),
    J(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`, { headers: { 'User-Agent': 'TomatoWeather/2.0' }, next: { revalidate: 600 } }),
    key ? J(`https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${lat},${lon}&days=1&aqi=no&alerts=no`, { next: { revalidate: 300 } }) : Promise.reject(new Error('no key')),
  ]);
  const rv = rvR.status === 'fulfilled' ? rvR.value : null;
  const om = omR.status === 'fulfilled' ? omR.value : null;
  const mn = mnR.status === 'fulfilled' ? mnR.value : null;
  const wa = waR.status === 'fulfilled' ? waR.value : null;

  const now = Date.now();
  const STEP = 15 * 60_000;
  const start = Math.floor(now / STEP) * STEP;
  const buckets = Array.from({ length: 8 }, (_, i) => ({ time: new Date(start + i * STEP).toISOString(), mm: 0, prob: 0, src: 'none' }));
  const at = (ms: number) => buckets.find(b => new Date(b.time).getTime() === Math.floor(ms / STEP) * STEP);

  // Open-Meteo: native 15 min
  if (om?.minutely_15) {
    om.minutely_15.time.forEach((t: string, i: number) => {
      const b = at(new Date(t).getTime());
      if (!b) return;
      const mm = om.minutely_15.precipitation?.[i] ?? 0;
      if (mm > b.mm) { b.mm = mm; b.src = 'open-meteo'; }
      b.prob = Math.max(b.prob, om.minutely_15.precipitation_probability?.[i] ?? 0);
    });
  }
  // Hourly-resolution sources spread evenly over their hour
  const spread = (startMs: number, perHour: number, prob: number | null, src: string) => {
    for (const b of buckets) {
      const bs = new Date(b.time).getTime();
      if (bs >= startMs && bs < startMs + 3600_000) {
        if (b.mm === 0 && perHour > 0) { b.mm = perHour / 4; b.src = b.src === 'none' ? src : b.src; }
        if (prob != null) b.prob = Math.max(b.prob, prob);
      }
    }
  };
  for (const t of mn?.properties?.timeseries?.slice(0, 5) ?? []) {
    spread(new Date(t.time).getTime(), t.data?.next_1_hours?.details?.precipitation_amount ?? 0, null, 'met.no');
  }
  for (const d of wa?.forecast?.forecastday ?? []) for (const h of d.hour ?? []) {
    spread(h.time_epoch * 1000, h.precip_mm ?? 0, Math.max(h.chance_of_rain ?? 0, h.chance_of_snow ?? 0), 'weatherapi');
  }

  const first = buckets.find(b => b.mm > 0.05);
  const likely = buckets.find(b => b.prob >= 60);
  let headline = 'No rain expected for the next 2 hours';
  let raining = false;
  if (first) {
    raining = true;
    const m = Math.max(0, Math.round((new Date(first.time).getTime() - now) / 60000));
    headline = m <= 0 ? `Raining now · ${first.mm.toFixed(1)} mm / 15 min` : `Rain in about ${m} min`;
  } else if (likely) {
    const m = Math.max(0, Math.round((new Date(likely.time).getTime() - now) / 60000));
    headline = `${Math.round(likely.prob)}% chance in about ${m} min`;
  }

  const frames = (a: any[] | undefined): Frame[] => (a ?? []).map((f: any) => ({ time: f.time * 1000, path: f.path }));
  return NextResponse.json({
    sources: {
      used: [...(rv ? ['rainviewer'] : []), ...(om ? ['open-meteo'] : []), ...(mn ? ['met.no'] : []), ...(wa ? ['weatherapi'] : [])],
      failed: [...(!rv ? ['rainviewer'] : []), ...(!om ? ['open-meteo'] : []), ...(!mn ? ['met.no'] : []), ...(!wa ? ['weatherapi'] : [])],
    },
    raining,
    headline,
    timeline: buckets,
    radar: rv ? {
      host: rv.host,
      past: frames(rv.radar?.past),
      nowcast: frames(rv.radar?.nowcast),
      tileTemplate: `${rv.host}{path}/256/{z}/{x}/{y}/2/1_1.png`,
      maxZoom: 7,
    } : null,
  });
}
