'use client';

// HeroAnswerCard — the "decision in 2 seconds" card. Big temp, feels-like,
// 3h trend arrow, rain-soon answer, and one Tomato-voice verdict sentence.

import { ArrowUp, ArrowDown, ArrowRight, CloudRain, CloudOff, Droplets } from 'lucide-react';
import { AnimatedWeatherIcon } from './AnimatedWeatherIcon';
import { weatherLabel } from '@/lib/weatherIcon';
import { tomatoVerdict, type Attitude } from '@/lib/attitude';
import { useUnits } from '@/lib/units';

type Props = {
  current: any;
  hourly: any;
  rainSoonMin: number | null;
  rainingNow: boolean;
  locationName: string;
  attitude: Attitude;
};

export function HeroAnswerCard({ current, hourly, rainSoonMin, rainingNow, locationName, attitude }: Props) {
  const { temp, tempUnit } = useUnits();
  const t = current?.temperatureC;
  const feels = current?.feelsLikeC;
  const code = current?.weatherCode ?? 0;
  const isDay = current?.isDay !== false;

  // 3h trend: compare temp now vs temp in ~3 hours
  let trend: 'up' | 'down' | 'flat' | null = null;
  let delta3h: number | null = null;
  if (hourly?.temperature_2m && hourly.time && typeof t === 'number') {
    const idx3h = nearestHourIndex(hourly.time, 3);
    if (idx3h != null) {
      const v = hourly.temperature_2m[idx3h];
      if (typeof v === 'number') {
        delta3h = v - t;
        trend = Math.abs(delta3h) < 0.5 ? 'flat' : delta3h > 0 ? 'up' : 'down';
      }
    }
  }

  const verdict = tomatoVerdict({
    tempC: t,
    feelsLikeC: feels,
    precipMm: current?.precipitation,
    windKmh: current?.windKmh,
    uv: current?.uvIndex,
    isDay,
    rainSoonMin,
    weatherCode: code,
  }, attitude);

  const rainAnswer = rainingNow
    ? { text: 'raining now', tone: 'severe' as const, icon: <Droplets size={14} /> }
    : rainSoonMin != null && rainSoonMin < 60
      ? { text: `rain in ${rainSoonMin}m`, tone: 'warn' as const, icon: <CloudRain size={14} /> }
      : { text: 'dry next 2h', tone: 'good' as const, icon: <CloudOff size={14} /> };

  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : ArrowRight;

  return (
    <section className="hero-answer" aria-label="Current conditions and outlook">
      <div className="hero-answer__main">
        <div className="hero-answer__temp-wrap">
          <div className="hero-answer__location">{locationName}</div>
          <div className="hero-answer__temp">
            {typeof t === 'number' ? Math.round(temp(t)) : '—'}
            <span className="hero-answer__temp-unit">{tempUnit}</span>
          </div>
          <div className="hero-answer__feels">
            feels {typeof feels === 'number' ? Math.round(temp(feels)) : '—'}{tempUnit}
            {trend && delta3h !== null && (
              <span className={`hero-answer__trend hero-answer__trend--${trend}`}>
                <TrendIcon size={12} />
                {trend === 'flat' ? 'steady 3h' : `${delta3h > 0 ? '+' : ''}${Math.round(temp(t! + delta3h) - temp(t!))}° in 3h`}
              </span>
            )}
          </div>
        </div>
        <div className="hero-answer__icon">
          <AnimatedWeatherIcon code={code} isDay={isDay} size={88} />
          <div className="hero-answer__label">{weatherLabel(code)}</div>
        </div>
      </div>
      <div className="hero-answer__chips">
        <span className={`pill pill--${rainAnswer.tone} hero-answer__chip`}>
          {rainAnswer.icon}
          {rainAnswer.text}
        </span>
      </div>
      <p className="hero-answer__verdict">{verdict}</p>
    </section>
  );
}

function nearestHourIndex(times: string[], hoursAhead: number): number | null {
  const target = Date.now() + hoursAhead * 3_600_000;
  let best = -1;
  let bestDist = Infinity;
  for (let i = 0; i < times.length; i++) {
    const d = Math.abs(new Date(times[i]).getTime() - target);
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return best >= 0 ? best : null;
}
