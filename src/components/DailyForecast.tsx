'use client';

import { useMemo, useState } from 'react';
import { weatherLabel } from '@/lib/weatherIcon';
import { AnimatedWeatherIcon } from './AnimatedWeatherIcon';
import { useUnits } from '@/lib/units';
import { ConfidenceBadge } from './ConfidenceBadge';
import { Droplets, Wind, Sun, ThermometerSun, ThermometerSnowflake, CloudRain, ChevronDown } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

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

type Props = { weather: any; lat?: number; lon?: number };

export function DailyForecast({ weather, lat, lon }: Props) {
  const { temp, tempUnit, speed, speedUnit } = useUnits();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  // ⚠️ All hooks must run before any conditional return
  const d = weather?.daily;
  const allMin = useMemo(() => (d?.temperature_2m_min?.length ? Math.min(...d.temperature_2m_min) : 0), [d]);
  const allMax = useMemo(() => (d?.temperature_2m_max?.length ? Math.max(...d.temperature_2m_max) : 1), [d]);
  const span = Math.max(1, allMax - allMin);
  const tu = tempUnit.replace('°F', '°');

  const sparkPoints = useMemo(() => {
    if (!d?.time?.length) return [];
    const sparkW = 560, sparkH = 80, pad = 8;
    return d.time.map((_t: string, i: number) => {
      const mid = (d.temperature_2m_min[i] + d.temperature_2m_max[i]) / 2;
      const x = pad + (i / Math.max(1, d.time.length - 1)) * (sparkW - pad * 2);
      const y = pad + (1 - (mid - allMin) / span) * (sparkH - pad * 2);
      return [x, y] as [number, number];
    });
  }, [d, allMin, span]);

  const weekHi = useMemo(() => (d?.temperature_2m_max?.length ? Math.max(...d.temperature_2m_max) : 0), [d]);
  const weekLo = useMemo(() => (d?.temperature_2m_min?.length ? Math.min(...d.temperature_2m_min) : 0), [d]);

  if (!d?.time?.length) return null;

  const sparkW = 560, sparkH = 80;
  const weekHiIdx = d.temperature_2m_max.indexOf(weekHi);
  const weekLoIdx = d.temperature_2m_min.indexOf(weekLo);
  const wettestPop = d.precipitation_probability_max ? Math.max(...d.precipitation_probability_max) : 0;
  const wettest = d.precipitation_probability_max ? d.precipitation_probability_max.indexOf(wettestPop) : -1;

  const sparkPath = sparkPoints.map((p: [number, number], i: number) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const sparkArea = sparkPoints.length > 0
    ? `${sparkPath} L${sparkPoints[sparkPoints.length - 1][0]},${sparkH} L${sparkPoints[0][0]},${sparkH} Z`
    : '';

  return (
    <section className="card fc-card">
      <div className="card-head fc-head">
        <h2>7-day outlook</h2>
        <div className="fc-meta">
          <span className="fc-chip"><ThermometerSun size={12} /> hi {Math.round(temp(weekHi))}{tu}</span>
          <span className="fc-chip"><ThermometerSnowflake size={12} /> lo {Math.round(temp(weekLo))}{tu}</span>
          {wettest >= 0 && wettestPop >= 30 && (
            <span className="fc-chip fc-chip--wet">
              <CloudRain size={12} /> wettest {DAYS[new Date(d.time[wettest]).getDay()]}
            </span>
          )}
        </div>
      </div>

      {/* Week temperature sparkline */}
      <div className="fc-spark">
        <svg viewBox={`0 0 ${sparkW} ${sparkH}`} preserveAspectRatio="xMidYMid meet" width="100%" height={sparkH} style={{ display: 'block', minHeight: sparkH }}>
          <defs>
            <linearGradient id="fc-spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9d7cd8" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#9d7cd8" stopOpacity={0} />
            </linearGradient>
          </defs>
          {sparkArea && <path d={sparkArea} fill="url(#fc-spark-fill)" />}
          {sparkPath && <path d={sparkPath} fill="none" stroke="#9d7cd8" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />}
          {sparkPoints.map((p: [number, number], i: number) => {
            const isHi = i === weekHiIdx;
            const isLo = i === weekLoIdx;
            return (
              <g key={i}>
                <circle cx={p[0]} cy={p[1]} r={isHi || isLo ? 3.5 : 2} fill={isHi ? '#ff9e64' : isLo ? '#7aa2f7' : '#9d7cd8'} />
                {(isHi || isLo) && (
                  <text x={p[0]} y={p[1] - 7} textAnchor="middle" fontSize={9} fill={isHi ? '#ff9e64' : '#7aa2f7'} fontFamily="ui-monospace,monospace" fontWeight={700}>
                    {Math.round(temp(isHi ? weekHi : weekLo))}{tu}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="fc-days">
        {d.time.map((t: string, i: number) => {
          const date = new Date(t);
          const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAYS[date.getDay()];
          const min = d.temperature_2m_min[i];
          const max = d.temperature_2m_max[i];
          const code = d.weather_code?.[i] ?? 0;
          const barLeft = ((min - allMin) / span) * 100;
          const barWidth = Math.max(4, ((max - min) / span) * 100);
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
            <div key={t} className={`fc-row ${isOpen ? 'fc-row--open' : ''}`}>
              <button
                className="fc-row__trigger"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                {/* Day name + date */}
                <div className="fc-day">
                  <span className="fc-day__name">{dayName}</span>
                  <span className="fc-day__date">{fmtDate(date)}</span>
                  {lat != null && lon != null && (
                    <span className="fc-conf"><ConfidenceBadge lat={lat} lon={lon} date={t} /></span>
                  )}
                </div>

                {/* Weather icon */}
                <div className="fc-icon">
                  <AnimatedWeatherIcon code={code} isDay={true} size={24} />
                </div>

                {/* Verdict chip + rain */}
                <div className="fc-verdict-wrap">
                  <span className={`fc-verdict fc-verdict--${verdict.tone}`}>{verdict.label}</span>
                  {pop >= 25 && (
                    <span className="fc-pop"><Droplets size={10} />{Math.round(pop)}%</span>
                  )}
                </div>

                {/* Temp range bar */}
                <div className="fc-bar-wrap">
                  <div className="fc-bar">
                    <span style={{ left: `${barLeft}%`, width: `${barWidth}%` }} />
                  </div>
                </div>

                {/* Lo / Hi */}
                <div className="fc-temps">
                  <span className="fc-lo">{Math.round(temp(min))}{tu}</span>
                  <span className="fc-hi">{Math.round(temp(max))}{tu}</span>
                </div>

                <ChevronDown size={14} className={`fc-chevron ${isOpen ? 'fc-chevron--open' : ''}`} />
              </button>

              {isOpen && (
                <div className="fc-row__detail">
                  <div className="fc-detail-grid">
                    <div className="fc-detail-item">
                      <span className="fc-dl">Condition</span>
                      <span className="fc-dv">{weatherLabel(code)}</span>
                    </div>
                    <div className="fc-detail-item">
                      <span className="fc-dl">Rain chance</span>
                      <span className="fc-dv">{Math.round(pop)}% · {precip.toFixed(1)} mm</span>
                    </div>
                    <div className="fc-detail-item">
                      <span className="fc-dl">Wind</span>
                      <span className="fc-dv">
                        <Wind size={11} /> {Math.round(speed(wind))} {speedUnit}
                        {gusts > 0 && <span className="fc-dsub"> gusts {Math.round(speed(gusts))}</span>}
                      </span>
                    </div>
                    <div className="fc-detail-item">
                      <span className="fc-dl">UV index</span>
                      <span className="fc-dv">
                        <Sun size={11} /> {uv.toFixed(1)}
                        <span className="fc-dsub">
                          {uv < 3 ? ' low' : uv < 6 ? ' moderate' : uv < 8 ? ' high' : uv < 11 ? ' very high' : ' extreme'}
                        </span>
                      </span>
                    </div>
                    {sunrise && sunset && (
                      <div className="fc-detail-item fc-detail-item--wide">
                        <span className="fc-dl">Sun</span>
                        <span className="fc-dv">
                          ↑ {new Date(sunrise).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          {' · '}
                          ↓ {new Date(sunset).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
