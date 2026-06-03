'use client';

import { allScores } from '@/lib/scores';

type Props = {
  current: any;
  isDay?: boolean;
};

export function UtilityScores({ current, isDay = true }: Props) {
  if (!current) return null;
  const scores = allScores({
    tempC: current.temperatureC,
    feelsLikeC: current.feelsLikeC,
    windKmh: current.windKmh,
    gustKmh: current.windGustKmh,
    precipMm: current.precipitation,
    humidity: current.humidity,
    uv: current.uvIndex,
    cloudCover: current.cloudCover,
    isDay,
  });

  return (
    <div className="scores-grid" role="list" aria-label="Activity scores">
      {scores.map((s) => (
        <div key={s.label} className="score-chip" role="listitem">
          <div className="score-chip__top">
            <span className="score-chip__label">{s.label}</span>
            <span className="score-chip__value">{s.value}</span>
          </div>
          <div className="score-chip__verdict">
            <span>{s.emoji}</span>
            <span className="score-chip__verdict-text">{s.verdict}</span>
          </div>
          <div className="score-chip__bar">
            <div className="score-chip__bar-fill" style={{ width: `${s.value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
