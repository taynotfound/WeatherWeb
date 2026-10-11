'use client';

import { Icon } from './ui';
import { Scene } from './Scene';
import { TomatoMark, moodFor } from './Tomato';
import { condition, compass, sceneKind } from '@/lib/wx';
import { usePrefs } from '@/lib/prefs';
import { tomatoVerdict } from '@/lib/attitude';

export function Hero({ weather, place, rainSoonMin, rainingNow, className = '' }: {
  weather: any; place: string; rainSoonMin: number | null; rainingNow: boolean; className?: string;
}) {
  const { t, temp, spd, spdUnit, attitude } = usePrefs();
  const c = weather.current;
  const d = weather.daily;
  const cond = condition(c.weatherCode, c.isDay);
  const kind = sceneKind(c.weatherCode);
  const line = tomatoVerdict({
    tempC: c.temperatureC, feelsLikeC: c.feelsLikeC, precipMm: rainingNow ? Math.max(c.precipitation, 0.2) : c.precipitation,
    windKmh: c.windKmh, uv: c.uvIndex, isDay: c.isDay, weatherCode: c.weatherCode, rainSoonMin,
  }, attitude);
  const feelsDelta = (c.feelsLikeC ?? c.temperatureC) - c.temperatureC;
  const pop = d?.precipitation_probability_max?.[0];
  const dir = c.windDirection;
  const now = new Date();

  return (
    <section className={`hero ${className}`} aria-label="Current weather">
      <div className="hero-sky" style={{
        background: c.isDay
          ? 'linear-gradient(165deg, color-mix(in srgb, var(--md-primary-container) 100%, #fff 0%) 20%, color-mix(in srgb, var(--md-primary-container) 55%, var(--md-tertiary-container)) 100%)'
          : 'linear-gradient(170deg, color-mix(in srgb, var(--md-primary-container) 80%, #000) 0%, var(--md-primary-container) 75%, color-mix(in srgb, var(--md-primary-container) 70%, var(--md-tertiary-container)) 100%)',
      }} />
      <Scene kind={kind} isDay={c.isDay} />

      <div className="hero-top">
        <div style={{ minWidth: 0 }}>
          <div className="hero-loc"><Icon name="location_on" fill /><h1>{place}</h1></div>
          <p className="hero-date">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: weather.timezone })}
            {' · '}{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: weather.timezone })}
          </p>
        </div>
        {weather.sources?.readings?.length > 1 && (
          <span className="src-tag" title={`Median of ${weather.sources.readings.length} sources`}>
            <Icon name="verified" fill />{weather.sources.readings.length} sources
          </span>
        )}
      </div>

      <div className="hero-main">
        <div className="hero-temp tnum" aria-label={`${t(c.temperatureC)}`}>{Math.round(temp(c.temperatureC))}<span className="deg">°</span></div>
        <div className="hero-cond">
          <span className="lbl">{cond.label}</span>
          {d?.temperature_2m_max?.[0] != null && <span className="hl tnum">H <b>{t(d.temperature_2m_max[0])}</b> · L <b>{t(d.temperature_2m_min[0])}</b></span>}
        </div>
      </div>

      <div className="speech">
        <TomatoMark size={52} face mood={moodFor(c)} />
        <p className="bubble">{line}</p>
      </div>

      <div className="metrics">
        <div className="metric">
          <span className="k">Feels like</span>
          <span className="v tnum">{t(c.feelsLikeC)}</span>
          <span className="body-s" style={{ opacity: .75 }}>{Math.abs(feelsDelta) < 1.5 ? 'about the same' : feelsDelta < 0 ? (c.windKmh > 15 ? 'wind chill' : 'colder') : (c.humidity > 60 ? 'humid' : 'warmer')}</span>
        </div>
        <div className="metric">
          <span className="k">Wind</span>
          <span className="v tnum">
            {dir != null && <Icon name="navigation" fill style={{ transform: `rotate(${dir + 180}deg)`, transition: 'transform 800ms var(--ease-spring)' }} />}
            {spd(c.windKmh)}<small>{spdUnit}</small>
          </span>
          <span className="body-s" style={{ opacity: .75 }}>{dir != null ? `from ${compass(dir)} · ` : ''}gusts {spd(c.windGustKmh)}</span>
        </div>
        <div className="metric">
          <span className="k">Humidity</span>
          <span className="v tnum">{Math.round(c.humidity ?? 0)}<small>%</small></span>
          <span className="bar"><i style={{ width: `${Math.round(c.humidity ?? 0)}%` }} /></span>
        </div>
        <div className="metric">
          <span className="k">Rain</span>
          <span className="v">
            <Icon name={rainingNow ? 'rainy' : rainSoonMin != null ? 'umbrella' : 'water_drop'} fill />
            {rainingNow ? 'Now' : rainSoonMin != null ? `${rainSoonMin}m` : `${pop ?? 0}%`}
          </span>
          <span className="body-s" style={{ opacity: .75 }}>{rainingNow ? 'raining right now' : rainSoonMin != null ? 'until it starts' : 'chance today'}</span>
        </div>
      </div>
    </section>
  );
}
