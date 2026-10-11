'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, Icon, hour12, hhmm, localParts, useSize, useWidth, type Shape } from './ui';
import { LineChart, smooth } from './charts';
import { TomatoMark, moodFor } from './Tomato';
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

/* ---------- Hourly: icons over a temperature curve, rain chance under it ---------- */
export function HourlyCard({ weather, className = 's12' }: { weather: any; className?: string }) {
  const { t, temp } = usePrefs();
  const h = weather.hourly; if (!h) return null;
  const s = nowIdx(weather);
  const idxs = Array.from({ length: 25 }, (_, k) => s + k).filter(i => i < h.time.length);
  const COL = 60, H = 186, top = 88, bottom = 38;
  const W = idxs.length * COL;
  const vals = idxs.map(i => temp(h.temperature_2m[i]));
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const Y = (v: number) => top + (1 - (v - lo) / Math.max(1, hi - lo)) * (H - top - bottom);
  const pts = vals.map((v, k) => ({ x: k * COL + COL / 2, y: Y(v) }));
  const line = smooth(pts);
  const area = `${line} L${pts[pts.length - 1].x},${H - 18} L${pts[0].x},${H - 18} Z`;
  return (
    <Card title="Next 24 hours" icon="schedule" className={className}
      sub={`${t(Math.min(...idxs.map(i => h.temperature_2m[i])))} to ${t(Math.max(...idxs.map(i => h.temperature_2m[i])))}`}>
      <div className="hourly" tabIndex={0} aria-label="Hourly forecast">
        <div className="hourly-in" style={{ width: W, height: H }}>
          {idxs.map((i, k) => {
            const cond = condition(h.weather_code[i], h.is_day?.[i] !== 0);
            const pop = h.precipitation_probability?.[i] ?? 0;
            const midnight = k > 0 && localParts(h.time[i]).h === 0;
            return (
              <div key={i} className={`hcol ${k === 0 ? 'now' : ''} ${midnight ? 'day-start' : ''}`} style={{ left: k * COL, width: COL }}>
                <span className="hh">{k === 0 ? 'Now' : midnight ? new Date(h.time[i]).toLocaleDateString('en-US', { weekday: 'short' }) : hour12(h.time[i])}</span>
                <Icon name={cond.icon} />
                {pop >= 10 && <span className="pp tnum" style={{ opacity: .45 + pop / 200 }}>{Math.round(pop)}%</span>}
              </div>
            );
          })}
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }} aria-hidden>
            <defs>
              <linearGradient id="hr-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--md-primary)" stopOpacity=".22" /><stop offset="1" stopColor="var(--md-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {idxs.map((i, k) => {
              const pop = h.precipitation_probability?.[i] ?? 0;
              return pop >= 10 ? <rect key={i} x={k * COL + COL / 2 - 10} y={H - 18 - pop * 0.22} width="20" height={pop * 0.22} rx="4" fill="var(--md-primary)" opacity={0.12 + pop / 400} /> : null;
            })}
            <path d={area} fill="url(#hr-fill)" />
            <path d={line} fill="none" stroke="var(--md-primary)" strokeWidth="3" strokeLinecap="round" />
            {pts.map((p, k) => (
              <g key={k}>
                <circle cx={p.x} cy={p.y} r={k === 0 ? 5 : 3} fill={k === 0 ? 'var(--md-primary)' : 'var(--md-surface-container)'} stroke="var(--md-primary)" strokeWidth="2" />
                <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="14" fontWeight="650" fill="var(--md-on-surface)">{Math.round(vals[k])}°</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </Card>
  );
}

/* ---------- 36 h temperature chart ---------- */
export function TempChartCard({ weather, className = 's8', hours = 36, title = 'Temperature & rain' }: { weather: any; className?: string; hours?: number; title?: string }) {
  const { temp, t } = usePrefs();
  const h = weather.hourly; if (!h) return null;
  const s = nowIdx(weather);
  const r = Array.from({ length: hours }, (_, k) => s + k).filter(i => i < h.time.length);
  const labels = r.map(i => (i === s ? 'Now' : hours > 48 && localParts(h.time[i]).h === 0 ? new Date(h.time[i]).toLocaleDateString('en-US', { weekday: 'short' }) : hour12(h.time[i])));
  return (
    <Card title={title} icon="show_chart" sub={`Next ${hours} hours · drag to scrub`} className={className}
      action={<div className="row" style={{ gap: 12 }}>
        <span className="label-m row" style={{ gap: 6 }}><i style={{ width: 14, height: 3, borderRadius: 2, background: 'var(--md-primary)' }} />Temp</span>
        <span className="label-m row" style={{ gap: 6 }}><i style={{ width: 14, height: 0, borderTop: '2px dashed var(--md-tertiary)' }} />Feels</span>
      </div>}>
      <LineChart
        labels={labels}
        fmt={v => `${Math.round(v)}°`}
        series={[
          { label: 'Temp', color: 'var(--md-primary)', values: r.map(i => temp(h.temperature_2m[i])) },
          { label: 'Feels', color: 'var(--md-tertiary)', dashed: true, values: r.map(i => temp(h.apparent_temperature[i])) },
        ]}
        bars={{ label: 'rain', values: r.map(i => h.precipitation_probability?.[i] ?? 0), color: 'var(--md-secondary)' }}
        height={230}
      />
      <div className="row wrap card-foot" style={{ gap: 20 }}>
        <span className="body-m"><span className="muted">High</span> <b className="tnum">{t(weather.daily?.temperature_2m_max?.[0])}</b></span>
        <span className="body-m"><span className="muted">Low</span> <b className="tnum">{t(weather.daily?.temperature_2m_min?.[0])}</b></span>
        <span className="body-m"><span className="muted">Rain today</span> <b className="tnum">{weather.daily?.precipitation_probability_max?.[0] ?? 0}%</b></span>
      </div>
    </Card>
  );
}

/* ---------- Rain nowcast: 2 h area chart (measured/forecast mm, or chance when nothing is falling) ---------- */
export function RainCard({ data: d, className = 's4' }: { data: any; className?: string }) {
  const { mm } = usePrefs();
  const [ref, W, Hc] = useSize<HTMLDivElement>();
  if (!d?.timeline) return <div className={`skel ${className}`} style={{ minHeight: 240 }} />;
  const tl: any[] = d.timeline;
  const wet = tl.some(b => b.mm > 0.05);
  const maxMm = Math.max(0.5, ...tl.map(b => b.mm));
  const maxP = Math.max(...tl.map(b => b.prob));
  const H = Math.max(110, Hc - 18), base = H - 6;
  const val = (b: any) => (wet ? b.mm / maxMm : b.prob / 100);
  const pts = tl.map((b, i) => ({ x: 4 + (i / (tl.length - 1)) * (W - 8), y: base - val(b) * (H - 28) }));
  const line = W ? smooth(pts) : '';
  const quiet = !wet && maxP < 15;
  return (
    <Card title="Rain, next 2 hours" icon="umbrella" shape="flower" tone={d.raining ? 'tertiary' : undefined} className={className}
      sub={`Radar + ${Math.max(0, d.sources.used.length - 1)} forecasts`}>
      <p className="title-l expressive">{quiet ? 'Dry for the next 2 hours' : d.headline}</p>
      <div ref={ref} style={{ flex: 1, minHeight: 128, position: 'relative' }}>
        {W > 0 && (
          <svg width={W} height={H + 18} style={{ position: 'absolute', inset: 0 }} aria-label="Rain over the next two hours" role="img">
            <defs>
              <linearGradient id="rn-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--md-primary)" stopOpacity=".45" /><stop offset="1" stopColor="var(--md-primary)" stopOpacity=".04" /></linearGradient>
            </defs>
            {[0, 1, 2, 3, 4].map(k => <line key={k} x1={4 + (k / 4) * (W - 8)} x2={4 + (k / 4) * (W - 8)} y1={10} y2={base} stroke="var(--md-outline-variant)" strokeDasharray="2 5" />)}
            <line x1={0} x2={W} y1={base} y2={base} stroke="var(--md-outline-variant)" />
            {!quiet && <path d={`${line} L${pts[pts.length - 1].x},${base} L${pts[0].x},${base} Z`} fill="url(#rn-fill)" />}
            {!quiet && <path d={line} fill="none" stroke="var(--md-primary)" strokeWidth="3" strokeLinecap="round" strokeDasharray={wet ? undefined : '1 6'} />}
            {quiet && <text x={W / 2} y={base - 24} textAnchor="middle" fontSize="13" fill="var(--md-on-surface-variant)">Umbrella can stay in the bag</text>}
            {!wet && !quiet && <text x={W - 6} y={18} textAnchor="end" fontSize="11" fontWeight="600" fill="var(--md-on-surface-variant)">chance of rain, up to {Math.round(maxP)}%</text>}
            {['Now', '+30m', '+1h', '+1½h', '+2h'].map((l, k) => <text key={l} x={4 + (k / 4) * (W - 8)} y={H + 14} textAnchor={k === 0 ? 'start' : k === 4 ? 'end' : 'middle'} fontSize="11" fontWeight="550" fill="var(--md-on-surface-variant)">{l}</text>)}
          </svg>
        )}
      </div>
      {wet && <p className="body-s muted">Heaviest {mm(maxMm)} per 15 min</p>}
    </Card>
  );
}

/* ---------- Outfit ---------- */
const garmentIcon = (s: string) =>
  /umbrella/.test(s) ? 'umbrella' : /sunglass|SPF/i.test(s) ? 'sunny' : /cap|hat|beanie/.test(s) ? 'face' : /glove/.test(s) ? 'back_hand'
    : /scarf/.test(s) ? 'ac_unit' : /reflective|cycling/.test(s) ? 'directions_bike' : /wind/.test(s) ? 'air' : /sock/.test(s) ? 'footprint'
    : /jacket|coat|rain/.test(s) ? 'checkroom' : /sweater|cardigan|fleece|overshirt/.test(s) ? 'styler' : /pants|jeans|shorts|trousers|skirt/.test(s) ? 'dry_cleaning' : 'apparel';

export function OutfitCard({ weather, className = 's4' }: { weather: any; className?: string }) {
  const c = weather.current;
  const h = weather.hourly;
  const i = nowIdx(weather);
  const pop = Math.max(...(h?.precipitation_probability?.slice(i, i + 6) ?? [0]), 0);
  const o = suggestOutfit({ tempC: c.temperatureC, feelsLikeC: c.feelsLikeC, precipProb: pop, windKmh: c.windKmh ?? 0, uvIndex: c.uvIndex ?? 0, isDay: c.isDay, code: c.weatherCode });
  return (
    <Card title="What to wear" icon="checkroom" shape="clover" tone="secondary" sub={o.vibe} className={className}>
      <div className="outfit">
        {o.layers.map(l => <div key={l} className="garment"><Icon name={garmentIcon(l)} />{l}</div>)}
        <div className="garment"><Icon name="footprint" />{o.footwear}</div>
        {o.accessories.map(a => <div key={a} className="garment extra"><Icon name={garmentIcon(a)} />{a}</div>)}
      </div>
    </Card>
  );
}

/* ---------- Should I…? ---------- */
const SCORE_SHAPE: Shape[] = ['sunny', 'cookie9', 'flower', 'clover'];
export function ScoresCard({ weather, className = 's4' }: { weather: any; className?: string }) {
  const c = weather.current, h = weather.hourly, i = nowIdx(weather);
  const icons: Record<string, string> = { bike: 'directions_bike', outside: 'park', laundry: 'local_laundry_service', sleep: 'bedtime' };
  const scores = allScores({
    tempC: c.temperatureC, feelsLikeC: c.feelsLikeC, windKmh: c.windKmh, gustKmh: c.windGustKmh, precipMm: c.precipitation,
    precipProb: h?.precipitation_probability?.[i], humidity: c.humidity, uv: c.uvIndex, cloudCover: c.cloudCover, isDay: c.isDay,
  });
  const tone = (v: number) => (v >= 70 ? ['var(--md-primary)', 'var(--md-on-primary)'] : v >= 40 ? ['var(--md-tertiary-container)', 'var(--md-on-tertiary-container)'] : ['var(--md-error-container)', 'var(--md-on-error-container)']);
  return (
    <Card title="Should I…?" icon="help" shape="sunny" sub="Scored for right now" className={className}>
      <div className="scores">
        {scores.map((s, k) => {
          const [bg, fg] = tone(s.value);
          return (
            <div key={s.label} className="score">
              <span className={`sh sh-${SCORE_SHAPE[k % 4]}`} style={{ background: bg, color: fg }}><Icon name={icons[s.label]} /></span>
              <div style={{ minWidth: 0 }}>
                <div className="n tnum">{s.value}</div>
                <div className="label-m" style={{ textTransform: 'capitalize' }}>{s.label}</div>
                <div className="body-s muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.verdict}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------- Tomato's take (AI summary + best hour) ---------- */
export function InsightsCard({ weather, air, alerts, className = 's4' }: { weather: any; air: any; alerts: any; className?: string }) {
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
    <section className={`card brand take ${className}`}>
      <header className="card-h">
        <span className="ibadge sh-flower" style={{ background: 'color-mix(in srgb, var(--tm-red) 18%, transparent)' }}><TomatoMark size={30} face mood={lines ? moodFor(weather.current) : 'think'} /></span>
        <div className="grow"><h2>Tomato&apos;s take</h2><p className="sub">{lines ? 'Fresh from the vine' : failed ? 'Offline' : 'Thinking…'}</p></div>
      </header>
      <div className="take-lines">
        {lines ? lines.map((l, i) => <p key={i}>{l}</p>)
          : failed ? <p>No summary right now. The numbers are all still here, though.</p>
          : [92, 70, 82].map(w => <div key={w} className="skel" style={{ height: 18, width: `${w}%`, borderRadius: 9, opacity: .5 }} />)}
      </div>
      {best && (
        <div className="best card-foot">
          <Icon name="star" fill style={{ color: 'var(--tm-red)' }} />
          <div className="grow"><div className="overline" style={{ opacity: .7 }}>Best time outside</div><div className="t tnum">{hhmm(best.iso)}</div></div>
          <span className="body-s" style={{ textAlign: 'right', opacity: .8 }}>{best.reason.replace(/-?\d+°/, m => t(parseInt(m)))}</span>
        </div>
      )}
    </section>
  );
}

/* ---------- Conditions ---------- */
export function DetailsCard({ weather, className = 's4' }: { weather: any; className?: string }) {
  const { press, dist, t, spd, spdUnit } = usePrefs();
  const c = weather.current, h = weather.hourly, i = nowIdx(weather);
  const p3 = h?.pressure_msl?.[Math.max(0, i - 3)], p0 = h?.pressure_msl?.[i];
  const trend = p3 != null && p0 != null ? p0 - p3 : 0;
  const dew = c.dewPointC ?? 0;
  const dewLbl = dew < 10 ? 'dry' : dew < 16 ? 'comfortable' : dew < 20 ? 'sticky' : 'oppressive';
  const uv = c.uvIndex ?? 0;
  return (
    <Card title="Conditions" icon="tune" shape="cookie12" className={className}>
      <div className="tiles">
        <div className="tile"><span className="k"><Icon name="light_mode" />UV index</span><span className="v tnum">{Math.round(uv)}<small>{uvLabel(uv)}</small></span>
          <div className="meter seg5" style={{ height: 6, marginTop: 6 }}><b style={{ left: `${Math.min(100, (uv / 11) * 100)}%`, width: 12, height: 12, top: -3, borderWidth: 3 }} /></div></div>
        <div className="tile"><span className="k"><Icon name="compress" />Pressure</span><span className="v tnum">{press(c.pressure)}</span>
          <span className="note row" style={{ gap: 4 }}><Icon name={trend > 0.7 ? 'trending_up' : trend < -0.7 ? 'trending_down' : 'trending_flat'} className="sm" />{trend > 0.7 ? 'rising' : trend < -0.7 ? 'falling' : 'steady'}</span></div>
        <div className="tile"><span className="k"><Icon name="visibility" />Visibility</span><span className="v tnum">{dist(c.visibilityKm)}</span>
          <span className="note">{(c.visibilityKm ?? 10) >= 10 ? 'crystal clear' : (c.visibilityKm ?? 10) >= 4 ? 'a bit hazy' : 'poor'}</span></div>
        <div className="tile"><span className="k"><Icon name="dew_point" />Dew point</span><span className="v tnum">{t(c.dewPointC)}</span><span className="note">{dewLbl}</span></div>
        <div className="tile"><span className="k"><Icon name="cloud" />Clouds</span><span className="v tnum">{Math.round(c.cloudCover ?? 0)}<small>%</small></span>
          <div className="meter" style={{ height: 6, marginTop: 6 }}><i style={{ width: `${c.cloudCover ?? 0}%`, background: 'var(--md-outline)' }} /></div></div>
        <div className="tile"><span className="k"><Icon name="storm" />Gusts</span><span className="v tnum">{spd(c.windGustKmh)}<small>{spdUnit}</small></span>
          <span className="note">{(c.windGustKmh ?? 0) >= 60 ? 'hold onto your hat' : (c.windGustKmh ?? 0) >= 35 ? 'blustery' : 'manageable'}</span></div>
      </div>
    </Card>
  );
}

/* ---------- Wind ---------- */
const BEAUFORT = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];
const BF_NAME = ['Calm', 'Light air', 'Light breeze', 'Gentle breeze', 'Moderate breeze', 'Fresh breeze', 'Strong breeze', 'Near gale', 'Gale', 'Strong gale', 'Storm', 'Violent storm', 'Hurricane'];
export function WindCard({ weather, className = 's4' }: { weather: any; className?: string }) {
  const { spd, spdUnit } = usePrefs();
  const c = weather.current, h = weather.hourly, i0 = nowIdx(weather);
  const deg = c.windDirection ?? 0;
  const k = c.windKmh ?? 0;
  const bf = BEAUFORT.findIndex(b => k < b); const force = bf < 0 ? 12 : bf;
  const next = Array.from({ length: 12 }, (_, j) => i0 + j).filter(j => j < (h?.time?.length ?? 0));
  const gmax = Math.max(10, ...next.map(j => h.wind_gusts_10m?.[j] ?? 0));
  return (
    <Card title="Wind" icon="air" shape="burst" className={className}>
      <div className="row" style={{ gap: 18 }}>
        <svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label={`Wind from ${compass(deg)}`} style={{ flex: 'none' }}>
          <circle cx="66" cy="66" r="62" fill="var(--md-surface-container-high)" />
          {Array.from({ length: 36 }, (_, j) => (
            <line key={j} x1="66" y1="8" x2="66" y2={j % 9 === 0 ? 18 : 13} stroke="var(--md-on-surface-variant)" strokeOpacity={j % 9 === 0 ? .9 : .35} strokeWidth={j % 9 === 0 ? 2 : 1.2} transform={`rotate(${j * 10} 66 66)`} />
          ))}
          {['N', 'E', 'S', 'W'].map((l, j) => {
            const a = (j * 90 - 90) * Math.PI / 180;
            return <text key={l} x={66 + Math.cos(a) * 40} y={66 + Math.sin(a) * 40 + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--md-on-surface-variant)">{l}</text>;
          })}
          <g style={{ transform: `rotate(${deg + 180}deg)`, transformOrigin: '66px 66px', transition: 'transform 900ms var(--ease-spring)' }}>
            <path d="M66 14 L76 34 L66 29 L56 34 Z" fill="var(--md-primary)" />
            <line x1="66" y1="30" x2="66" y2="112" stroke="var(--md-primary)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="66" cy="112" r="5" fill="var(--md-primary)" />
          </g>
          <circle cx="66" cy="66" r="22" fill="var(--md-surface-container)" />
          <text x="66" y="70" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--md-on-surface)">{spd(k)}</text>
        </svg>
        <div style={{ minWidth: 0 }}>
          <div className="headline-s expressive">{BF_NAME[force]}</div>
          <div className="body-m muted">From {compass(deg)} · {spdUnit}</div>
          <div className="body-m">Gusts <b className="tnum">{spd(c.windGustKmh)}</b></div>
          <div className="row" style={{ gap: 3, marginTop: 10 }} aria-label={`Beaufort force ${force}`}>
            {Array.from({ length: 12 }, (_, j) => <i key={j} style={{ width: 8, height: 6 + j, borderRadius: 2, background: j < force ? 'var(--md-primary)' : 'var(--md-surface-container-highest)' }} />)}
          </div>
        </div>
      </div>
      {next.length > 0 && (
        <div className="card-foot">
          <div className="overline muted" style={{ marginBottom: 8 }}>Next 12 hours</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 64 }}>
            {next.map(j => {
              const w = h.wind_speed_10m[j] ?? 0, g = h.wind_gusts_10m?.[j] ?? w;
              return (
                <div key={j} style={{ flex: 1, position: 'relative', height: '100%' }} title={`${hour12(h.time[j])}: ${spd(w)} gusts ${spd(g)}`}>
                  <i style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${(g / gmax) * 100}%`, borderRadius: 4, background: 'var(--md-primary)', opacity: .22 }} />
                  <i style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${(w / gmax) * 100}%`, borderRadius: 4, background: 'var(--md-primary)' }} />
                </div>
              );
            })}
          </div>
          <div className="row between label-s muted" style={{ marginTop: 4 }}><span>Now</span><span>{hour12(h.time[next[next.length - 1]])}</span></div>
        </div>
      )}
    </Card>
  );
}

/* ---------- Sun arc ---------- */
export function SunCard({ weather, className = 's4' }: { weather: any; className?: string }) {
  const [ref, W, Hc] = useSize<HTMLDivElement>();
  const d = weather.daily; if (!d?.sunrise) return null;
  const sr = d.sunrise[0], ss = d.sunset[0];
  const mins = (iso: string) => { const p = localParts(iso); return p.h * 60 + p.mi; };
  const a = mins(sr), b = mins(ss), n = mins(weather.current.time ?? '');
  const f = Math.max(0, Math.min(1, (n - a) / (b - a)));
  const dl = d.daylight_duration?.[0] ?? (b - a) * 60;
  const tom = d.daylight_duration?.[1];
  const diff = tom ? Math.round(tom - dl) : null;
  const up = n >= a && n <= b;
  const H = Math.max(130, Hc), base = H - 22, pad = 16, amp = Math.min(base - 16, (W - 2 * pad) * 0.42);
  const P = (t: number) => ({ x: pad + t * (W - 2 * pad), y: base - Math.sin(t * Math.PI) * amp });
  const arc = W ? Array.from({ length: 41 }, (_, k) => P(k / 40)) : [];
  const done = arc.filter((_, k) => k / 40 <= f);
  const sun = P(f);
  return (
    <Card title="Sun" icon="wb_twilight" shape="sunny" className={className}>
      <div ref={ref} style={{ flex: 1, minHeight: 130, position: 'relative' }}>
        {W > 0 && (
          <svg width={W} height={H} role="img" aria-label="Sun position" style={{ position: 'absolute', inset: 0 }}>
            <defs><linearGradient id="sun-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--md-tertiary)" stopOpacity=".28" /><stop offset="1" stopColor="var(--md-tertiary)" stopOpacity="0" /></linearGradient></defs>
            {up && done.length > 1 && <path d={`${smooth(done)} L${done[done.length - 1].x},${base} L${pad},${base} Z`} fill="url(#sun-sky)" />}
            <path d={smooth(arc)} fill="none" stroke="var(--md-outline-variant)" strokeWidth="2.5" strokeDasharray="2 6" strokeLinecap="round" />
            {up && done.length > 1 && <path d={smooth(done)} fill="none" stroke="var(--md-tertiary)" strokeWidth="4" strokeLinecap="round" />}
            <line x1="0" x2={W} y1={base} y2={base} stroke="var(--md-outline-variant)" strokeWidth="1.5" />
            {up && <><circle cx={sun.x} cy={sun.y} r="18" fill="var(--md-tertiary)" opacity=".18" /><circle cx={sun.x} cy={sun.y} r="10" fill="var(--md-tertiary)" stroke="var(--md-surface-container)" strokeWidth="3" /></>}
            {!up && <text x={W / 2} y={base - 30} textAnchor="middle" fontSize="13" fill="var(--md-on-surface-variant)">{n < a ? `Rises in ${Math.floor((a - n) / 60)}h ${(a - n) % 60}m` : 'Below the horizon'}</text>}
          </svg>
        )}
      </div>
      <div className="row between">
        <div><div className="label-m muted">Sunrise</div><div className="title-m tnum">{hhmm(sr)}</div></div>
        <div style={{ textAlign: 'center' }}><div className="label-m muted">Daylight</div><div className="title-m tnum">{Math.floor(dl / 3600)}h {Math.round((dl % 3600) / 60)}m</div>
          {diff != null && <div className="label-s muted">{diff >= 0 ? '+' : '−'}{Math.floor(Math.abs(diff) / 60)}m {Math.abs(diff) % 60}s tomorrow</div>}</div>
        <div style={{ textAlign: 'right' }}><div className="label-m muted">Sunset</div><div className="title-m tnum">{hhmm(ss)}</div></div>
      </div>
    </Card>
  );
}

/* ---------- Sources: where each one sits relative to the median ---------- */
// Greedy label lanes (0 below, 1 above, 2 further below, …) so close-together names don't overlap.
function lanes(xs: number[], gap = 13) {
  const last: number[] = [];
  return xs.map(x => {
    let l = 0;
    while (last[l] != null && x - last[l] < gap) l++;
    last[l] = x;
    return Math.min(l, 3);
  });
}

export function SourcesCard({ weather, className = 's12' }: { weather: any; className?: string }) {
  const { t, temp, spd, spdUnit } = usePrefs();
  const { readings, failed } = weather.sources;
  const spread = weather.current.spreadC ?? 0;
  const level = spread < 1.5 ? ['good', 'Strong agreement'] : spread < 3 ? ['med', 'Some disagreement'] : ['bad', 'Sources disagree'];
  const med = weather.current.temperatureC;
  const vals = readings.map((r: any) => r.tempC).filter((v: any) => typeof v === 'number');
  const lo = Math.min(med - 1.5, ...vals) - 0.5, hi = Math.max(med + 1.5, ...vals) + 0.5;
  const P = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const sorted = [...readings].filter((r: any) => r.tempC != null).sort((a: any, b: any) => a.tempC - b.tempC);
  return (
    <Card title="Source check" icon="fact_check" shape="cookie7" sub={`Median of ${readings.length} independent forecasts: ${t(med)}`} className={className}
      action={<span className={`pill ${level[0]}`}><Icon name={level[0] === 'good' ? 'check_circle' : 'warning'} className="sm" />{level[1]} · ±{(Math.round(temp(spread) * 10 - (temp(0) * 10)) / 10).toFixed(1)}°</span>}>
      <div className="dotplot" aria-label="Temperature by source">
        <div className="axis" />
        {vals.length > 0 && <div className="band" style={{ left: `${P(Math.min(...vals))}%`, width: `${Math.max(1, P(Math.max(...vals)) - P(Math.min(...vals)))}%` }} />}
        <div className="med" style={{ left: `${P(med)}%` }} title={`Median ${t(med)}`} />
        {lanes(sorted.map((r: any) => P(r.tempC))).map((lane, k) => {
          const r = sorted[k];
          return (
            <div key={r.id} className={`pt ${lane % 2 ? 'up' : 'down'}`} style={{ left: `${P(r.tempC)}%` }} title={`${r.name}: ${t(r.tempC)}`}>
              <span style={lane % 2 ? { bottom: 16 + (lane >> 1) * 14 } : { top: 16 + (lane >> 1) * 14 }}>{r.name.replace(/ (IFS|forecast)$/, '')}</span>
            </div>
          );
        })}
      </div>
      <div className="src-list">
        {readings.map((r: any) => {
          const d = r.tempC != null ? r.tempC - med : 0;
          return (
            <div key={r.id} className="src">
              <span className="dot" />
              <div className="grow"><div className="title-s" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                <div className="label-s muted">{r.kind === 'model' ? 'model' : 'forecast'}{r.windKmh != null ? ` · ${spd(r.windKmh)} ${spdUnit}` : ''}</div></div>
              <div style={{ textAlign: 'right' }}><div className="title-m tnum">{t(r.tempC)}</div>
                <div className="label-s tnum" style={{ color: Math.abs(d) > 1.5 ? 'var(--md-error)' : 'var(--md-on-surface-variant)' }}>{d >= 0 ? '+' : '−'}{Math.abs(temp(d) - temp(0)).toFixed(1)}°</div></div>
            </div>
          );
        })}
        {failed.map((f: string) => <div key={f} className="src" style={{ opacity: .6 }}><span className="dot" style={{ background: 'var(--md-outline)' }} /><div className="grow title-s">{f}</div><span className="label-s">offline</span></div>)}
      </div>
    </Card>
  );
}
