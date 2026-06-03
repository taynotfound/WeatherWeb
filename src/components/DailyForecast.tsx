'use client';

import { weatherLabel } from '@/lib/weatherIcon';
import { AnimatedWeatherIcon } from './AnimatedWeatherIcon';
import { useUnits } from '@/lib/units';
import { ConfidenceBadge } from './ConfidenceBadge';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function DailyForecast({ weather, lat, lon }: { weather: any; lat?: number; lon?: number }) {
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
          const left = ((min - allMin) / span) * 100;
          const width = ((max - min) / span) * 100;
          const pop = d.precipitation_probability_max?.[i] ?? 0;
          return (
            <div key={t} className="daily-row" title={weatherLabel(code)}>
              <div className="daily-day">
                <span className="daily-day__name">{dayName}</span>
                {lat != null && lon != null && <ConfidenceBadge lat={lat} lon={lon} date={t} />}
                {pop >= 30 && (
                  <span className="daily-day__pop">{Math.round(pop)}% rain</span>
                )}
              </div>
              <div className="daily-icon"><AnimatedWeatherIcon code={code} isDay={true} size={18} /></div>
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
