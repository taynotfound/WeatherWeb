import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const WMO: Record<string, string> = {
  '0':'☀️','1':'🌤','2':'⛅','3':'☁️','45':'🌫','48':'🌫',
  '51':'🌦','53':'🌦','55':'🌧','61':'🌧','63':'🌧','65':'🌧',
  '71':'❄️','73':'❄️','75':'❄️','77':'🌨','80':'🌦','81':'🌧',
  '82':'⛈','95':'⛈','96':'⛈','99':'⛈',
};

const TAGLINES = [
  'weather, with attitude',
  'your sky, decoded',
  'rain forecasts that don\'t lie',
  'the only weather app with opinions',
  'sass-powered meteorology',
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hasData    = searchParams.has('temp') || searchParams.has('location');
  const location   = searchParams.get('location') || '';
  const temp       = searchParams.get('temp') || '';
  const condition  = searchParams.get('condition') || '';
  const feelsLike  = searchParams.get('feelsLike') || '';
  const humidity   = searchParams.get('humidity') || '';
  const wind       = searchParams.get('wind') || '';
  const code       = searchParams.get('code') || '0';
  const tagline    = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
  const emoji      = WMO[code] ?? '🍅';

  // Default (no params) — brand card with mascot energy
  if (!hasData) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            background: 'linear-gradient(135deg, #14111c 0%, #1a1625 45%, #0f0d17 100%)',
            fontFamily: 'system-ui, sans-serif',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Aurora glows */}
          <div style={{ position: 'absolute', top: -100, left: -100, width: 500, height: 500,
            background: 'radial-gradient(circle, rgba(157,124,216,0.35), transparent 65%)' }} />
          <div style={{ position: 'absolute', bottom: -120, right: -80, width: 460, height: 460,
            background: 'radial-gradient(circle, rgba(122,162,247,0.28), transparent 65%)' }} />
          <div style={{ position: 'absolute', top: '40%', right: '30%', width: 280, height: 280,
            background: 'radial-gradient(circle, rgba(255,158,100,0.18), transparent 70%)' }} />

          {/* Stars */}
          {[...Array(60)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${(i * 137.508) % 100}%`,
              top: `${(i * 73.31) % 100}%`,
              width: i % 7 === 0 ? 4 : 2,
              height: i % 7 === 0 ? 4 : 2,
              borderRadius: '50%',
              background: i % 5 === 0 ? 'rgba(255,158,100,0.45)' : 'rgba(220,215,232,0.32)',
            }} />
          ))}

          {/* Left accent rail */}
          <div style={{
            position: 'absolute', left: 0, top: 0, width: 10, height: '100%',
            background: 'linear-gradient(180deg, #9d7cd8, #7aa2f7, #ff9e64)',
          }} />

          {/* Center stage */}
          <div style={{
            display: 'flex', flex: 1, flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '60px 80px',
          }}>
            <div style={{ fontSize: 220, lineHeight: 1, marginBottom: 8, filter: 'drop-shadow(0 8px 32px rgba(255,158,100,0.4))' }}>
              🍅
            </div>
            <div style={{
              fontSize: 116, fontWeight: 900, letterSpacing: '-2px',
              lineHeight: 1, marginTop: 8,
              backgroundImage: 'linear-gradient(135deg, #dcd7e8 0%, #9d7cd8 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}>
              Tomato
            </div>
            <div style={{ fontSize: 36, color: '#9d7cd8', marginTop: 18, fontStyle: 'italic', letterSpacing: '0.5px' }}>
              {tagline}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 40, fontSize: 28 }}>
              <span style={{ padding: '8px 16px', background: 'rgba(157,124,216,0.12)', border: '1px solid rgba(157,124,216,0.25)', borderRadius: 999, color: '#dcd7e8' }}>📍 hourly forecast</span>
              <span style={{ padding: '8px 16px', background: 'rgba(122,162,247,0.12)', border: '1px solid rgba(122,162,247,0.25)', borderRadius: 999, color: '#dcd7e8' }}>🌧 rain nowcast</span>
              <span style={{ padding: '8px 16px', background: 'rgba(255,158,100,0.12)', border: '1px solid rgba(255,158,100,0.25)', borderRadius: 999, color: '#dcd7e8' }}>⛈ severe alerts</span>
            </div>
          </div>

          {/* Bottom strip */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 80px', height: 80,
            background: 'rgba(157,124,216,0.06)',
            borderTop: '1px solid rgba(157,124,216,0.18)',
          }}>
            <div style={{ fontSize: 26, color: 'rgba(220,215,232,0.75)', fontWeight: 600 }}>
              🍅 Tomato Weather
            </div>
            <div style={{ fontSize: 22, color: 'rgba(157,124,216,0.5)' }}>
              built by Tay · open data
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // Data card — when sharing a specific location
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
        <div style={{ position: 'absolute', top: -80, right: -80, width: 380, height: 380,
          background: 'radial-gradient(circle, rgba(157,124,216,0.25), transparent 65%)' }} />
        <div style={{
          position: 'absolute', left: 0, top: 0, width: 8, height: '100%',
          background: 'linear-gradient(180deg, #9d7cd8, #7aa2f7)',
        }} />
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
        <div style={{ display: 'flex', flex: 1, padding: '60px 80px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 140, lineHeight: 1 }}>{emoji}</div>
            <div style={{ fontSize: 160, fontWeight: 900, color: '#dcd7e8', lineHeight: 1, marginTop: 8 }}>
              {temp || '—'}
            </div>
            {condition && (
              <div style={{ fontSize: 44, color: '#9d7cd8', marginTop: 16, fontWeight: 500 }}>
                {condition}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 24 }}>
            {location && (
              <div style={{ fontSize: 56, fontWeight: 800, color: '#dcd7e8', textAlign: 'right', maxWidth: 480 }}>
                {location}
              </div>
            )}
            {feelsLike && <div style={{ fontSize: 34, color: '#a89bc2' }}>feels like {feelsLike}</div>}
            {humidity  && <div style={{ fontSize: 34, color: '#a89bc2' }}>{humidity}% humidity</div>}
            {wind      && <div style={{ fontSize: 34, color: '#a89bc2' }}>{wind}</div>}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 80px', height: 80,
          background: 'rgba(157,124,216,0.08)',
          borderTop: '1px solid rgba(157,124,216,0.15)',
        }}>
          <div style={{ fontSize: 28, color: 'rgba(157,124,216,0.8)', fontWeight: 700 }}>
            🍅 Tomato Weather
          </div>
          <div style={{ fontSize: 22, color: 'rgba(157,124,216,0.5)', fontStyle: 'italic' }}>
            {tagline}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
