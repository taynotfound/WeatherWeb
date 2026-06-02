import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q');
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`
    );
    const data = await res.json();
    const results = (data.results || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      country: r.country,
      admin: r.admin1,
      latitude: r.latitude,
      longitude: r.longitude,
      country_code: r.country_code,
    }));
    return NextResponse.json({ results });
  } catch (e: any) {
    return NextResponse.json({ results: [], error: e?.message }, { status: 500 });
  }
}
