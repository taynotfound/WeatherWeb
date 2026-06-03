'use client';

import { useUnits } from '@/lib/units';
import { TrendingUp, TrendingDown, Minus, CloudRain, Sun, Wind } from 'lucide-react';

export function WeekSummary({ weather }: { weather: any }) {
  const { temp, tempUnit, speed, speedUnit } = useUnits();
  const d = weather?.daily;
  if (!d?.time?.length) return null;

  const tu = tempUnit.replace('°F', '°');
  const n = d.time.length;

  const meanMax = d.temperature_2m_max.reduce((a: number, b: number) => a + b, 0) / n;
  const meanMin = d.temperature_2m_min.reduce((a: number, b: number) => a + b, 0) / n;
  const totalPrecip = (d.precipitation_sum || []).reduce((a: number, b: number) => a + b, 0);
  const wetDays = (d.precipitation_probability_max || []).filter((p: number) => p >= 50).length;
  const sunnyDays = (d.weather_code || []).filter((c: number) => c <= 1).length;
  const maxWind = Math.max(...(d.wind_speed_10m_max || [0]));

  // Trend: compare first half to second half of week
  const half = Math.floor(n / 2);
  const firstMax = d.temperature_2m_max.slice(0, half).reduce((a: number, b: number) => a + b, 0) / half;
  const secondMax = d.temperature_2m_max.slice(half).reduce((a: number, b: number) => a + b, 0) / (n - half);
  const diff = secondMax - firstMax;
  const trendIcon = Math.abs(diff) < 1.5 ? Minus : diff > 0 ? TrendingUp : TrendingDown;
  const TrendIcon = trendIcon;
  const trendLabel = Math.abs(diff) < 1.5
    ? 'Steady week ahead.'
    : diff > 0
      ? `Warming up — second half ~${Math.round(temp(secondMax) - temp(firstMax))}${tu} warmer.`
      : `Cooling down — second half ~${Math.round(temp(firstMax) - temp(secondMax))}${tu} colder.`;

  // Headline mood
  let mood = 'Mild and middle-of-the-road.';
  if (sunnyDays >= 4) mood = `${sunnyDays} sunny days — go outside, you cave goblin.`;
  else if (wetDays >= 4) mood = `${wetDays} wet days — befriend an umbrella.`;
  else if (maxWind >= 50) mood = `Gusty week — peak wind around ${Math.round(speed(maxWind))} ${speedUnit}.`;
  else if (totalPrecip < 2 && sunnyDays >= 2) mood = 'Dry, pleasant week. Touch grass.';

  return (
    <section className="card week-summary">
      <div className="week-summary__verdict">
        <p className="week-summary__mood">{mood}</p>
        <p className="week-summary__trend">
          <TrendIcon size={14} />
          <span>{trendLabel}</span>
        </p>
      </div>
      <div className="week-summary__stats">
        <div className="week-stat">
          <span className="week-stat__label">avg high</span>
          <span className="week-stat__val">{Math.round(temp(meanMax))}{tu}</span>
        </div>
        <div className="week-stat">
          <span className="week-stat__label">avg low</span>
          <span className="week-stat__val">{Math.round(temp(meanMin))}{tu}</span>
        </div>
        <div className="week-stat">
          <span className="week-stat__label"><CloudRain size={11} /> rain total</span>
          <span className="week-stat__val">{totalPrecip.toFixed(1)} mm</span>
        </div>
        <div className="week-stat">
          <span className="week-stat__label"><Sun size={11} /> sunny days</span>
          <span className="week-stat__val">{sunnyDays}/{n}</span>
        </div>
        <div className="week-stat">
          <span className="week-stat__label"><Wind size={11} /> peak wind</span>
          <span className="week-stat__val">{Math.round(speed(maxWind))} {speedUnit}</span>
        </div>
      </div>
    </section>
  );
}
