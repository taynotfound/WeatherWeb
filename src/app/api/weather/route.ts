// Multi-source aggregator.
//   Open-Meteo (best-match)   -> hourly/daily/nowcast backbone
//   Open-Meteo ECMWF/GFS/ICON -> independent NWP models, used for spread + confidence
//   Met.no Locationforecast   -> Norwegian Met Institute
//   WeatherAPI.com            -> commercial provider (WEATHER_API key)
// "Current" values are the median across whatever answered, and every source's own
// reading is returned so the UI can show who agrees.

import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { condition, median, metnoToWmo, wapiToWmo } from '@/lib/wx';

export const revalidate = 300;

const METNO_UA = 'TomatoWeather/2.0 (https://github.com/taynotfound)';
const MODELS = [
  { id: 'ecmwf_ifs025', name: 'ECMWF IFS' },
  { id: 'gfs_seamless', name: 'NOAA GFS' },
  { id: 'icon_seamless', name: 'DWD ICON' },
];

type Num = number | null;

async function getJson(url: string, init: RequestInit & { next?: any } = {}) {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(9000) });
  if (!r.ok) throw new Error(`${new URL(url).hostname} ${r.status}`);
  return r.json();
}

async function geocode(q: string) {
  const j = await getJson(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`,
    { next: { revalidate: 3600 } }
  );
  const hit = j?.results?.[0];
  if (!hit) throw new Error('no location');
  return { latitude: hit.latitude, longitude: hit.longitude, name: hit.name, country: hit.country, countryCode: (hit.country_code || '').toUpperCase(), admin: hit.admin1 || '' };
}

async function reverse(lat: number, lon: number) {
  try {
    const j = await getJson(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`, { next: { revalidate: 3600 } });
    const h = j?.results?.[0];
    if (h?.name) return { name: h.name, country: h.country || '', countryCode: (h.country_code || '').toUpperCase(), admin: h.admin1 || '' };
  } catch {}
  try {
    const j = await getJson(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`, { next: { revalidate: 3600 } });
    const name = j.city || j.locality || j.principalSubdivision || j.countryName;
    if (name) return { name, country: j.countryName || '', countryCode: (j.countryCode || '').toUpperCase(), admin: j.principalSubdivision || '' };
  } catch {}
  try {
    const j = await getJson(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&accept-language=en`, { headers: { 'User-Agent': METNO_UA }, next: { revalidate: 3600 } });
    const a = j.address || {};
    const name = a.city || a.town || a.village || a.municipality || a.county || a.state;
    if (name) return { name, country: a.country || '', countryCode: (a.country_code || '').toUpperCase(), admin: a.state || '' };
  } catch {}
  return null;
}

const fetchOpenMeteo = (lat: number, lon: number) =>
  getJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index` +
      `&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,relative_humidity_2m,uv_index,cloud_cover,visibility,dew_point_2m,pressure_msl,is_day` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,daylight_duration,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant` +
      `&minutely_15=precipitation,precipitation_probability&timezone=auto&forecast_days=10`,
    { next: { revalidate: 300 } }
  );

const fetchModels = (lat: number, lon: number) =>
  getJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&hourly=temperature_2m,apparent_temperature,wind_speed_10m,precipitation,relative_humidity_2m` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=10&models=${MODELS.map(m => m.id).join(',')}`,
    { next: { revalidate: 900 } }
  );

const fetchMetNo = (lat: number, lon: number) =>
  getJson(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`, {
    headers: { 'User-Agent': METNO_UA, Accept: 'application/json' },
    next: { revalidate: 600 },
  });

const fetchWapi = (lat: number, lon: number) => {
  const key = env.weatherApi();
  if (!key) return Promise.reject(new Error('WEATHER_API not set'));
  return getJson(`https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${lat},${lon}&days=7&aqi=no&alerts=no`, { next: { revalidate: 600 } });
};

// Index of the hourly slot that contains "now" in the location's timezone.
function nowIndex(times: string[] | undefined, currentTime?: string) {
  if (!times?.length) return 0;
  const target = (currentTime || '').slice(0, 13);
  const i = times.findIndex(t => t.slice(0, 13) === target);
  return i >= 0 ? i : 0;
}

function mode(xs: number[]) {
  const m = new Map<number, number>();
  xs.forEach(x => m.set(x, (m.get(x) ?? 0) + 1));
  let best: number | null = null, bc = 0;
  m.forEach((c, k) => { if (c > bc) { best = k; bc = c; } });
  return best;
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const q = sp.get('q');
  const latParam = sp.get('lat');
  const lonParam = sp.get('lon');

  try {
    let latitude: number, longitude: number;
    let place = { name: '', country: '', countryCode: '', admin: '' };

    if (q) {
      const g = await geocode(q);
      latitude = g.latitude; longitude = g.longitude;
      place = { name: g.name, country: g.country, countryCode: g.countryCode, admin: g.admin };
    } else if (latParam && lonParam) {
      latitude = parseFloat(latParam); longitude = parseFloat(lonParam);
      if (!isFinite(latitude) || !isFinite(longitude)) return NextResponse.json({ error: 'bad coordinates' }, { status: 400 });
      const rev = await reverse(latitude, longitude);
      if (rev) place = rev;
    } else {
      return NextResponse.json({ error: 'Provide q or lat+lon' }, { status: 400 });
    }

    const [omR, modR, mnR, waR] = await Promise.allSettled([
      fetchOpenMeteo(latitude, longitude),
      fetchModels(latitude, longitude),
      fetchMetNo(latitude, longitude),
      fetchWapi(latitude, longitude),
    ]);
    const om = omR.status === 'fulfilled' ? omR.value : null;
    const mod = modR.status === 'fulfilled' ? modR.value : null;
    const mn = mnR.status === 'fulfilled' ? mnR.value : null;
    const wa = waR.status === 'fulfilled' ? waR.value : null;
    if (!om && !mn && !wa) return NextResponse.json({ error: 'all upstream providers failed' }, { status: 502 });

    const oc = om?.current ?? {};
    const mi = mn?.properties?.timeseries?.[0]?.data?.instant?.details ?? null;
    const m1 = mn?.properties?.timeseries?.[0]?.data?.next_1_hours ?? null;
    const wc = wa?.current ?? null;
    const tz = om?.timezone ?? wa?.location?.tz_id ?? 'UTC';
    const idx = nowIndex(om?.hourly?.time, oc.time);

    // ---- per-source readings
    type Reading = { id: string; name: string; kind: 'forecast' | 'model'; tempC: Num; feelsC: Num; windKmh: Num; humidity: Num; precipMm: Num; code: number | null };
    const readings: Reading[] = [];
    if (om) readings.push({ id: 'open-meteo', name: 'Open-Meteo', kind: 'forecast', tempC: oc.temperature_2m ?? null, feelsC: oc.apparent_temperature ?? null, windKmh: oc.wind_speed_10m ?? null, humidity: oc.relative_humidity_2m ?? null, precipMm: oc.precipitation ?? null, code: oc.weather_code ?? null });
    if (mn && mi) readings.push({ id: 'met.no', name: 'MET Norway', kind: 'forecast', tempC: mi.air_temperature ?? null, feelsC: null, windKmh: typeof mi.wind_speed === 'number' ? mi.wind_speed * 3.6 : null, humidity: mi.relative_humidity ?? null, precipMm: m1?.details?.precipitation_amount ?? null, code: metnoToWmo(m1?.summary?.symbol_code) });
    if (wc) readings.push({ id: 'weatherapi', name: 'WeatherAPI', kind: 'forecast', tempC: wc.temp_c ?? null, feelsC: wc.feelslike_c ?? null, windKmh: wc.wind_kph ?? null, humidity: wc.humidity ?? null, precipMm: wc.precip_mm ?? null, code: wapiToWmo(wc.condition?.code) });
    if (mod?.hourly) {
      const mi2 = nowIndex(mod.hourly.time, oc.time);
      for (const m of MODELS) {
        const t = mod.hourly[`temperature_2m_${m.id}`]?.[mi2];
        if (typeof t !== 'number') continue;
        readings.push({ id: m.id, name: m.name, kind: 'model', tempC: t, feelsC: mod.hourly[`apparent_temperature_${m.id}`]?.[mi2] ?? null, windKmh: mod.hourly[`wind_speed_10m_${m.id}`]?.[mi2] ?? null, humidity: mod.hourly[`relative_humidity_2m_${m.id}`]?.[mi2] ?? null, precipMm: mod.hourly[`precipitation_${m.id}`]?.[mi2] ?? null, code: null });
      }
    }

    const pick = (k: keyof Reading) => readings.map(r => r[k]).filter((v): v is number => typeof v === 'number');
    const temps = pick('tempC');
    const temperatureC = median(temps);
    const spread = temps.length > 1 ? Math.max(...temps) - Math.min(...temps) : 0;

    const codes = readings.map(r => r.code).filter((c): c is number => typeof c === 'number');
    const weatherCode = (oc.weather_code != null && codes.filter(c => c === oc.weather_code).length >= 1 && mode(codes) === oc.weather_code)
      ? oc.weather_code
      : (mode(codes) ?? oc.weather_code ?? 3);

    const isDay = oc.is_day != null ? oc.is_day === 1 : wc ? wc.is_day === 1 : true;
    const current = {
      time: oc.time ?? wa?.location?.localtime,
      temperatureC,
      feelsLikeC: median([...(pick('feelsC'))]) ?? temperatureC,
      humidity: median(pick('humidity')),
      pressure: median([oc.pressure_msl, mi?.air_pressure_at_sea_level, wc?.pressure_mb].filter((v): v is number => typeof v === 'number')),
      windKmh: median(pick('windKmh')),
      windGustKmh: median([oc.wind_gusts_10m, wc?.gust_kph].filter((v): v is number => typeof v === 'number')),
      windDirection: oc.wind_direction_10m ?? wc?.wind_degree ?? mi?.wind_from_direction ?? null,
      cloudCover: median([oc.cloud_cover, mi?.cloud_area_fraction, wc?.cloud].filter((v): v is number => typeof v === 'number')),
      uvIndex: median([oc.uv_index, wc?.uv].filter((v): v is number => typeof v === 'number')) ?? 0,
      visibilityKm: wc?.vis_km ?? (om?.hourly?.visibility?.[idx] != null ? om.hourly.visibility[idx] / 1000 : null),
      dewPointC: wc?.dewpoint_c ?? om?.hourly?.dew_point_2m?.[idx] ?? null,
      isDay,
      precipitation: median(pick('precipMm')) ?? 0,
      weatherCode,
      conditionLabel: condition(weatherCode, isDay).label,
      spreadC: Math.round(spread * 10) / 10,
      consensus: readings.length > 1,
    };

    // ---- hourly: Open-Meteo, with rain probability blended with WeatherAPI where available
    let hourly = om?.hourly ?? null;
    if (hourly && wa) {
      const wmap = new Map<string, number>();
      for (const d of wa.forecast?.forecastday ?? [])
        for (const h of d.hour ?? []) wmap.set(h.time.replace(' ', 'T'), Math.max(h.chance_of_rain ?? 0, h.chance_of_snow ?? 0));
      hourly = {
        ...hourly,
        precipitation_probability: hourly.time.map((t: string, i: number) => {
          const a = hourly.precipitation_probability?.[i];
          const b = wmap.get(t);
          if (typeof a === 'number' && typeof b === 'number') return Math.round((a + b) / 2);
          return a ?? b ?? null;
        }),
      };
    }
    // Fallback if Open-Meteo is down: build hourly from WeatherAPI
    if (!hourly && wa) {
      const hs = (wa.forecast?.forecastday ?? []).flatMap((d: any) => d.hour ?? []);
      const pk = (f: (h: any) => any) => hs.map(f);
      hourly = {
        time: pk(h => h.time.replace(' ', 'T')), temperature_2m: pk(h => h.temp_c), apparent_temperature: pk(h => h.feelslike_c),
        precipitation_probability: pk(h => Math.max(h.chance_of_rain, h.chance_of_snow)), precipitation: pk(h => h.precip_mm),
        weather_code: pk(h => wapiToWmo(h.condition.code)), wind_speed_10m: pk(h => h.wind_kph), wind_gusts_10m: pk(h => h.gust_kph),
        wind_direction_10m: pk(h => h.wind_degree), relative_humidity_2m: pk(h => h.humidity), uv_index: pk(h => h.uv),
        cloud_cover: pk(h => h.cloud), visibility: pk(h => h.vis_km * 1000), dew_point_2m: pk(h => h.dewpoint_c), pressure_msl: pk(h => h.pressure_mb), is_day: pk(h => h.is_day),
      };
    }

    // ---- daily: + per-model spread for confidence, + WeatherAPI astro
    let daily = om?.daily ?? null;
    if (daily) {
      const confidence = daily.time.map((_: string, i: number) => {
        const v = MODELS.map(m => mod?.daily?.[`temperature_2m_max_${m.id}`]?.[i]).filter((x): x is number => typeof x === 'number');
        if (daily.temperature_2m_max?.[i] != null) v.push(daily.temperature_2m_max[i]);
        if (v.length < 2) return { spreadC: null, level: 'low', models: v.length };
        const mean = v.reduce((a, b) => a + b, 0) / v.length;
        const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length);
        return { spreadC: Math.round(sd * 10) / 10, level: sd < 1.5 ? 'high' : sd < 3 ? 'medium' : 'low', models: v.length };
      });
      const astro: Record<string, any> = {};
      for (const d of wa?.forecast?.forecastday ?? []) astro[d.date] = d.astro;
      daily = { ...daily, confidence, astro: daily.time.map((t: string) => astro[t] ?? null) };
    }

    const used = [
      ...(om ? ['open-meteo'] : []), ...(mod ? ['ecmwf', 'gfs', 'icon'] : []),
      ...(mn ? ['met.no'] : []), ...(wa ? ['weatherapi'] : []),
    ];
    const failed = [
      ...(!om ? ['open-meteo'] : []), ...(!mod ? ['models'] : []), ...(!mn ? ['met.no'] : []), ...(!wa ? ['weatherapi'] : []),
    ];

    return NextResponse.json({
      location: {
        name: place.name || wa?.location?.name || `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
        country: place.country || wa?.location?.country || '',
        countryCode: place.countryCode, admin: place.admin || wa?.location?.region || '', latitude, longitude,
      },
      current,
      hourly,
      daily,
      minutely_15: om?.minutely_15 ?? null,
      timezone: tz,
      sources: { used, failed, readings },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 500 });
  }
}
