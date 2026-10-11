'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, Icon, hour12, hhmm, localParts } from './ui';
import { LineChart, Ring } from './charts';
import { usePrefs } from '@/lib/prefs';
import { condition, compass, uvLabel } from '@/lib/wx';
import { suggestOutfit } from '@/lib/outfit';
import { allScores } from '@/lib/scores';
import { findBestHour } from '@/lib/bestHour';

export const nowIdx = (w: any) => {
  const times: string[] = w?.hourly?.time ?? [];
  const key = (w?.current?.time ?? '').slice(0, 13);
  const i = times.findIndex(t => t.slice(0, 13) === key);
  return i >= 0 ? i : 0;
};

/* ---------- Hourly strip ---------- */
export function HourlyCard({ weather }: { weather: any }) {
  const { t } = usePrefs();
  const h = weather.hourly; if (!h) return null;
  const s = nowIdx(weather);
  const idxs = Array.from({ length: 24 }, (_, k) => s + k).filter(i => i < h.time.length);
  return (
    <Card title="Hourly" icon="schedule" className="span-all">
      <div className="hourly" tabIndex={0} aria-label="Next 24 hours">
        {idxs.map((i, k) => {
          const cond = condition(h.weather_code[i], h.is_day?.[i] !== 0);
          const pop = h.precipitation_probability?.[i];
          return (
            <div key={i} className={`hour ${k === 0 ? 'now' : ''}`}>
              <span className="label-m">{k === 0 ? 'Now' : hour12(h.time[i])}</span>
              <Icon name={cond.icon} fill style={{ color: k === 0 ? 'inherit' : 'var(--md-primary)' }} />
              <span className="title-m tnum">{t(h.temperature_2m[i])}</span>
              <span className="pop">{pop >= 15 ? `${Math.round(pop)}%` : ''}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------- Temperature chart ---------- */
export function TempChartCard({ weather }: { weather: any }) {
  const { temp, t } = usePrefs();
  const h = weather.hourly; if (!h) return null;
  const s = nowIdx(weather);
  const r = Array.from({ length: 36 }, (_, k) => s + k).filter(i => i < h.time.length);
  const labels = r.map(i => (i === s ? 'Now' : hour12(h.time[i])));
  return (
    <Card title="Next 36 hours" icon="show_chart" sub="Drag across the chart to scrub" className="span-2">
      <LineChart
        labels={labels}
        fmt={v => `${Math.round(v)}°`}
        series={[
          { label: 'Temp', color: 'var(--md-primary)', values: r.map(i => temp(h.temperature_2m[i])) },
          { label: 'Feels', color: 'var(--md-tertiary)', dashed: true, values: r.map(i => temp(h.apparent_temperature[i])) },
        ]}
        bars={{ label: 'rain %', values: r.map(i => h.precipitation_probability?.[i] ?? 0) }}
        height={210}
      />
      <div className="chips">
        <span className="chip tonal"><Icon name="trending_up" />High {t(weather.daily?.temperature_2m_max?.[0])}</span>
        <span className="chip tonal"><Icon name="trending_down" />Low {t(weather.daily?.temperature_2m_min?.[0])}</span>
      </div>
    </Card>
  );
}

/* ---------- Rain nowcast ---------- */
export function RainCard({ data: d }: { data: any }) {
  const { mm } = usePrefs();
  if (!d?.timeline) return <div className="skel" style={{ height: 190 }} />;
  const max = Math.max(0.5, ...d.timeline.map((b: any) => b.mm));
  return (
    <Card title="Rain, next 2 hours" icon="umbrella" tone={d.raining ? 'tertiary' : undefined}
      sub={`Radar + ${d.sources.used.length - 1} forecasts`}>
      <p className="headline-s">{d.headline}</p>
      <div className="bars" role="img" aria-label="Rain forecast in 15 minute steps">
        {d.timeline.map((b: any, i: number) => (
          <div key={b.time}>
            <span className="label-s tnum" style={{ opacity: .7 }}>{b.mm > 0.05 ? mm(b.mm).replace(' mm', '') : b.prob >= 30 ? `${Math.round(b.prob)}%` : ''}</span>
            <div className={`bar ${b.mm > 0.05 ? '' : 'dry'}`} style={{ height: b.mm > 0.05 ? `${Math.max(12, (b.mm / max) * 66)}px` : b.prob >= 30 ? `${Math.max(8, b.prob * 0.3)}px` : '4px', opacity: b.mm > 0.05 ? 1 : b.prob >= 30 ? .5 : 1 }} />
            <span className="label-s" style={{ opacity: .7 }}>{i === 0 ? 'now' : i % 2 === 0 ? `+${i * 15}m` : ''}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- Outfit ---------- */
export function OutfitCard({ weather }: { weather: any }) {
  const c = weather.current;
  const h = weather.hourly;
  const pop = Math.max(...(h?.precipitation_probability?.slice(nowIdx(weather), nowIdx(weather) + 6) ?? [0]), 0);
  const o = suggestOutfit({ tempC: c.temperatureC, feelsLikeC: c.feelsLikeC, precipProb: pop, windKmh: c.windKmh ?? 0, uvIndex: c.uvIndex ?? 0, isDay: c.isDay, code: c.weatherCode });
  return (
    <Card title="What to wear" icon="checkroom" tone="secondary" sub={o.vibe}>
      <div className="chips">
        {o.layers.map(l => <span key={l} className="chip selected" style={{ background: 'color-mix(in srgb, var(--md-on-secondary-container) 14%, transparent)' }}>{l}</span>)}
      </div>
      <div className="row" style={{ gap: 8 }}><Icon name="steps" /><span className="body-l">{o.footwear}</span></div>
      {o.accessories.length > 0 && (
        <div className="chips">{o.accessories.map(a => <span key={a} className="chip" style={{ borderColor: 'color-mix(in srgb, var(--md-on-secondary-container) 40%, transparent)', color: 'inherit' }}><Icon name="add" />{a}</span>)}</div>
      )}
    </Card>
  );
}

/* ---------- Should I? scores ---------- */
export function ScoresCard({ weather }: { weather: any }) {
  const c = weather.current, h = weather.hourly, i = nowIdx(weather);
  const icons: Record<string, string> = { bike: 'directions_bike', outside: 'park', laundry: 'local_laundry_service', sleep: 'bedtime' };
  const scores = allScores({
    tempC: c.temperatureC, feelsLikeC: c.feelsLikeC, windKmh: c.windKmh, gustKmh: c.windGustKmh, precipMm: c.precipitation,
    precipProb: h?.precipitation_probability?.[i], humidity: c.humidity, uv: c.uvIndex, cloudCover: c.cloudCover, isDay: c.isDay,
  });
  const color = (v: number) => (v >= 70 ? 'var(--md-primary)' : v >= 40 ? 'var(--md-tertiary)' : 'var(--md-error)');
  return (
    <Card title="Should I…?" icon="help" sub="Right-now scores">
      <div className="scores">
        {scores.map(s => (
          <div key={s.label} className="score">
            <Ring value={s.value} color={color(s.value)}><Icon name={icons[s.label]} /></Ring>
            <span className="title-s" style={{ textTransform: 'capitalize' }}>{s.label}</span>
            <span className="label-m muted">{s.verdict} · {s.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- AI + best hour ---------- */
export function InsightsCard({ weather, air, alerts }: { weather: any; air: any; alerts: any }) {
  const [lines, setLines] = useState<string[] | null>(null);
  const [failed, setFailed] = useState(false);
  const { t, unit } = usePrefs();
  const key = `${weather.location.latitude.toFixed(1)},${weather.location.longitude.toFixed(1)}`;
  useEffect(() => {
    let alive = true;
    setLines(null); setFailed(false);
    fetch('/api/insights', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ weather, air, alerts: alerts?.alerts?.slice(0, 2), unit }),
    }).then(r => r.json()).then(j => { if (!alive) return; if (j.insights?.length) setLines(j.insights); else setFailed(true); }).catch(() => alive && setFailed(true));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, unit]);

  const best = useMemo(() => findBestHour(weather.hourly, 18, nowIdx(weather) + 1), [weather]);
  return (
    <Card title="Tomato's take" icon="auto_awesome" tone="tertiary">
      {lines ? lines.map((l, i) => <p key={i} className="body-l" style={{ letterSpacing: 0 }}>{l}</p>)
        : failed ? <p className="body-l">Summary unavailable right now.</p>
        : <div className="col" style={{ gap: 8 }}>{[90, 70, 80].map(w => <div key={w} className="skel" style={{ height: 18, width: `${w}%`, borderRadius: 9, opacity: .5 }} />)}</div>}
      {best && (
        <div className="chips">
          <span className="chip selected" style={{ background: 'color-mix(in srgb, var(--md-on-primary-container) 14%, transparent)', color: 'inherit' }}>
            <Icon name="star" fill />Best time outside: {hhmm(best.iso)} · {best.reason.replace(/\d+°/, m => t(parseInt(m)))}
          </span>
        </div>
      )}
    </Card>
  );
}

/* ---------- Details ---------- */
export function DetailsCard({ weather }: { weather: any }) {
  const { press, dist, t, spd, spdUnit } = usePrefs();
  const c = weather.current;
  const items: [string, string, string, string?][] = [
    ['wb_sunny', 'UV index', `${Math.round(c.uvIndex ?? 0)}`, uvLabel(c.uvIndex ?? 0)],
    ['compress', 'Pressure', press(c.pressure)],
    ['visibility', 'Visibility', dist(c.visibilityKm)],
    ['dew_point', 'Dew point', t(c.dewPointC)],
    ['cloud', 'Cloud cover', `${Math.round(c.cloudCover ?? 0)}%`],
    ['storm', 'Gusts', `${spd(c.windGustKmh)} ${spdUnit}`],
  ];
  return (
    <Card title="Conditions" icon="tune">
      <div className="stat-grid">
        {items.map(([ic, l, v, s]) => (
          <div key={l} className="stat"><Icon name={ic} /><span className="label-m muted">{l}</span><span className="big tnum">{v}</span>{s && <span className="label-m" style={{ color: 'var(--md-primary)' }}>{s}</span>}</div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- Wind compass ---------- */
export function WindCard({ weather }: { weather: any }) {
  const { spd, spdUnit } = usePrefs();
  const c = weather.current;
  const deg = c.windDirection ?? 0;
  const beaufort = (k: number) => (k < 1 ? 'Calm' : k < 6 ? 'Light air' : k < 12 ? 'Light breeze' : k < 20 ? 'Gentle breeze' : k < 29 ? 'Moderate breeze' : k < 39 ? 'Fresh breeze' : k < 50 ? 'Strong breeze' : k < 62 ? 'Near gale' : 'Gale');
  return (
    <Card title="Wind" icon="air">
      <div className="row" style={{ gap: 20 }}>
        <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`Wind from ${compass(deg)}`}>
          <circle cx="60" cy="60" r="56" fill="var(--md-surface-container-high)" />
          {[0, 90, 180, 270].map((a, i) => <text key={a} x="60" y="17" textAnchor="middle" fontSize="11" fontWeight="500" fill="var(--md-on-surface-variant)" transform={`rotate(${a} 60 60)`}>{'NESW'[i]}</text>)}
          <g style={{ transform: `rotate(${deg + 180}deg)`, transformOrigin: '60px 60px', transition: 'transform 900ms var(--ease-spring)' }}>
            <path d="M60 24 L72 62 L60 54 L48 62 Z" fill="var(--md-primary)" />
            <circle cx="60" cy="60" r="5" fill="var(--md-primary-container)" stroke="var(--md-primary)" strokeWidth="2" />
          </g>
        </svg>
        <div>
          <div className="display-s tnum">{spd(c.windKmh)}<span className="title-m muted"> {spdUnit}</span></div>
          <div className="body-l">{beaufort(c.windKmh ?? 0)}</div>
          <div className="body-m muted">From {compass(deg)} · gusts {spd(c.windGustKmh)}</div>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Sun arc ---------- */
export function SunCard({ weather }: { weather: any }) {
  const d = weather.daily; if (!d?.sunrise) return null;
  const sr = d.sunrise[0], ss = d.sunset[0];
  const cur = weather.current.time ?? '';
  const mins = (iso: string) => { const p = localParts(iso); return p.h * 60 + p.mi; };
  const a = mins(sr), b = mins(ss), n = mins(cur);
  const f = Math.max(0, Math.min(1, (n - a) / (b - a)));
  const x = 20 + f * 260, y = 100 - Math.sin(f * Math.PI) * 78;
  const dl = d.daylight_duration?.[0] ?? (b - a) * 60;
  const tom = d.daylight_duration?.[1];
  const diff = tom ? Math.round((tom - dl) / 60) : null;
  const up = n >= a && n <= b;
  return (
    <Card title="Sun" icon="wb_twilight">
      <svg viewBox="0 0 300 120" width="100%" role="img" aria-label="Sun position">
        <path d="M20 100 Q150 -56 280 100" fill="none" stroke="var(--md-outline-variant)" strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" />
        {up && <path d={`M20 100 Q${20 + f * 130} ${100 - f * 156} ${x} ${y}`} fill="none" stroke="var(--md-tertiary)" strokeWidth="4" strokeLinecap="round" />}
        <line x1="0" x2="300" y1="100" y2="100" stroke="var(--md-outline-variant)" />
        {up && <circle cx={x} cy={y} r="11" fill="var(--md-tertiary)" stroke="var(--md-surface-container)" strokeWidth="4" />}
      </svg>
      <div className="row between">
        <div><div className="label-m muted">Sunrise</div><div className="title-m tnum">{hhmm(sr)}</div></div>
        <div style={{ textAlign: 'center' }}><div className="label-m muted">Daylight</div><div className="title-m tnum">{Math.floor(dl / 3600)}h {Math.round((dl % 3600) / 60)}m</div>
          {diff != null && <div className="label-s muted">{diff >= 0 ? '+' : '−'}{Math.abs(Math.floor(diff / 60))}m {Math.abs(diff % 60)}s tomorrow</div>}</div>
        <div style={{ textAlign: 'right' }}><div className="label-m muted">Sunset</div><div className="title-m tnum">{hhmm(ss)}</div></div>
      </div>
    </Card>
  );
}

/* ---------- Sources / consensus ---------- */
export function SourcesCard({ weather }: { weather: any }) {
  const { t, spd, spdUnit } = usePrefs();
  const { readings, used, failed } = weather.sources;
  const spread = weather.current.spreadC ?? 0;
  const level = spread < 1.5 ? ['good', 'Strong agreement'] : spread < 3 ? ['med', 'Some disagreement'] : ['bad', 'Sources disagree'];
  const med = weather.current.temperatureC;
  return (
    <Card title="Source check" icon="fact_check" sub={`Median of ${readings.length} independent forecasts`}>
      <div className="row between wrap">
        <span className={`pill ${level[0]}`}><Icon name={level[0] === 'good' ? 'check_circle' : 'warning'} className="sm" />{level[1]}</span>
        <span className="label-m muted">spread {spread.toFixed(1)}°C</span>
      </div>
      <div>
        {readings.map((r: any) => {
          const d = r.tempC != null ? r.tempC - med : 0;
          return (
            <div key={r.id} className="src">
              <div><span className="dot" /><span className="title-s">{r.name}</span> <span className="label-s muted">{r.kind === 'model' ? 'model' : 'forecast'}</span></div>
              <div className="title-m tnum">{t(r.tempC)}</div>
              <div className="label-m muted">{r.windKmh != null ? `${spd(r.windKmh)} ${spdUnit} wind` : ''}{r.humidity != null ? ` · ${Math.round(r.humidity)}% hum` : ''}</div>
              <div className="label-m tnum" style={{ textAlign: 'right', color: Math.abs(d) > 1.5 ? 'var(--md-error)' : 'var(--md-on-surface-variant)' }}>{d >= 0 ? '+' : '−'}{Math.abs(d).toFixed(1)}°</div>
            </div>
          );
        })}
        {failed.map((f: string) => <div key={f} className="src"><div><span className="dot off" /><span className="title-s muted">{f}</span></div><div className="label-m muted">unavailable</div></div>)}
      </div>
    </Card>
  );
}
