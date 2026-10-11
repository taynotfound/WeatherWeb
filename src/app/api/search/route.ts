import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q');
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`,
      { signal: AbortSignal.timeout(6000) }
    );
    const data = await res.json();
    const results = (data.results || []).map((r: any) => ({
      id: r.id, name: r.name, country: r.country, admin: r.admin1,
      latitude: r.latitude, longitude: r.longitude, country_code: r.country_code,
    }));
    if (results.length) return NextResponse.json({ results });
  } catch {}

  // Fallback: WeatherAPI search
  const key = env.weatherApi();
  if (key) {
    try {
      const r = await fetch(`https://api.weatherapi.com/v1/search.json?key=${key}&q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(6000) });
      const j = await r.json();
      return NextResponse.json({
        results: (Array.isArray(j) ? j : []).map((x: any) => ({
          id: x.id, name: x.name, country: x.country, admin: x.region, latitude: x.lat, longitude: x.lon, country_code: '',
        })),
      });
    } catch {}
  }
  return NextResponse.json({ results: [] });
}
