import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 300;

type Severity = 'minor' | 'moderate' | 'severe' | 'extreme' | 'unknown';
type Alert = {
  id: string;
  source: string;
  event: string;
  severity: Severity;
  urgency?: string;
  certainty?: string;
  headline: string;
  description?: string;
  onset?: string;
  expires?: string;
  areas?: string[];
  url?: string;
};

const SEVERITY_RANK: Record<Severity, number> = {
  extreme: 4, severe: 3, moderate: 2, minor: 1, unknown: 0,
};

function normSeverity(s: unknown): Severity {
  const v = String(s ?? '').toLowerCase();
  if (v.includes('extreme')) return 'extreme';
  if (v.includes('severe')) return 'severe';
  if (v.includes('moderate')) return 'moderate';
  if (v.includes('minor')) return 'minor';
  return 'unknown';
}

// NWS (United States)
async function fetchNWS(lat: number, lon: number): Promise<Alert[]> {
  try {
    const r = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`, {
      headers: { 'User-Agent': 'Tomato Weather (contact: marztayron@gmail.com)', Accept: 'application/geo+json' },
      next: { revalidate: 300 },
    });
    if (!r.ok) return [];
    const j = await r.json();
    const features: any[] = j?.features ?? [];
    return features.map((f) => {
      const p = f.properties ?? {};
      return {
        id: `nws:${f.id ?? p.id}`,
        source: 'NWS',
        event: p.event ?? 'Alert',
        severity: normSeverity(p.severity),
        urgency: p.urgency,
        certainty: p.certainty,
        headline: p.headline ?? p.event ?? 'Weather alert',
        description: p.description,
        onset: p.onset ?? p.effective,
        expires: p.expires ?? p.ends,
        areas: typeof p.areaDesc === 'string' ? p.areaDesc.split(';').map((s: string) => s.trim()) : [],
        url: p['@id'] ?? f.id,
      } as Alert;
    });
  } catch { return []; }
}

// Meteoalarm (EU + many partner countries via CAP feeds)
async function fetchMeteoalarm(country: string, lat: number, lon: number): Promise<Alert[]> {
  // country = ISO-2 (e.g. DE, FR, IT). Meteoalarm CAP search returns JSON.
  if (!country) return [];
  try {
    const url = `https://hp.meteoalarm.org/api/v1/warnings/feeds-search/?country=${country.toUpperCase()}&lat=${lat}&lon=${lon}`;
    const r = await fetch(url, { next: { revalidate: 600 } });
    if (!r.ok) return [];
    const j = await r.json();
    const items: any[] = j?.warnings ?? j?.items ?? j?.data ?? [];
    return items.map((it: any, i: number) => ({
      id: `ma:${country}:${it.identifier ?? it.id ?? i}`,
      source: `Meteoalarm ${country.toUpperCase()}`,
      event: it.event ?? it.type ?? 'Warning',
      severity: normSeverity(it.severity ?? it.level),
      urgency: it.urgency,
      certainty: it.certainty,
      headline: it.headline ?? it.title ?? it.event ?? 'Weather warning',
      description: it.description ?? it.instruction,
      onset: it.onset ?? it.effective ?? it.from,
      expires: it.expires ?? it.until,
      areas: Array.isArray(it.area) ? it.area : it.areaDesc ? [it.areaDesc] : [],
      url: it.web ?? it.link,
    } as Alert));
  } catch { return []; }
}

// Synthesize from Open-Meteo current/hourly weather codes (thunderstorm fallback)
async function fetchThunderstormSynth(lat: number, lon: number): Promise<Alert[]> {
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=weather_code,precipitation_probability,wind_gusts_10m&forecast_days=2&timezone=auto`,
      { next: { revalidate: 600 } }
    );
    if (!r.ok) return [];
    const j = await r.json();
    const times: string[] = j?.hourly?.time ?? [];
    const codes: number[] = j?.hourly?.weather_code ?? [];
    const gusts: number[] = j?.hourly?.wind_gusts_10m ?? [];
    const out: Alert[] = [];

    // WMO codes: 95 thunderstorm; 96 w/ slight hail; 99 w/ heavy hail
    let tsStart: string | null = null;
    let tsEnd: string | null = null;
    let worst = 0;
    for (let i = 0; i < codes.length; i++) {
      const c = codes[i];
      if (c === 95 || c === 96 || c === 99) {
        if (!tsStart) tsStart = times[i];
        tsEnd = times[i];
        if (c > worst) worst = c;
      }
    }
    if (tsStart && tsEnd) {
      const sev: Severity = worst === 99 ? 'severe' : worst === 96 ? 'moderate' : 'moderate';
      out.push({
        id: `synth:ts:${tsStart}`,
        source: 'Open-Meteo (synth)',
        event: worst === 99 ? 'Thunderstorm with heavy hail' : worst === 96 ? 'Thunderstorm with hail' : 'Thunderstorm',
        severity: sev,
        headline: 'Thunderstorm in forecast',
        description: `Convective activity expected between ${tsStart} and ${tsEnd} local time.`,
        onset: tsStart,
        expires: tsEnd,
      });
    }

    // Gust alert: >80 km/h
    const gustStart = times[gusts.findIndex((g) => g >= 80)];
    if (gustStart) {
      const peak = Math.max(...gusts.filter((g) => Number.isFinite(g)));
      out.push({
        id: `synth:gust:${gustStart}`,
        source: 'Open-Meteo (synth)',
        event: 'High wind gusts',
        severity: peak >= 110 ? 'severe' : 'moderate',
        headline: `Wind gusts up to ${Math.round(peak)} km/h expected`,
        description: 'Secure loose outdoor objects. Cycling and high-profile vehicles affected.',
        onset: gustStart,
      });
    }
    return out;
  } catch { return []; }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lon = parseFloat(searchParams.get('lon') ?? '');
  const country = (searchParams.get('country') ?? '').slice(0, 2);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: 'lat/lon required' }, { status: 400 });
  }

  const tasks: Promise<Alert[]>[] = [fetchThunderstormSynth(lat, lon)];
  if (country.toUpperCase() === 'US') tasks.push(fetchNWS(lat, lon));
  else if (country) tasks.push(fetchMeteoalarm(country, lat, lon));

  const results = (await Promise.all(tasks)).flat();
  // De-dupe by id, sort by severity desc then onset
  const map = new Map<string, Alert>();
  for (const a of results) map.set(a.id, a);
  const alerts = [...map.values()].sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
      String(a.onset ?? '').localeCompare(String(b.onset ?? ''))
  );

  return NextResponse.json(
    { count: alerts.length, alerts, generated: new Date().toISOString() },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
  );
}
