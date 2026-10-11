'use client';

import { useEffect, useState } from 'react';
import { Card, Icon, dayName, dayLong, hhmm, hour12 } from './ui';
import { LineChart } from './charts';
import { usePrefs } from '@/lib/prefs';
import { condition, compass, uvLabel } from '@/lib/wx';

/* ---------- 10-day list with expandable detail + model confidence ---------- */
export function DailyCard({ weather }: { weather: any }) {
  const { t, mm, spd, spdUnit } = usePrefs();
  const [open, setOpen] = useState<number | null>(null);
  const d = weather.daily; if (!d) return null;
  const lo = Math.min(...d.temperature_2m_min), hi = Math.max(...d.temperature_2m_max);
  const todayI = 0;
  return (
    <Card title="10-day forecast" icon="calendar_month" sub="Tap a day for details" className="span-2">
      <div className="col" style={{ gap: 2 }}>
        {d.time.map((day: string, i: number) => {
          const cond = condition(d.weather_code[i]);
          const a = ((d.temperature_2m_min[i] - lo) / (hi - lo)) * 100;
          const b = ((d.temperature_2m_max[i] - lo) / (hi - lo)) * 100;
          const conf = d.confidence?.[i];
          const isOpen = open === i;
          return (
            <div key={day}>
              <button className="day-row state" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                <span className="title-s">{dayName(day, i - todayI)}</span>
                <Icon name={cond.icon} fill />
                <span className="label-m" style={{ color: 'var(--md-primary)' }}>{d.precipitation_probability_max[i] >= 20 ? `${d.precipitation_probability_max[i]}%` : ''}</span>
                <span className="range"><i style={{ left: `${a}%`, width: `${Math.max(4, b - a)}%` }} /></span>
                <span className="title-s tnum tt">{t(d.temperature_2m_max[i])}<span className="muted"> {t(d.temperature_2m_min[i])}</span></span>
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
                      <div className="title-m"><span className={`pill ${conf.level === 'high' ? 'good' : conf.level === 'medium' ? 'med' : 'bad'}`}>{conf.level}</span>
                        {conf.spreadC != null && <span className="label-m muted"> ±{conf.spreadC}° · {conf.models} models</span>}</div></div>
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

/* ---------- week at a glance ---------- */
export function WeekCard({ weather }: { weather: any }) {
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
    <Card title="Week at a glance" icon="date_range" tone="primary">
      <p className="headline-s" style={{ letterSpacing: 0 }}>
        {wet.length === 0 ? 'A dry week ahead.' : wet.length >= 5 ? 'Wet week. Keep the umbrella handy.' : `${wet.length} wet ${wet.length === 1 ? 'day' : 'days'} this week.`}
      </p>
      <div className="chips">
        <span className="chip" style={{ color: 'inherit', borderColor: 'color-mix(in srgb, currentColor 35%, transparent)' }}><Icon name="local_fire_department" />Warmest {dayName(d.time[hotI], hotI)} {t(d.temperature_2m_max[hotI])}</span>
        <span className="chip" style={{ color: 'inherit', borderColor: 'color-mix(in srgb, currentColor 35%, transparent)' }}><Icon name="ac_unit" />Coldest night {dayName(d.time[coldI], coldI)} {t(d.temperature_2m_min[coldI])}</span>
        <span className="chip" style={{ color: 'inherit', borderColor: 'color-mix(in srgb, currentColor 35%, transparent)' }}><Icon name="thumb_up" />Best day {dayName(d.time[best], best)}</span>
      </div>
    </Card>
  );
}

/* ---------- multi-model temperature spread for today ---------- */
export function ModelChartCard({ weather, lat, lon }: { weather: any; lat: number; lon: number }) {
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
    <Card title="Models, side by side" icon="stacked_line_chart" sub="Where the big weather models agree, and where they don't" className="span-all">
      <LineChart series={series} labels={keep.map((i: number) => (i % 24 === 0 ? 'Day ' + (i / 24 + 1) : hour12(m.time[i])))} fmt={v => `${Math.round(v)}°`} height={200} />
      <div className="chips">{series.map(s => <span key={s.label} className="chip tonal"><span className="dot" style={{ background: s.color, margin: 0 }} />{s.label}</span>)}</div>
    </Card>
  );
}

/* ---------- vs normal + what changed ---------- */
export function ClimateCard({ lat, lon, weather }: { lat: number; lon: number; weather: any }) {
  const [a, setA] = useState<any>(null);
  const [fc, setFc] = useState<any>(null);
  const { t, mm } = usePrefs();
  const max = weather.daily?.temperature_2m_max?.[0];
  const pr = weather.daily?.precipitation_sum?.[0] ?? 0;
  useEffect(() => {
    let alive = true;
    if (max != null) fetch(`/api/anomaly?lat=${lat}&lon=${lon}&todayMax=${max}&todayPrecip=${pr}`).then(r => r.json()).then(j => alive && !j.error && setA(j)).catch(() => {});
    fetch(`/api/forecast-change?lat=${lat}&lon=${lon}`).then(r => r.json()).then(j => alive && j.available && setFc(j)).catch(() => {});
    return () => { alive = false; };
  }, [lat, lon, max, pr]);
  if (!a && !fc) return null;
  const delta = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(v * 10) / 10)}°`;
  return (
    <Card title="Context" icon="history" sub="How today compares">
      {a && (
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <Icon name={a.deltaC >= 0.5 ? 'trending_up' : a.deltaC <= -0.5 ? 'trending_down' : 'trending_flat'} className="lg" style={{ color: a.deltaC > 0 ? 'var(--md-error)' : 'var(--md-primary)' }} />
          <div><div className="title-m">{a.verdict}</div><div className="body-s muted">Typical high for today is {t(a.normalMaxC)} · rain usually {mm(a.normalPrecipMm)} (15-year average)</div></div>
        </div>
      )}
      {fc && (
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <Icon name="update" className="lg" style={{ color: 'var(--md-tertiary)' }} />
          <div>
            <div className="title-m">Since yesterday's forecast</div>
            <div className="body-s muted">
              {fc.max && Math.abs(fc.max.delta) >= 0.5 ? `High ${delta(fc.max.delta)}` : 'High unchanged'}
              {fc.pop && Math.abs(fc.pop.delta) >= 10 ? ` · rain chance ${fc.pop.delta > 0 ? '+' : '−'}${Math.abs(Math.round(fc.pop.delta))}%` : ''}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
