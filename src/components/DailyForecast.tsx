'use client';

import { weatherIcon, weatherLabel } from '@/lib/weatherIcon';
import { useUnits } from '@/lib/units';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function DailyForecast({ weather }: { weather: any }) {
  const { temp, tempUnit } = useUnits();
  const d = weather?.daily;
  if (!d?.time?.length) return null;

  const allMin = Math.min(...d.temperature_2m_min);
  const allMax = Math.max(...d.temperature_2m_max);
  const span = Math.max(1, allMax - allMin);
  const tu = tempUnit.replace('°F', '°');

  return (
    <section className="card">
      <div className="card-head"><h2>7-day forecast</h2></div>
      <div className="daily">
        {d.time.map((t: string, i: number) => {
          const date = new Date(t);
          const dayName = i === 0 ? 'Today' : DAYS[date.getDay()];
          const min = d.temperature_2m_min[i];
          const max = d.temperature_2m_max[i];
          const code = d.weather_code?.[i] ?? 0;
          const Icon = weatherIcon(code, true);
          const left = ((min - allMin) / span) * 100;
          const width = ((max - min) / span) * 100;
          const pop = d.precipitation_probability_max?.[i] ?? 0;
          return (
            <div key={t} className="daily-row" title={weatherLabel(code)}>
              <div className="daily-day">
                {dayName}
                {pop >= 30 && (
                  <span style={{ display: 'block', fontSize: 10, color: 'var(--secondary)', fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(pop)}%
                  </span>
                )}
              </div>
              <div className="daily-icon"><Icon size={18} strokeWidth={1.6} /></div>
              <div className="daily-bar"><span style={{ left: `${left}%`, width: `${Math.max(4, width)}%` }} /></div>
              <div className="daily-temps">
                <span className="lo">{Math.round(temp(min))}{tu}</span>
                <span>{Math.round(temp(max))}{tu}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
