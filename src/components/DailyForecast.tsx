'use client';

import { useMemo, useState } from 'react';
import { weatherLabel } from '@/lib/weatherIcon';
import { AnimatedWeatherIcon } from './AnimatedWeatherIcon';
import { useUnits } from '@/lib/units';
import { ConfidenceBadge } from './ConfidenceBadge';
import { Droplets, Wind, Sun, ThermometerSun, ThermometerSnowflake, CloudRain } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Pick a short, opinionated headline for a day. */
function dayVerdict(t: { max: number; min: number; pop: number; code: number; wind: number; uv: number }) {
  if (t.pop >= 70) return { tone: 'wet', label: 'Wet & moody' };
  if (t.pop >= 40) return { tone: 'wet', label: 'Showery patches' };
  if (t.max >= 30) return { tone: 'hot', label: 'Genuinely hot' };
  if (t.max >= 25 && t.uv >= 6) return { tone: 'hot', label: 'Sunscreen weather' };
  if (t.max <= 0) return { tone: 'cold', label: 'Below freezing' };
  if (t.max <= 5) return { tone: 'cold', label: 'Bundle up' };
  if (t.wind >= 40) return { tone: 'wind', label: 'Windy day' };
  if (t.code === 0 || t.code === 1) return { tone: 'sun', label: 'Crisp & clear' };
  return { tone: 'mild', label: 'Mild & uneventful' };
}

export function DailyForecast({ weather, lat, lon }: { weather: any; lat?: number; lon?: number }) {
  const { temp, tempUnit, speed, speedUnit } = useUnits();
  const d = weather?.daily;
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  if (!d?.time?.length) return null;

  const allMin = Math.min(...d.temperature_2m_min);
  const allMax = Math.max(...d.temperature_2m_max);
  const span = Math.max(1, allMax - allMin);
  const tu = tempUnit.replace('°F', '°');

  // Build sparkline for week temps
  const sparkW = 280, sparkH = 60, pad = 4;
  const sparkPoints = useMemo(() => {
    return d.time.map((_t: string, i: number) => {
      const mid = (d.temperature_2m_min[i] + d.temperature_2m_max[i]) / 2;
      const x = pad + (i / (d.time.length - 1)) * (sparkW - pad * 2);
      const y = pad + (1 - (mid - allMin) / span) * (sparkH - pad * 2);
      return [x, y] as const;
    });
  }, [d, allMin, span]);

  const sparkPath = sparkPoints.map((p: readonly [number, number], i: number) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const sparkArea = `${sparkPath} L${sparkPoints[sparkPoints.length - 1][0]},${sparkH} L${sparkPoints[0][0]},${sparkH} Z`;

  const weekHi = Math.max(...d.temperature_2m_max);
  const weekLo = Math.min(...d.temperature_2m_min);
  const weekHiIdx = d.temperature_2m_max.indexOf(weekHi);
  const weekLoIdx = d.temperature_2m_min.indexOf(weekLo);
  const wettest = d.precipitation_probability_max
    ? d.precipitation_probability_max.indexOf(Math.max(...d.precipitation_probability_max))
    : -1;

  return (
    <section className="card forecast-card">
      <div className="card-head forecast-head">
        <h2>7-day outlook</h2>
        <div className="forecast-meta">
          <span className="forecast-meta__chip"><ThermometerSun size={12} /> hi {Math.round(temp(weekHi))}{tu}</span>
          <span className="forecast-meta__chip"><ThermometerSnowflake size={12} /> lo {Math.round(temp(weekLo))}{tu}</span>
          {wettest >= 0 && d.precipitation_probability_max[wettest] >= 30 && (
            <span className="forecast-meta__chip forecast-meta__chip--wet">
              <CloudRain size={12} /> wettest {DAYS[new Date(d.time[wettest]).getDay()]}
            </span>
          )}
        </div>
      </div>

      {/* Week sparkline */}
      <div className="forecast-spark">
        <svg viewBox={`0 0 ${sparkW} ${sparkH}`} preserveAspectRatio="none" style={{ width: '100%', height: sparkH }}>
          <defs>
            <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9d7cd8" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#9d7cd8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={sparkArea} fill="url(#spark-fill)" />
          <path d={sparkPath} fill="none" stroke="#9d7cd8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {sparkPoints.map((p: readonly [number, number], i: number) => {
            const isHi = i === weekHiIdx;
            const isLo = i === weekLoIdx;
            return (
              <g key={i}>
                <circle cx={p[0]} cy={p[1]} r={isHi || isLo ? 3.5 : 2} fill={isHi ? '#ff9e64' : isLo ? '#7aa2f7' : '#9d7cd8'} />
                {(isHi || isLo) && (
                  <text x={p[0]} y={p[1] - 6} textAnchor="middle" fontSize={9} fill={isHi ? '#ff9e64' : '#7aa2f7'} fontFamily="ui-monospace, monospace">
                    {Math.round(temp(isHi ? weekHi : weekLo))}°
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="daily daily--rich">
        {d.time.map((t: string, i: number) => {
          const date = new Date(t);
          const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAYS[date.getDay()];
          const min = d.temperature_2m_min[i];
          const max = d.temperature_2m_max[i];
          const code = d.weather_code?.[i] ?? 0;
          const left = ((min - allMin) / span) * 100;
          const width = ((max - min) / span) * 100;
          const pop = d.precipitation_probability_max?.[i] ?? 0;
          const precip = d.precipitation_sum?.[i] ?? 0;
          const wind = d.wind_speed_10m_max?.[i] ?? 0;
          const gusts = d.wind_gusts_10m_max?.[i] ?? 0;
          const uv = d.uv_index_max?.[i] ?? 0;
          const sunrise = d.sunrise?.[i];
          const sunset = d.sunset?.[i];
          const verdict = dayVerdict({ max, min, pop, code, wind, uv });
          const isOpen = openIdx === i;

          return (
            <div key={t} className={`daily-row daily-row--rich ${isOpen ? 'is-open' : ''}`}>
              <button
                className="daily-row__head"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <div className="daily-day">
                  <span className="daily-day__name">{dayName}</span>
                  <span className="daily-day__date">{fmtDate(date)}</span>
                  {lat != null && lon != null && <ConfidenceBadge lat={lat} lon={lon} date={t} />}
                </div>
                <div className="daily-icon"><AnimatedWeatherIcon code={code} isDay={true} size={22} /></div>
                <div className="daily-mid">
                  <span className={`daily-verdict daily-verdict--${verdict.tone}`}>{verdict.label}</span>
                  {pop >= 30 && (
                    <span className="daily-pop"><Droplets size={11} /> {Math.round(pop)}%</span>
                  )}
                </div>
                <div className="daily-bar daily-bar--rich">
                  <span style={{ left: `${left}%`, width: `${Math.max(4, width)}%` }} />
                </div>
                <div className="daily-temps">
                  <span className="lo">{Math.round(temp(min))}{tu}</span>
                  <span className="hi">{Math.round(temp(max))}{tu}</span>
                </div>
              </button>

              {isOpen && (
                <div className="daily-row__body">
                  <div className="daily-detail">
                    <span className="daily-detail__label">Condition</span>
                    <span className="daily-detail__val">{weatherLabel(code)}</span>
                  </div>
                  <div className="daily-detail">
                    <span className="daily-detail__label">Rain chance</span>
                    <span className="daily-detail__val">{Math.round(pop)}% · {precip.toFixed(1)} mm</span>
                  </div>
                  <div className="daily-detail">
                    <span className="daily-detail__label">Wind</span>
                    <span className="daily-detail__val">
                      <Wind size={11} /> {Math.round(speed(wind))} {speedUnit}
                      {gusts > 0 && <span className="daily-detail__sub"> · gusts {Math.round(speed(gusts))}</span>}
                    </span>
                  </div>
                  <div className="daily-detail">
                    <span className="daily-detail__label">UV</span>
                    <span className="daily-detail__val">
                      <Sun size={11} /> {uv.toFixed(1)}
                      <span className="daily-detail__sub">
                        {uv < 3 ? ' · low' : uv < 6 ? ' · moderate' : uv < 8 ? ' · high' : uv < 11 ? ' · very high' : ' · extreme'}
                      </span>
                    </span>
                  </div>
                  {sunrise && sunset && (
                    <div className="daily-detail daily-detail--wide">
                      <span className="daily-detail__label">Sun</span>
                      <span className="daily-detail__val">
                        ↑ {new Date(sunrise).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        ↓ {new Date(sunset).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
