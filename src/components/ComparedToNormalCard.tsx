'use client';

// ComparedToNormalCard — fetches /api/anomaly with today's max temp & precip,
// shows today vs the seasonal normal.

import { useEffect, useState } from 'react';
import { Thermometer, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useUnits } from '@/lib/units';
import type { Anomaly } from '@/lib/anomaly';

type Props = {
  lat: number;
  lon: number;
  todayMaxC: number | null;
  todayPrecipMm: number | null;
};

export function ComparedToNormalCard({ lat, lon, todayMaxC, todayPrecipMm }: Props) {
  const { temp, tempUnit } = useUnits();
  const [data, setData] = useState<Anomaly | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (todayMaxC == null) return;
    const ctrl = new AbortController();
    const url = `/api/anomaly?lat=${lat}&lon=${lon}&todayMax=${todayMaxC}&todayPrecip=${todayPrecipMm ?? 0}`;
    fetch(url, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((j: Anomaly) => setData(j))
      .catch(() => setErr(true));
    return () => ctrl.abort();
  }, [lat, lon, todayMaxC, todayPrecipMm]);

  if (err || !data) return null;

  const abs = Math.abs(data.deltaC);
  const trend = abs < 0.5 ? 'flat' : data.deltaC > 0 ? 'up' : 'down';
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const tone = abs > 4 ? 'warn' : abs > 2 ? 'info' : 'good';

  return (
    <article className={`insight-card insight-card--${tone}`} aria-label="Today vs normal">
      <div className="insight-card__label">
        <Thermometer size={11} /> vs normal
      </div>
      <div className="insight-card__answer" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon size={20} />
        {abs < 0.5 ? 'on par' : `${data.deltaC > 0 ? '+' : ''}${(temp(data.deltaC + data.normalMaxC) - temp(data.normalMaxC)).toFixed(1)}${tempUnit}`}
      </div>
      <div className="insight-card__sub">
        normal high {Math.round(temp(data.normalMaxC))}{tempUnit}
        {Math.abs(data.precipDeltaMm) > 2 && (data.precipDeltaMm > 0 ? ' · wetter than usual' : ' · drier than usual')}
      </div>
    </article>
  );
}
