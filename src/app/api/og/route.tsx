import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { moodFor, rabbitDoc, type Mood } from '@/lib/rabbit';
import { condition } from '@/lib/wx';
import { tomatoVerdict } from '@/lib/attitude';


const svgUri = (svg: string) => 'data:image/svg+xml;base64,' + btoa(svg);
const MARK = svgUri(rabbitDoc({ id: 'mk' }));
const mascot = (mood: Mood) => svgUri(rabbitDoc({ id: 'ms', face: true, mood, whiskers: true }));

const BG = 'linear-gradient(135deg, #2a1310 0%, #1b0f0e 55%, #120b0b 100%)';
const CREAM = '#ffe9e2';
const MUTED = 'rgba(255,218,210,0.66)';
const RED = '#ff6a52';

type Now = { tempC: number; feelsC: number; code: number; isDay: boolean; hiC?: number; loC?: number; windKmh: number; precip: number; humidity: number };

async function live(lat: number, lon: number): Promise<Now | null> {
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      '&current=temperature_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,precipitation,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto',
      { signal: AbortSignal.timeout(4000), next: { revalidate: 600 } });
    const j = await r.json();
    const c = j.current;
    return { tempC: c.temperature_2m, feelsC: c.apparent_temperature, code: c.weather_code, isDay: !!c.is_day, hiC: j.daily?.temperature_2m_max?.[0], loC: j.daily?.temperature_2m_min?.[0], windKmh: c.wind_speed_10m, precip: c.precipitation, humidity: c.relative_humidity_2m };
  } catch { return null; }
}

function Footer() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 72px', height: 84, borderTop: '1px solid rgba(255,106,82,0.18)', background: 'rgba(255,106,82,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 28, color: CREAM, fontWeight: 700 }}>
        <img src={MARK} width={44} height={44} alt="" />Tomato Weather
      </div>
      <div style={{ fontSize: 22, color: MUTED }}>six sources · radar · a rabbit with opinions</div>
    </div>
  );
}

export async function GET(req: NextRequest) {
  const p = new URL(req.url).searchParams;
  const lat = parseFloat(p.get('lat') ?? ''), lon = parseFloat(p.get('lon') ?? '');
  const imperial = p.get('u') === 'f';
  const name = (p.get('name') || p.get('location') || '').slice(0, 40);
  const now = isFinite(lat) && isFinite(lon) ? await live(lat, lon) : null;
  const T = (c?: number) => (c == null ? '–' : `${Math.round(imperial ? c * 9 / 5 + 32 : c)}°`);
  const headers = { 'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=3600' };

  // Brand card: no place, or the weather lookup failed
  if (!now) {
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: BG, fontFamily: 'sans-serif', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -160, right: -120, width: 620, height: 620, display: 'flex', background: 'radial-gradient(circle, rgba(255,106,82,0.32), transparent 65%)' }} />
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', padding: '0 80px', gap: 56 }}>
            <img src={mascot('shades')} width={320} height={320} alt="" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 132, fontWeight: 900, color: CREAM, letterSpacing: '-3px', lineHeight: 1 }}>Tomato</div>
              <div style={{ fontSize: 40, color: RED, marginTop: 18, fontWeight: 600 }}>weather, with attitude</div>
              <div style={{ fontSize: 28, color: MUTED, marginTop: 26, maxWidth: 560, lineHeight: 1.35 }}>{name ? `The forecast for ${name}, from a red rabbit with opinions.` : 'Six weather sources, live radar and a red rabbit who tells you what to wear.'}</div>
            </div>
          </div>
          <Footer />
        </div>
      ),
      { width: 1200, height: 630, headers }
    );
  }

  const cond = condition(now.code, now.isDay);
  const mood = moodFor({ weatherCode: now.code, isDay: now.isDay, temperatureC: now.tempC, feelsLikeC: now.feelsC, precipitation: now.precip });
  const line = tomatoVerdict({ tempC: now.tempC, feelsLikeC: now.feelsC, precipMm: now.precip, windKmh: now.windKmh, isDay: now.isDay, weatherCode: now.code }, 'rude');

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: BG, fontFamily: 'sans-serif', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -140, right: -60, width: 600, height: 600, display: 'flex', background: 'radial-gradient(circle, rgba(255,106,82,0.30), transparent 65%)' }} />
        <div style={{ display: 'flex', flex: 1, padding: '56px 72px 40px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 50, fontWeight: 800, color: CREAM, maxWidth: 640 }}>{name || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`}</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 6 }}>
              <div style={{ fontSize: 200, fontWeight: 900, color: CREAM, lineHeight: 1, letterSpacing: '-8px' }}>{T(now.tempC)}</div>
            </div>
            <div style={{ fontSize: 44, color: RED, fontWeight: 700, marginTop: 4 }}>{cond.label}</div>
            <div style={{ display: 'flex', gap: 28, fontSize: 28, color: MUTED, marginTop: 18 }}>
              <span>H {T(now.hiC)} · L {T(now.loC)}</span><span>Feels {T(now.feelsC)}</span><span>{Math.round(now.humidity)}% humid</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 380 }}>
            <div style={{ display: 'flex', background: 'rgba(255,233,226,0.95)', color: '#3e0b04', fontSize: 27, fontWeight: 600, lineHeight: 1.3, padding: '18px 24px', borderRadius: '28px 28px 28px 8px', maxWidth: 380 }}>{line}</div>
            <img src={mascot(mood)} width={270} height={270} alt="" style={{ marginTop: 10 }} />
          </div>
        </div>
        <Footer />
      </div>
    ),
    { width: 1200, height: 630, headers }
  );
}
