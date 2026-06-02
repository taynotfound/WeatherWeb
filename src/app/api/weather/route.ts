// Internal aggregator: Open-Meteo + Met.no Locationforecast.
// Both are free, no API key. We fetch in parallel, merge current observations
// (average where both agree, prefer Open-Meteo for hourly/daily granularity).

import { NextRequest, NextResponse } from 'next/server';

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const OM_URL = 'https://api.open-meteo.com/v1/forecast';
const METNO_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';

// Met.no requires a unique User-Agent
const METNO_UA = 'TomatoWeather/1.0 (https://github.com/taynotfound)';

export const revalidate = 300;

type Sources = { used: string[]; failed: string[] };

async function geocode(q: string) {
  const r = await fetch(`${GEO_URL}?name=${encodeURIComponent(q)}&count=1&language=en&format=json`, {
    next: { revalidate: 3600 },
  });
  if (!r.ok) throw new Error('geocoding failed');
  const j = await r.json();
  const hit = j?.results?.[0];
  if (!hit) throw new Error('no location');
  return {
    latitude: hit.latitude,
    longitude: hit.longitude,
    name: hit.name,
    country: hit.country,
    admin: hit.admin1 || '',
  };
}

async function reverse(lat: number, lon: number) {
  // Try Open-Meteo first
  try {
    const r = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`,
      { next: { revalidate: 3600 } }
    );
    if (r.ok) {
      const j = await r.json();
      const hit = j?.results?.[0];
      if (hit?.name) return hit;
    }
  } catch {}
  // Fallback: BigDataCloud (no key, generous CORS, returns city + country)
  try {
    const r = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { next: { revalidate: 3600 } }
    );
    if (r.ok) {
      const j = await r.json();
      const name = j.city || j.locality || j.principalSubdivision || j.countryName || null;
      if (name) return { name, country: j.countryName || '', admin1: j.principalSubdivision || '' };
    }
  } catch {}
  // Last resort: Nominatim (slower, has UA requirements)
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&accept-language=en`,
      { headers: { 'User-Agent': 'TomatoWeather/1.0' }, next: { revalidate: 3600 } }
    );
    if (r.ok) {
      const j = await r.json();
      const a = j.address || {};
      const name = a.city || a.town || a.village || a.municipality || a.county || a.state || j.name || null;
      if (name) return { name, country: a.country || '', admin1: a.state || '' };
    }
  } catch {}
  return null;
}

async function fetchOpenMeteo(lat: number, lon: number) {
  const url = `${OM_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index` +
    `&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,relative_humidity_2m,uv_index` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,uv_index_max,wind_speed_10m_max` +
    `&minutely_15=precipitation,precipitation_probability` +
    `&timezone=auto&forecast_days=7&past_days=0`;
  const r = await fetch(url, { next: { revalidate: 300 } });
  if (!r.ok) throw new Error(`open-meteo ${r.status}`);
  return r.json();
}

async function fetchMetNo(lat: number, lon: number) {
  const r = await fetch(`${METNO_URL}?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`, {
    headers: { 'User-Agent': METNO_UA, Accept: 'application/json' },
    next: { revalidate: 600 },
  });
  if (!r.ok) throw new Error(`met.no ${r.status}`);
  return r.json();
}

function mergeCurrent(om: any, metno: any, sources: Sources) {
  const omCur = om?.current ?? {};
  const metnoFirst = metno?.properties?.timeseries?.[0]?.data?.instant?.details ?? null;
  const metnoNext1h = metno?.properties?.timeseries?.[0]?.data?.next_1_hours ?? null;

  // average where both present, else fall back
  const avg = (a: number | undefined, b: number | undefined) => {
    if (typeof a === 'number' && typeof b === 'number') return (a + b) / 2;
    return typeof a === 'number' ? a : b ?? null;
  };

  return {
    time: omCur.time,
    temperatureC: avg(omCur.temperature_2m, metnoFirst?.air_temperature),
    feelsLikeC: omCur.apparent_temperature ?? omCur.temperature_2m ?? null,
    humidity: avg(omCur.relative_humidity_2m, metnoFirst?.relative_humidity),
    pressure: avg(omCur.pressure_msl, metnoFirst?.air_pressure_at_sea_level),
    windKmh: avg(
      typeof omCur.wind_speed_10m === 'number' ? omCur.wind_speed_10m : undefined,
      typeof metnoFirst?.wind_speed === 'number' ? metnoFirst.wind_speed * 3.6 : undefined
    ),
    windGustKmh: omCur.wind_gusts_10m ?? null,
    windDirection: omCur.wind_direction_10m ?? metnoFirst?.wind_from_direction ?? null,
    cloudCover: avg(omCur.cloud_cover, metnoFirst?.cloud_area_fraction),
    uvIndex: omCur.uv_index ?? metnoFirst?.ultraviolet_index_clear_sky ?? null,
    isDay: omCur.is_day === 1,
    precipitation: omCur.precipitation ?? metnoNext1h?.details?.precipitation_amount ?? 0,
    weatherCode: omCur.weather_code ?? null,
    metnoSymbol: metnoNext1h?.summary?.symbol_code ?? null,
    consensus: sources.used.length > 1,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const latParam = searchParams.get('lat');
  const lonParam = searchParams.get('lon');

  try {
    let latitude: number, longitude: number;
    let name = '', country = '', admin = '';

    if (q) {
      const geo = await geocode(q);
      latitude = geo.latitude; longitude = geo.longitude;
      name = geo.name; country = geo.country; admin = geo.admin;
    } else if (latParam && lonParam) {
      latitude = parseFloat(latParam);
      longitude = parseFloat(lonParam);
      const rev = await reverse(latitude, longitude);
      if (rev) { name = rev.name; country = rev.country; admin = rev.admin1 || ''; }
    } else {
      return NextResponse.json({ error: 'Provide q or lat+lon' }, { status: 400 });
    }

    const sources: Sources = { used: [], failed: [] };

    const [omRes, metnoRes] = await Promise.allSettled([
      fetchOpenMeteo(latitude, longitude),
      fetchMetNo(latitude, longitude),
    ]);

    const om = omRes.status === 'fulfilled' ? omRes.value : null;
    const metno = metnoRes.status === 'fulfilled' ? metnoRes.value : null;
    if (om) sources.used.push('open-meteo'); else sources.failed.push('open-meteo');
    if (metno) sources.used.push('met.no'); else sources.failed.push('met.no');

    if (!om && !metno) {
      return NextResponse.json({ error: 'all upstream providers failed' }, { status: 502 });
    }

    return NextResponse.json({
      location: { name: name || `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`, country, admin, latitude, longitude },
      current: mergeCurrent(om ?? {}, metno ?? {}, sources),
      hourly: om?.hourly ?? null,
      daily: om?.daily ?? null,
      minutely_15: om?.minutely_15 ?? null,
      timezone: om?.timezone ?? 'UTC',
      sources,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 500 });
  }
}
