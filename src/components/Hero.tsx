'use client';

import { Icon } from './ui';
import { Scene } from './Scene';
import { condition, compass, sceneKind } from '@/lib/wx';
import { usePrefs } from '@/lib/prefs';
import { tomatoVerdict } from '@/lib/attitude';

export function Hero({ weather, place, rainSoonMin, rainingNow, daily0 }: {
  weather: any; place: string; rainSoonMin: number | null; rainingNow: boolean; daily0?: { max?: number; min?: number };
}) {
  const { t, spd, spdUnit, attitude } = usePrefs();
  const c = weather.current;
  const cond = condition(c.weatherCode, c.isDay);
  const kind = sceneKind(c.weatherCode);
  const line = tomatoVerdict({
    tempC: c.temperatureC, feelsLikeC: c.feelsLikeC, precipMm: rainingNow ? Math.max(c.precipitation, 0.2) : c.precipitation,
    windKmh: c.windKmh, uv: c.uvIndex, isDay: c.isDay, weatherCode: c.weatherCode, rainSoonMin,
  }, attitude);
  const feelsDiff = Math.abs((c.feelsLikeC ?? 0) - (c.temperatureC ?? 0)) >= 1.5;

  return (
    <section className="hero" aria-label="Current weather">
      <Scene kind={kind} isDay={c.isDay} />
      <div className="hero-top">
        <div>
          <div className="hero-loc">
            <Icon name="location_on" fill />
            <h1 className="title-l">{place}</h1>
          </div>
          <p className="body-m" style={{ opacity: .75, marginTop: 2 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: weather.timezone })}
          </p>
        </div>
        {weather.sources?.used?.length > 1 && (
          <span className="hero-stat" title={`Median of ${weather.sources.readings.length} sources`}>
            <Icon name="verified" fill />{weather.sources.readings.length} sources
          </span>
        )}
      </div>

      <div>
        <div className="hero-temp tnum" aria-label={`${t(c.temperatureC)} degrees`}>
          <span>{t(c.temperatureC).replace('°', '')}</span><sup>°</sup>
        </div>
        <div className="hero-cond">
          <Icon name={cond.icon} />
          <span className="headline-s">{cond.label}</span>
          {daily0?.max != null && <span className="title-m" style={{ marginLeft: 'auto', opacity: .8 }}>H {t(daily0.max)} · L {t(daily0.min)}</span>}
        </div>
        <p className="hero-line">{line}</p>
        <div className="hero-stats">
          {feelsDiff && <span className="hero-stat"><Icon name="thermostat" />Feels {t(c.feelsLikeC)}</span>}
          <span className="hero-stat"><Icon name="air" />{spd(c.windKmh)} {spdUnit} {c.windDirection != null ? compass(c.windDirection) : ''}</span>
          <span className="hero-stat"><Icon name="humidity_percentage" />{Math.round(c.humidity ?? 0)}%</span>
          {rainingNow && <span className="hero-stat"><Icon name="rainy" />Raining now</span>}
          {!rainingNow && rainSoonMin != null && <span className="hero-stat"><Icon name="umbrella" />Rain in {rainSoonMin} min</span>}
        </div>
      </div>
    </section>
  );
}
