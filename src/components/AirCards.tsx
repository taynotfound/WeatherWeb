'use client';

import { Card, Icon, hour12 } from './ui';
import { Ring } from './charts';
import { nowIdx } from './TodayCards';
import { LineChart } from './charts';
import { uvLabel } from '@/lib/wx';

const AQ_COLORS = ['#43a047', '#9ccc65', '#fdd835', '#fb8c00', '#e53935', '#8e24aa'];
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

export function AqiCard({ air }: { air: any }) {
  if (!air || air.error) return <div className="skel" style={{ height: 200 }} />;
  const us = air.us_aqi ?? (air.eu_aqi != null ? air.eu_aqi * 2 : null);
  if (us == null) return <Card title="Air quality" icon="masks"><p className="body-m muted">No air-quality data for this location.</p></Card>;
  const b = usBand(us);
  const pol: [string, number | null, string][] = [['PM2.5', air.pm2_5, 'µg/m³'], ['PM10', air.pm10, 'µg/m³'], ['Ozone', air.o3, 'µg/m³'], ['NO₂', air.no2, 'µg/m³'], ['SO₂', air.so2, 'µg/m³'], ['CO', air.co, 'µg/m³']];
  return (
    <Card title="Air quality" icon="masks" sub={air.sources?.join(' + ')}>
      <div className="row" style={{ gap: 20 }}>
        <Ring value={Math.min(100, (us / 300) * 100)} size={112} stroke={12} color={AQ_COLORS[b]}><div style={{ textAlign: 'center' }}><div className="headline-m tnum">{Math.round(us)}</div><div className="label-s muted">US AQI</div></div></Ring>
        <div><div className="title-l">{AQ_LABEL[b]}</div><p className="body-m muted" style={{ marginTop: 4 }}>{AQ_TIP[b]}</p></div>
      </div>
      <div className="stat-grid">
        {pol.filter(p => p[1] != null).map(([n, v, u]) => (
          <div key={n} className="stat"><span className="label-m muted">{n}</span><span className="title-l tnum">{Math.round((v as number) * 10) / 10}</span><span className="label-s muted">{u}</span></div>
        ))}
      </div>
    </Card>
  );
}

export function PollenCard({ air }: { air: any }) {
  const p = air?.pollen; if (!p) return null;
  const items: [string, number | null][] = [['Grass', p.grass], ['Birch', p.birch], ['Alder', p.alder], ['Mugwort', p.mugwort], ['Olive', p.olive], ['Ragweed', p.ragweed]];
  const have = items.filter(([, v]) => typeof v === 'number');
  if (!have.length) return null;
  const lvl = (v: number) => (v < 10 ? 0 : v < 50 ? 1 : v < 200 ? 2 : 3);
  const names = ['Low', 'Moderate', 'High', 'Very high'];
  const colors = ['#43a047', '#fdd835', '#fb8c00', '#e53935'];
  const max = Math.max(...have.map(([, v]) => v as number));
  return (
    <Card title="Pollen" icon="local_florist" sub="grains per m³, current">
      <p className="title-m">{max < 10 ? 'Pollen is low. Good news for allergies.' : `Peak: ${names[lvl(max)].toLowerCase()} (${p.top?.type ?? ''})`}</p>
      {have.map(([n, v]) => (
        <div key={n} className="row"><span className="body-m" style={{ width: 70 }}>{n}</span>
          <div className="meter grow"><i style={{ width: `${Math.max(2, Math.min(100, ((v as number) / 200) * 100))}%`, background: colors[lvl(v as number)] }} /></div>
          <span className="label-m tnum" style={{ width: 44, textAlign: 'right' }}>{Math.round(v as number)}</span></div>
      ))}
    </Card>
  );
}

export function UvCard({ weather }: { weather: any }) {
  const h = weather.hourly; if (!h) return null;
  const s = nowIdx(weather);
  const day0 = h.time[s]?.slice(0, 10);
  const idx = h.time.map((t: string, i: number) => i).filter((i: number) => h.time[i].slice(0, 10) === day0);
  const uv = weather.current.uvIndex ?? 0;
  const peak = Math.max(...idx.map((i: number) => h.uv_index?.[i] ?? 0));
  const band = Math.min(4, Math.floor(uv / 3));
  return (
    <Card title="UV index" icon="light_mode" tone={peak >= 8 ? 'tertiary' : undefined}>
      <div className="row between"><div className="display-s tnum">{Math.round(uv)}</div><span className="pill">{uvLabel(uv)}</span></div>
      <div className="meter seg5"><b style={{ left: `${Math.min(100, (uv / 12) * 100)}%` }} /></div>
      <LineChart labels={idx.map((i: number) => hour12(h.time[i]))} fmt={v => v.toFixed(0)} height={110}
        series={[{ label: 'UV', color: 'var(--md-tertiary)', values: idx.map((i: number) => h.uv_index?.[i] ?? 0) }]} />
      <p className="body-m">{peak < 3 ? 'No sun protection needed today.' : peak < 6 ? 'Sunscreen if you are out for long.' : peak < 8 ? 'SPF 30+, hat, shade at midday.' : 'SPF 50, cover up, avoid midday sun.'}</p>
    </Card>
  );
}
