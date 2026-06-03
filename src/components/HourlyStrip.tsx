'use client';

import { useState, useMemo } from 'react';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatedWeatherIcon } from './AnimatedWeatherIcon';
import { useUnits } from '@/lib/units';
import { findBestHour } from '@/lib/bestHour';

export function HourlyStrip({ weather }: { weather: any }) {
  const { temp, tempUnit } = useUnits();
  const [expanded, setExpanded] = useState(false);
  const h = weather?.hourly;
  if (!h?.time?.length) return null;

  const now = Date.now();
  const allRows = h.time
    .map((t: string, i: number) => ({
      t,
      temp: h.temperature_2m[i],
      code: h.weather_code?.[i] ?? 0,
      pop: h.precipitation_probability?.[i] ?? 0,
      idx: i,
    }))
    .filter((r: any) => new Date(r.t).getTime() >= now - 30 * 60 * 1000);

  const limit = expanded ? 48 : 10;
  const rows = allRows.slice(0, limit);

  const best = useMemo(() => findBestHour(h, 12), [h]);
  const bestTime = best?.iso;
  const tu = tempUnit.replace('°F', '°');

  return (
    <section className="card">
      <div className="card-head">
        <div className="hourly-head">
          <h2>{expanded ? `Next ${rows.length} hours` : 'Next 10 hours'}</h2>
          <button
            className="hourly-toggle"
            onClick={() => setExpanded(e => !e)}
            aria-expanded={expanded}
          >
            {expanded ? (
              <><ChevronUp size={12} /> Compact</>
            ) : (
              <><ChevronDown size={12} /> Show all 48h</>
            )}
          </button>
        </div>
      </div>
      <div className={expanded ? 'hourly hourly--grid' : 'hourly'}>
        {rows.map((r: any) => {
          const d = new Date(r.t);
          const hour = d.getHours();
          const label = hour.toString().padStart(2, '0') + ':00';
          const isMidnight = hour === 0;
          const isBest = bestTime && r.t === bestTime;
          return (
            <div
              key={r.t}
              className={`hour ${isBest ? 'hour--best' : ''} ${isMidnight ? 'hour--midnight' : ''}`}
              title={isBest ? 'Best hour to go outside' : undefined}
            >
              {isBest && <Star size={9} className="hour__star" fill="currentColor" />}
              <span className="h-time">{label}</span>
              <AnimatedWeatherIcon code={r.code} isDay={hour >= 6 && hour < 20} size={20} />
              <span className="h-temp">{Math.round(temp(r.temp))}{tu}</span>
              {r.pop >= 20 && (
                <span className="h-pop">{Math.round(r.pop)}%</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
