'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useUnits } from '@/lib/units';

type FCData = {
  available: boolean;
  date?: string;
  max?: { previous: number; current: number; delta: number };
  min?: { previous: number; current: number; delta: number };
  pop?: { previous: number; current: number; delta: number };
  precip?: { previous: number; current: number; delta: number };
};

export function ForecastChangeCard({ lat, lon }: { lat: number; lon: number }) {
  const { temp, tempUnit } = useUnits();
  const [data, setData] = useState<FCData | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    setData(null);
    setErr(false);
    fetch(`/api/forecast-change?lat=${lat}&lon=${lon}`)
      .then(r => r.json())
      .then(d => { if (alive) setData(d); })
      .catch(() => { if (alive) setErr(true); });
    return () => { alive = false; };
  }, [lat, lon]);

  if (err || (data && !data.available)) return null;
  if (!data) return null;

  const tu = tempUnit.replace('°F', '°');
  const rows: Array<{ label: string; prev: string; now: string; delta: number; suffix?: string }> = [];

  if (data.max) {
    rows.push({
      label: 'High',
      prev: `${Math.round(temp(data.max.previous))}${tu}`,
      now: `${Math.round(temp(data.max.current))}${tu}`,
      delta: data.max.delta,
    });
  }
  if (data.min) {
    rows.push({
      label: 'Low',
      prev: `${Math.round(temp(data.min.previous))}${tu}`,
      now: `${Math.round(temp(data.min.current))}${tu}`,
      delta: data.min.delta,
    });
  }
  if (data.pop && (Math.abs(data.pop.delta) >= 5)) {
    rows.push({
      label: 'Rain chance',
      prev: `${Math.round(data.pop.previous)}%`,
      now: `${Math.round(data.pop.current)}%`,
      delta: data.pop.delta,
      suffix: '%',
    });
  }

  if (rows.length === 0) return null;

  // Hide if nothing meaningfully changed
  const anyMeaningful = rows.some(r => Math.abs(r.delta) >= 0.5);
  if (!anyMeaningful) return null;

  const fmtDelta = (d: number, suffix = '°') => {
    if (Math.abs(d) < 0.5) return 'same';
    const sign = d > 0 ? '+' : '';
    return `${sign}${d.toFixed(suffix === '%' ? 0 : 1)}${suffix === '%' ? '%' : tu}`;
  };

  const deltaClass = (d: number) =>
    Math.abs(d) < 0.5 ? 'fc-delta--same' : d > 0 ? 'fc-delta--up' : 'fc-delta--down';

  const Icon = ({ d }: { d: number }) =>
    Math.abs(d) < 0.5 ? <Minus size={11} /> : d > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />;

  return (
    <section className="card">
      <div className="card-head">
        <h2>Forecast changed since yesterday</h2>
      </div>
      <div className="forecast-change">
        {rows.map(r => (
          <div key={r.label} className="fc-row">
            <span className="fc-label">{r.label}</span>
            <div className="fc-vals">
              <span className="fc-was">{r.prev}</span>
              <span className="fc-now">{r.now}</span>
              <span className={`fc-delta ${deltaClass(r.delta)}`}>
                <Icon d={r.delta} />
                {' '}{fmtDelta(r.delta, r.suffix)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
