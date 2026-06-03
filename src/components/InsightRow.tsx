'use client';

// InsightRow — pairs BestHour + RainArrival side-by-side. Decision-grade insights.

import { Sparkles, CloudRain, CloudOff, Droplets, Sun } from 'lucide-react';
import { findBestHour, rainArrival } from '@/lib/bestHour';
import { useUnits } from '@/lib/units';

type Props = {
  hourly: any;
  minutely_15: any;
  timezone?: string;
};

export function InsightRow({ hourly, minutely_15, timezone }: Props) {
  const { temp, tempUnit } = useUnits();
  const best = findBestHour(hourly, 14, 1);
  const rain = rainArrival(minutely_15);

  // Best-hour temp + condition
  let bestTemp: number | null = null;
  let bestHourLabel = '';
  if (best && hourly?.temperature_2m) {
    bestTemp = hourly.temperature_2m[best.index];
    bestHourLabel = new Date(best.iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      timeZone: timezone,
    });
  }

  return (
    <div className="insight-row">
      <article className={`insight-card insight-card--${best && best.score >= 70 ? 'good' : 'info'}`} aria-label="Best hour today">
        <div className="insight-card__label">
          <Sparkles size={11} /> best hour
        </div>
        <div className="insight-card__answer">
          {best ? bestHourLabel : '—'}
        </div>
        <div className="insight-card__sub">
          {best
            ? `${bestTemp != null ? Math.round(temp(bestTemp)) + tempUnit : ''} · ${best.reason} · score ${best.score}`
            : 'no clear winner — pretty even all day'}
        </div>
      </article>

      <article
        className={`insight-card insight-card--${rain ? (rain.rainingNow ? 'severe' : 'warn') : 'good'}`}
        aria-label="Rain outlook"
      >
        <div className="insight-card__label">
          {rain ? <CloudRain size={11} /> : <CloudOff size={11} />} rain
        </div>
        <div className="insight-card__answer">
          {rain
            ? rain.rainingNow
              ? 'now'
              : `${rain.minutes}m`
            : 'dry'}
        </div>
        <div className="insight-card__sub">
          {rain
            ? rain.rainingNow
              ? 'currently raining'
              : `expected at ${new Date(rain.iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: timezone })}`
            : 'nothing in the next 2h'}
        </div>
      </article>
    </div>
  );
}
