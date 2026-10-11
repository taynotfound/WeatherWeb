'use client';

import { useEffect, useState } from 'react';
import { Card, Icon, dayName, dayLong, hhmm, hour12 } from './ui';
import { LineChart } from './charts';
import { usePrefs } from '@/lib/prefs';
import { condition, compass, uvLabel } from '@/lib/wx';
import { tempColor } from '@/lib/palette';

/* ---------- 10-day list with expandable detail + model confidence ---------- */
export function DailyCard({ weather, className = 's8' }: { weather: any; className?: string }) {
  const { t, mm, spd, spdUnit } = usePrefs();
  const [open, setOpen] = useState<number | null>(null);
  const d = weather.daily; if (!d) return null;
  const lo = Math.min(...d.temperature_2m_min), hi = Math.max(...d.temperature_2m_max);
  const pos = (v: number) => ((v - lo) / Math.max(1, hi - lo)) * 100;
  const cur = weather.current?.temperatureC;
  return (
    <Card title={`${d.time.length}-day forecast`} icon="calendar_month" shape="cookie12" sub="Tap a day for details" className={className}>
      <div className="col" style={{ gap: 2, margin: '0 -10px', flex: 1, justifyContent: 'space-between' }}>
        {d.time.map((day: string, i: number) => {
          const cond = condition(d.weather_code[i]);
          const mn = d.temperature_2m_min[i], mx = d.temperature_2m_max[i];
          const conf = d.confidence?.[i];
          const isOpen = open === i;
          const pop = d.precipitation_probability_max[i];
          return (
            <div key={day}>
              <button className="day-row state" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                <span className="title-s">{dayName(day, i)}</span>
                <Icon name={cond.icon} />
                <span className="label-m tnum" style={{ color: 'var(--md-primary)' }}>{pop >= 20 ? `${pop}%` : ''}</span>
                <span className="title-s tnum muted tt">{t(mn)}</span>
                <span className="range">
                  <i style={{ left: `${pos(mn)}%`, width: `${Math.max(3, pos(mx) - pos(mn))}%`, background: `linear-gradient(90deg, ${tempColor(mn)}, ${tempColor(mx)})` }} />
                  {i === 0 && cur != null && <b style={{ left: `${Math.max(0, Math.min(100, pos(cur)))}%` }} />}
                </span>
                <span className="title-s tnum tt">{t(mx)}</span>
              </button>
              {isOpen && (
                <div className="day-detail">
                  <div className="kv" style={{ gridColumn: '1 / -1' }}><div className="label-s">{dayLong(day)}</div><div className="title-m">{cond.label}</div></div>
                  <div className="kv"><div className="label-s">Feels</div><div className="title-m tnum">{t(d.apparent_temperature_min[i])} – {t(d.apparent_temperature_max[i])}</div></div>
                  <div className="kv"><div className="label-s">Rain</div><div className="title-m tnum">{mm(d.precipitation_sum[i])}</div></div>
                  <div className="kv"><div className="label-s">Wind</div><div className="title-m tnum">{spd(d.wind_speed_10m_max[i])} {spdUnit} {d.wind_direction_10m_dominant ? compass(d.wind_direction_10m_dominant[i]) : ''}</div></div>
                  <div className="kv"><div className="label-s">UV</div><div className="title-m tnum">{Math.round(d.uv_index_max[i])} · {uvLabel(d.uv_index_max[i])}</div></div>
                  <div className="kv"><div className="label-s">Sun</div><div className="title-m tnum">{hhmm(d.sunrise[i])} → {hhmm(d.sunset[i])}</div></div>
                  {d.astro?.[i] && <div className="kv"><div className="label-s">Moon</div><div className="title-m">{d.astro[i].moon_phase}</div></div>}
                  {conf && (
                    <div className="kv"><div className="label-s">Model agreement</div>
                      <div className="title-m row" style={{ gap: 6 }}><span className={`pill ${conf.level === 'high' ? 'good' : conf.level === 'medium' ? 'med' : 'bad'}`}>{conf.level}</span>
                        {conf.spreadC != null && <span className="label-m muted">±{conf.spreadC}° · {conf.models} models</span>}</div></div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------- daily rain totals ---------- */
export function RainWeekCard({ weather, className = 's4' }: { weather: any; className?: string }) {
  const { mm } = usePrefs();
  const d = weather.daily; if (!d) return null;
  const n = Math.min(10, d.time.length);
  const sums: number[] = d.precipitation_sum.slice(0, n);
  const max = Math.max(2, ...sums);
  const total = sums.reduce((a, b) => a + (b ?? 0), 0);
  return (
    <Card title="Rain ahead" icon="water_drop" shape="flower" sub={`${mm(total)} over ${n} days`} className={className}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }} role="img" aria-label="Daily rain totals">
        {sums.map((v, i) => {
          const p = d.precipitation_probability_max[i] ?? 0;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 4, height: '100%' }} title={`${dayName(d.time[i], i)}: ${mm(v)} · ${p}%`}>
              <span className="label-s tnum muted">{v >= 0.5 ? (v < 10 ? v.toFixed(1) : Math.round(v)) : ''}</span>
              <i style={{ width: '100%', maxWidth: 22, height: `${Math.max(4, (v / max) * 80)}px`, borderRadius: '8px 8px 4px 4px', background: v >= 0.5 ? 'var(--md-primary)' : 'var(--md-surface-container-highest)', opacity: v >= 0.5 ? 0.45 + p / 180 : 1 }} />
              <span className="label-s muted">{dayName(d.time[i], i).slice(0, 2)}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------- week at a glance ---------- */
export function WeekCard({ weather, className = 's4' }: { weather: any; className?: string }) {
  const { t } = usePrefs();
  const d = weather.daily; if (!d) return null;
  const n = Math.min(7, d.time.length);
  const idx = Array.from({ length: n }, (_, i) => i);
  const wet = idx.filter(i => d.precipitation_probability_max[i] >= 50);
  const hotI = idx.reduce((a, i) => (d.temperature_2m_max[i] > d.temperature_2m_max[a] ? i : a), 0);
  const coldI = idx.reduce((a, i) => (d.temperature_2m_min[i] < d.temperature_2m_min[a] ? i : a), 0);
  const best = idx.reduce((a, i) => {
    const sc = (k: number) => 100 - d.precipitation_probability_max[k] - Math.abs(d.temperature_2m_max[k] - 21) * 3 - d.wind_speed_10m_max[k] * .5;
    return sc(i) > sc(a) ? i : a;
  }, 0);
  return (
    <Card title="Week at a glance" icon="date_range" shape="sunny" tone="primary" className={className}>
      <p className="headline-s expressive">
        {wet.length === 0 ? 'A dry week ahead.' : wet.length >= 5 ? 'Wet week. Keep the umbrella handy.' : `${wet.length} wet ${wet.length === 1 ? 'day' : 'days'} this week.`}
      </p>
      <div className="card-foot">
        {([
          ['local_fire_department', 'Warmest', dayName(d.time[hotI], hotI), t(d.temperature_2m_max[hotI])],
          ['ac_unit', 'Coldest night', dayName(d.time[coldI], coldI), t(d.temperature_2m_min[coldI])],
          ['thumb_up', 'Best day', dayName(d.time[best], best), ''],
        ] as const).map(([ic, k, day, v]) => (
          <div key={k} className="list-row" style={{ borderColor: 'color-mix(in srgb, currentColor 18%, transparent)' }}>
            <Icon name={ic} fill /><span className="grow body-m" style={{ opacity: .8 }}>{k}</span><span className="title-m">{day}</span>{v && <span className="title-m tnum" style={{ minWidth: 36, textAlign: 'right' }}>{v}</span>}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- multi-model temperature spread for today ---------- */
export function ModelChartCard({ lat, lon, className = 's12' }: { lat: number; lon: number; className?: string }) {
  const { temp } = usePrefs();
  const [m, setM] = useState<any>(null);
  useEffect(() => {
    let alive = true;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&timezone=auto&forecast_days=3&models=ecmwf_ifs025,gfs_seamless,icon_seamless,ukmo_seamless`)
      .then(r => r.json()).then(j => alive && setM(j.hourly)).catch(() => {});
    return () => { alive = false; };
  }, [lat, lon]);
  if (!m) return null;
  const names: Record<string, [string, string]> = {
    ecmwf_ifs025: ['ECMWF', 'var(--md-primary)'], gfs_seamless: ['GFS', 'var(--md-tertiary)'],
    icon_seamless: ['ICON', 'var(--md-secondary)'], ukmo_seamless: ['UKMO', 'var(--md-error)'],
  };
  const step = 3;
  const keep = m.time.map((_: string, i: number) => i).filter((i: number) => i % step === 0).slice(0, 24);
  const series = Object.entries(names).map(([k, [label, color]], idx) => ({
    label, color, dashed: idx > 0,
    values: keep.map((i: number) => (typeof m[`temperature_2m_${k}`]?.[i] === 'number' ? temp(m[`temperature_2m_${k}`][i]) : null)),
  })).filter(s => s.values.some((v: any) => v != null));
  return (
    <Card title="Models, side by side" icon="stacked_line_chart" shape="clover" sub="Where the big weather models agree, and where they don't" className={className}
      action={<div className="row wrap" style={{ gap: 12, justifyContent: 'flex-end' }}>{series.map(s => <span key={s.label} className="label-m row" style={{ gap: 6 }}><span className="dot" style={{ background: s.color }} />{s.label}</span>)}</div>}>
      <LineChart series={series} labels={keep.map((i: number) => (i % 24 === 0 ? new Date(m.time[i]).toLocaleDateString('en-US', { weekday: 'short' }) : hour12(m.time[i])))} fmt={v => `${Math.round(v)}°`} height={240} markers={false} />
    </Card>
  );
}

/* ---------- vs normal + what changed ---------- */
export function ClimateCard({ lat, lon, weather, className = 's4' }: { lat: number; lon: number; weather: any; className?: string }) {
  const [a, setA] = useState<any>(null);
  const [fc, setFc] = useState<any>(null);
  const { t, mm, unit } = usePrefs();
  const max = weather.daily?.temperature_2m_max?.[0];
  const pr = weather.daily?.precipitation_sum?.[0] ?? 0;
  useEffect(() => {
    let alive = true;
    if (max != null) fetch(`/api/anomaly?lat=${lat}&lon=${lon}&todayMax=${max}&todayPrecip=${pr}`).then(r => r.json()).then(j => alive && !j.error && setA(j)).catch(() => {});
    fetch(`/api/forecast-change?lat=${lat}&lon=${lon}`).then(r => r.json()).then(j => alive && j.available && setFc(j)).catch(() => {});
    return () => { alive = false; };
  }, [lat, lon, max, pr]);
  if (!a && !fc) return <div className={`skel ${className}`} style={{ minHeight: 160 }} />;
  const imp = unit === 'imperial';
  const dU = (c: number) => (imp ? c * 9 / 5 : c); // a temperature *difference* in the user's unit
  const delta = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(dU(v) * 10) / 10)}°`;
  const d = a ? Math.round(dU(a.deltaC) * 10) / 10 : 0;
  const pos = a ? Math.max(4, Math.min(96, 50 + (a.deltaC / 8) * 50)) : 50;
  const rainMax = a ? Math.max(0.5, a.todayPrecipMm, a.normalPrecipMm) : 1;
  return (
    <Card title="Context" icon="history" shape="cookie7" sub="Today against the last 15 years" className={className}>
      {a && (
        <>
          <div className="headline-s expressive" style={{ color: Math.abs(d) < 0.5 ? undefined : a.deltaC > 0 ? 'var(--md-error)' : 'var(--md-primary)' }}>
            {Math.abs(d) < 0.5 ? 'Right on normal' : `${Math.abs(d)}° ${a.deltaC > 0 ? 'warmer' : 'cooler'} than normal`}
          </div>
          <div>
            <div style={{ position: 'relative', height: 12, borderRadius: 6, background: `linear-gradient(90deg, ${tempColor(a.normalMaxC - 10)}, ${tempColor(a.normalMaxC)}, ${tempColor(a.normalMaxC + 10)})`, opacity: .85 }}>
              <span style={{ position: 'absolute', left: '50%', top: -4, bottom: -4, width: 2, marginLeft: -1, background: 'var(--md-on-surface)', opacity: .5, borderRadius: 1 }} />
              <span style={{ position: 'absolute', left: `${pos}%`, top: -4, width: 20, height: 20, marginLeft: -10, borderRadius: '50%', background: 'var(--md-surface-container)', border: '4px solid var(--md-on-surface)', transition: 'left 800ms var(--ease-emph)' }} />
            </div>
            <div className="row between label-m muted" style={{ marginTop: 8 }}><span>Normal high {t(a.normalMaxC)}</span><span>Today {t(a.todayMaxC)}</span></div>
          </div>
          <div className="col" style={{ gap: 6 }}>
            {([['Rain today', a.todayPrecipMm, 'var(--md-primary)'], ['Usually', a.normalPrecipMm, 'var(--md-outline)']] as const).map(([k, v, c]) => (
              <div key={k} className="row" style={{ gap: 10 }}>
                <span className="label-m muted" style={{ width: 72 }}>{k}</span>
                <div className="meter grow" style={{ height: 8 }}><i style={{ width: `${Math.max(2, (v / rainMax) * 100)}%`, background: c }} /></div>
                <span className="label-m tnum" style={{ width: 56, textAlign: 'right' }}>{mm(v)}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {fc && (
        <div className="row card-foot" style={{ alignItems: 'flex-start', paddingTop: 12, borderTop: '1px solid var(--md-outline-variant)' }}>
          <Icon name="update" style={{ color: 'var(--md-tertiary)' }} />
          <div>
            <div className="title-s">Since yesterday&apos;s forecast</div>
            <div className="body-s muted">
              {fc.max && Math.abs(dU(fc.max.delta)) >= 0.5 ? `High ${delta(fc.max.delta)}` : 'High unchanged'}
              {fc.pop && Math.abs(fc.pop.delta) >= 10 ? ` · rain chance ${fc.pop.delta > 0 ? '+' : '−'}${Math.abs(Math.round(fc.pop.delta))}%` : ''}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
