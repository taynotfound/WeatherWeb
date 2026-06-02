'use client';

// Inline SVG sparkline: actual temp (solid) vs feels-like (dashed), 24h
export function FeelsSparkline({ weather, temp }: { weather: any; temp: (c: number) => number }) {
  const h = weather?.hourly;
  if (!h?.time?.length) return null;

  const now = Date.now();
  const rows = h.time
    .map((t: string, i: number) => ({
      t,
      actual: h.temperature_2m?.[i] ?? null,
      feels: h.apparent_temperature?.[i] ?? null,
    }))
    .filter((r: any) => new Date(r.t).getTime() >= now - 30 * 60 * 1000)
    .slice(0, 24)
    .filter((r: any) => r.actual != null && r.feels != null);

  if (rows.length < 3) return null;

  const actuals = rows.map((r: any) => temp(r.actual));
  const feels = rows.map((r: any) => temp(r.feels));
  const all = [...actuals, ...feels];
  const minV = Math.min(...all);
  const maxV = Math.max(...all);
  const range = Math.max(1, maxV - minV);

  const W = 240, H = 36, pad = 3;
  const n = rows.length;
  const x = (i: number) => pad + (i / (n - 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - ((v - minV) / range) * (H - pad * 2);

  const pathActual = actuals.map((v: number, i: number) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const pathFeels = feels.map((v: number, i: number) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');

  // current divergence
  const lastActual = actuals[actuals.length - 1];
  const lastFeels = feels[feels.length - 1];
  const diff = Math.round(lastFeels - lastActual);
  const sign = diff > 0 ? '+' : '';

  return (
    <div className="feels-sparkline">
      <svg viewBox={`0 0 ${W} ${H}`} className="feels-svg" aria-hidden>
        <path d={pathActual} fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pathFeels} fill="none" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2" />
      </svg>
      <div className="feels-legend">
        <span style={{ color: 'var(--primary)' }}>actual</span>
        <span style={{ color: 'var(--secondary)' }}>feels</span>
        {diff !== 0 && (
          <span style={{ color: diff < -2 ? '#7aa2f7' : diff > 2 ? '#ff9e64' : 'var(--ink-mute)', marginLeft: 4 }}>
            {sign}{diff}°
          </span>
        )}
      </div>
    </div>
  );
}
