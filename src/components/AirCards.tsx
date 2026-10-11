'use client';

import { Card, Icon, hour12 } from './ui';
import { Gauge, LineChart } from './charts';
import { nowIdx } from './TodayCards';
import { uvLabel } from '@/lib/wx';

const AQ_COLORS = ['#43a047', '#c0ca33', '#fdd835', '#fb8c00', '#e53935', '#8e24aa'];
const usBand = (v: number) => (v <= 50 ? 0 : v <= 100 ? 1 : v <= 150 ? 2 : v <= 200 ? 3 : v <= 300 ? 4 : 5);
const AQ_LABEL = ['Good', 'Moderate', 'Unhealthy for sensitive groups', 'Unhealthy', 'Very unhealthy', 'Hazardous'];
const AQ_TIP = [
  'Air is clean. Windows open, run wherever you like.',
  'Fine for most people. Very sensitive folks may notice it.',
  'Sensitive groups should take it easier outdoors.',
  'Cut back on hard outdoor exercise.',
  'Stay inside if you can; a mask helps outdoors.',
  'Avoid going outside.',
];
// WHO 2021 guideline levels (µg/m³) to put each pollutant in context
const WHO: Record<string, number> = { 'PM2.5': 15, PM10: 45, Ozone: 100, 'NO₂': 25, 'SO₂': 40, CO: 4000 };

export function AqiCard({ air, className = 's8' }: { air: any; className?: string }) {
  if (!air || air.error) return <div className={`skel ${className}`} style={{ minHeight: 320 }} />;
  const us = air.us_aqi ?? (air.eu_aqi != null ? air.eu_aqi * 2 : null);
  if (us == null) return <Card title="Air quality" icon="masks" className={className}><p className="body-m muted">No air-quality data for this location.</p></Card>;
  const b = usBand(us);
  const pol: [string, number | null][] = [['PM2.5', air.pm2_5], ['PM10', air.pm10], ['Ozone', air.o3], ['NO₂', air.no2], ['SO₂', air.so2], ['CO', air.co]];
  return (
    <Card title="Air quality" icon="masks" shape="cookie12" sub={air.sources?.join(' + ')} className={className}>
      <div className="row wrap" style={{ gap: 24, alignItems: 'flex-end' }}>
        <Gauge value={Math.min(1, us / 300)} size={200} stops={AQ_COLORS.map((c, i) => [i / 5, c])}>
          <div className="display-s tnum" style={{ fontWeight: 600 }}>{Math.round(us)}</div>
          <div className="label-s muted">US AQI</div>
        </Gauge>
        <div style={{ flex: '1 1 220px', paddingBottom: 6 }}>
          <div className="headline-s expressive" style={{ color: AQ_COLORS[b] }}>{AQ_LABEL[b]}</div>
          <p className="body-l" style={{ marginTop: 4 }}>{AQ_TIP[b]}</p>
        </div>
      </div>
      <div className="tiles" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(max(140px, 30%), 1fr))' }}>
        {pol.filter(p => p[1] != null).map(([n, v]) => {
          const f = (v as number) / WHO[n];
          return (
            <div key={n} className="tile">
              <span className="k">{n}</span>
              <span className="v tnum">{Math.round((v as number) * 10) / 10}<small>µg/m³</small></span>
              <div className="meter" style={{ height: 6 }}><i style={{ width: `${Math.min(100, f * 100)}%`, background: f <= 1 ? '#43a047' : f <= 2 ? '#fb8c00' : '#e53935' }} /></div>
              <span className="note">{f <= 1 ? 'within WHO guideline' : `${f.toFixed(1)}× WHO guideline`}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function PollenCard({ air, className = 's12' }: { air: any; className?: string }) {
  const p = air?.pollen; if (!p) return null;
  const items: [string, number | null][] = [['Grass', p.grass], ['Birch', p.birch], ['Alder', p.alder], ['Mugwort', p.mugwort], ['Olive', p.olive], ['Ragweed', p.ragweed]];
  const have = items.filter(([, v]) => typeof v === 'number');
  if (!have.length) return null;
  const lvl = (v: number) => (v < 10 ? 0 : v < 50 ? 1 : v < 200 ? 2 : 3);
  const names = ['Low', 'Moderate', 'High', 'Very high'];
  const colors = ['#43a047', '#fdd835', '#fb8c00', '#e53935'];
  const max = Math.max(...have.map(([, v]) => v as number));
  return (
    <Card title="Pollen" icon="local_florist" shape="flower" sub="grains per m³, right now" className={className}>
      <p className="title-l expressive">{max < 10 ? 'Pollen is low. Good news for allergies.' : `Peak: ${names[lvl(max)].toLowerCase()} (${p.top?.type ?? ''})`}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px 24px' }}>
        {have.map(([n, v]) => (
          <div key={n} className="row"><span className="body-m" style={{ width: 72 }}>{n}</span>
            <div className="meter grow"><i style={{ width: `${Math.max(2, Math.min(100, ((v as number) / 200) * 100))}%`, background: colors[lvl(v as number)] }} /></div>
            <span className="label-m tnum" style={{ width: 64, textAlign: 'right' }}>{Math.round(v as number)} · {names[lvl(v as number)].split(' ')[0].toLowerCase()}</span></div>
        ))}
      </div>
    </Card>
  );
}

export function UvCard({ weather, className = 's4' }: { weather: any; className?: string }) {
  const h = weather.hourly; if (!h) return null;
  const s = nowIdx(weather);
  const day0 = h.time[s]?.slice(0, 10);
  const idx = h.time.map((_: string, i: number) => i).filter((i: number) => h.time[i].slice(0, 10) === day0 && (h.is_day?.[i] ?? 1) !== 0);
  const uv = weather.current.uvIndex ?? 0;
  const peak = Math.max(0, ...idx.map((i: number) => h.uv_index?.[i] ?? 0));
  return (
    <Card title="UV index" icon="light_mode" shape="sunny" tone={peak >= 8 ? 'tertiary' : undefined} className={className}>
      <div className="row between" style={{ alignItems: 'flex-end' }}>
        <div><div className="display-m tnum" style={{ fontWeight: 500 }}>{Math.round(uv)}</div><div className="title-m">{uvLabel(uv)} now</div></div>
        <div style={{ textAlign: 'right' }}><div className="label-m muted">Peak today</div><div className="title-l tnum">{Math.round(peak)} · {uvLabel(peak)}</div></div>
      </div>
      <div className="meter seg5"><b style={{ left: `${Math.min(100, (uv / 11) * 100)}%` }} /></div>
      {idx.length > 1 && <LineChart labels={idx.map((i: number) => hour12(h.time[i]))} fmt={v => v.toFixed(0)} height={130}
        series={[{ label: 'UV', color: 'var(--md-tertiary)', values: idx.map((i: number) => h.uv_index?.[i] ?? 0) }]} />}
      <p className="body-m card-foot row" style={{ gap: 8 }}><Icon name="sunny" />{peak < 3 ? 'No sun protection needed today.' : peak < 6 ? 'Sunscreen if you are out for long.' : peak < 8 ? 'SPF 30+, hat, shade at midday.' : 'SPF 50, cover up, avoid midday sun.'}</p>
    </Card>
  );
}
