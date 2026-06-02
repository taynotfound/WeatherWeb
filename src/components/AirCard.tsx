'use client';

import { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';

const TONE_COLOR: Record<string, string> = {
  good: '#9ece6a',
  fair: '#7aa2f7',
  moderate: '#e0af68',
  poor: '#ff9e64',
  'very-poor': '#f7768e',
};

export function AirCard({ lat, lon }: { lat: number; lon: number }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/air?lat=${lat}&lon=${lon}`)
      .then(r => r.json())
      .then(j => alive && !j.error && setData(j))
      .catch(() => {});
    return () => { alive = false; };
  }, [lat, lon]);

  if (!data) return null;
  const color = TONE_COLOR[data.tone] || 'var(--ink-soft)';
  return (
    <section className="card">
      <div className="card-head">
        <h2><Leaf size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} />Air quality</h2>
        <span className="muted">EU AQI</span>
      </div>
      <div className="row" style={{ alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 32, fontWeight: 600, color, letterSpacing: '-0.02em' }}>
          {data.eu_aqi != null ? Math.round(data.eu_aqi) : '—'}
        </div>
        <div style={{ color, fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{data.label}</div>
      </div>
      <div className="stats">
        {data.pm2_5 != null && <span className="stat">PM2.5 {data.pm2_5.toFixed(1)}</span>}
        {data.pm10 != null && <span className="stat">PM10 {data.pm10.toFixed(1)}</span>}
        {data.o3 != null && <span className="stat">O₃ {Math.round(data.o3)}</span>}
        {data.no2 != null && <span className="stat">NO₂ {Math.round(data.no2)}</span>}
      </div>
    </section>
  );
}
