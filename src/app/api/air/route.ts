import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 1800;

const URL_AQ = 'https://air-quality-api.open-meteo.com/v1/air-quality';

function aqiLabel(eu: number): { label: string; tone: 'good' | 'fair' | 'moderate' | 'poor' | 'very-poor' } {
  if (eu == null || isNaN(eu)) return { label: 'unknown', tone: 'fair' };
  if (eu <= 20) return { label: 'good', tone: 'good' };
  if (eu <= 40) return { label: 'fair', tone: 'fair' };
  if (eu <= 60) return { label: 'moderate', tone: 'moderate' };
  if (eu <= 80) return { label: 'poor', tone: 'poor' };
  return { label: 'very poor', tone: 'very-poor' };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '');
  const lon = parseFloat(searchParams.get('lon') || '');
  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'lat & lon required' }, { status: 400 });
  }
  try {
    const url =
      `${URL_AQ}?latitude=${lat}&longitude=${lon}` +
      `&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone` +
      `&timezone=auto`;
    const r = await fetch(url, { next: { revalidate: 1800 } });
    if (!r.ok) throw new Error(`air-quality ${r.status}`);
    const j = await r.json();
    const c = j?.current || {};
    const meta = aqiLabel(c.european_aqi);
    return NextResponse.json({
      time: c.time,
      eu_aqi: c.european_aqi ?? null,
      us_aqi: c.us_aqi ?? null,
      pm2_5: c.pm2_5 ?? null,
      pm10: c.pm10 ?? null,
      o3: c.ozone ?? null,
      no2: c.nitrogen_dioxide ?? null,
      so2: c.sulphur_dioxide ?? null,
      co: c.carbon_monoxide ?? null,
      label: meta.label,
      tone: meta.tone,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 500 });
  }
}
