import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const WMO: Record<string, string> = {
  '0':'☀️','1':'🌤','2':'⛅','3':'☁️','45':'🌫','48':'🌫',
  '51':'🌦','53':'🌦','55':'🌧','61':'🌧','63':'🌧','65':'🌧',
  '71':'❄️','73':'❄️','75':'❄️','77':'🌨','80':'🌦','81':'🌧',
  '82':'⛈','95':'⛈','96':'⛈','99':'⛈',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const location  = searchParams.get('location') ?? 'Somewhere';
  const temp      = searchParams.get('temp') ?? '—';
  const condition = searchParams.get('condition') ?? '';
  const feelsLike = searchParams.get('feelsLike') ?? '';
  const humidity  = searchParams.get('humidity') ?? '';
  const wind      = searchParams.get('wind') ?? '';
  const code      = searchParams.get('code') ?? '0';
  const emoji     = WMO[code] ?? '🌡';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(135deg, #13111c 0%, #1a1625 50%, #0f0d17 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Left accent */}
        <div style={{
          position: 'absolute', left: 0, top: 0, width: 8, height: '100%',
          background: 'linear-gradient(180deg, #9d7cd8, #7aa2f7)',
        }} />

        {/* Stars background dots */}
        {[...Array(40)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 137.5) % 100}%`,
            top: `${(i * 97.3) % 100}%`,
            width: i % 5 === 0 ? 3 : 2,
            height: i % 5 === 0 ? 3 : 2,
            borderRadius: '50%',
            background: 'rgba(157,124,216,0.25)',
          }} />
        ))}

        {/* Main content */}
        <div style={{ display: 'flex', flex: 1, padding: '60px 80px', alignItems: 'center' }}>
          {/* Left: weather */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 140, lineHeight: 1 }}>{emoji}</div>
            <div style={{ fontSize: 160, fontWeight: 900, color: '#dcd7e8', lineHeight: 1, marginTop: 8 }}>
              {temp}
            </div>
            <div style={{ fontSize: 44, color: '#9d7cd8', marginTop: 16, fontWeight: 500 }}>
              {condition}
            </div>
          </div>

          {/* Right: location + meta */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 24 }}>
            <div style={{ fontSize: 56, fontWeight: 800, color: '#dcd7e8', textAlign: 'right', maxWidth: 480 }}>
              {location}
            </div>
            {feelsLike && (
              <div style={{ fontSize: 34, color: '#a89bc2' }}>feels like {feelsLike}</div>
            )}
            {humidity && (
              <div style={{ fontSize: 34, color: '#a89bc2' }}>{humidity}% humidity</div>
            )}
            {wind && (
              <div style={{ fontSize: 34, color: '#a89bc2' }}>{wind}</div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 80px', height: 80,
          background: 'rgba(157,124,216,0.08)',
          borderTop: '1px solid rgba(157,124,216,0.15)',
        }}>
          <div style={{ fontSize: 28, color: 'rgba(157,124,216,0.8)', fontWeight: 700 }}>
            🍅 Tomato Weather
          </div>
          <div style={{ fontSize: 24, color: 'rgba(157,124,216,0.4)' }}>
            open in browser
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
