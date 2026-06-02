'use client';

import { AnimatedWeatherIcon } from './AnimatedWeatherIcon';
import { useUnits } from '@/lib/units';

export function HourlyStrip({ weather }: { weather: any }) {
  const { temp, tempUnit } = useUnits();
  const h = weather?.hourly;
  if (!h?.time?.length) return null;
  const now = Date.now();
  const rows = h.time
    .map((t: string, i: number) => ({
      t,
      temp: h.temperature_2m[i],
      code: h.weather_code?.[i] ?? 0,
      pop: h.precipitation_probability?.[i] ?? 0,
      isDay: true,
    }))
    .filter((r: any) => new Date(r.t).getTime() >= now - 30 * 60 * 1000)
    .slice(0, 24);

  return (
    <section className="card">
      <div className="card-head">
        <h2>Next 24 hours</h2>
      </div>
      <div className="hourly">
        {rows.map((r: any) => {
          const d = new Date(r.t);
          const label = d.getHours().toString().padStart(2, '0') + ':00';
          return (
            <div key={r.t} className="hour">
              <span className="h-time">{label}</span>
              <AnimatedWeatherIcon code={r.code} isDay={r.isDay} size={20} />
              <span className="h-temp">{Math.round(temp(r.temp))}{tempUnit.replace('°F','°')}</span>
              {r.pop >= 20 && (
                <span style={{ fontSize: 10, color: 'var(--secondary)' }}>{Math.round(r.pop)}%</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
