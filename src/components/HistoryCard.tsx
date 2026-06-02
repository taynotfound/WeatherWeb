'use client';

import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { Card } from './ui/Card';
import { useUnits } from '@/lib/units';

type Day = { date: string; tmax: number; tmin: number; precip: number };

export function HistoryCard({ lat, lon }: { lat: number; lon: number }) {
  const [days, setDays] = useState<Day[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { temp, tempUnit } = useUnits();

  useEffect(() => {
    let alive = true;
    const end = new Date(); end.setDate(end.getDate() - 1);
    const start = new Date(); start.setDate(start.getDate() - 7);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
      `&start_date=${fmt(start)}&end_date=${fmt(end)}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    fetch(url).then(r => r.json()).then(j => {
      if (!alive) return;
      const t = j?.daily?.time ?? [];
      const tmax = j?.daily?.temperature_2m_max ?? [];
      const tmin = j?.daily?.temperature_2m_min ?? [];
      const prec = j?.daily?.precipitation_sum ?? [];
      setDays(t.map((d: string, i: number) => ({
        date: d, tmax: tmax[i], tmin: tmin[i], precip: prec[i] ?? 0,
      })));
    }).catch(e => alive && setErr(String(e)));
    return () => { alive = false; };
  }, [lat, lon]);

  if (err) return null;
  if (!days) {
    return (
      <Card id="history" title="Last 7 days" icon={<History size={18} />}>
        <div className="skeleton-stack"><div className="skeleton-line" style={{ height: 80 }} /></div>
      </Card>
    );
  }
  if (days.length === 0) return null;

  const maxT = Math.max(...days.map(d => d.tmax));
  const minT = Math.min(...days.map(d => d.tmin));
  const range = Math.max(1, maxT - minT);

  return (
    <Card id="history" title="Last 7 days" subtitle="High temperature lookback" icon={<History size={18} />}>
      <div className="history-bars">
        {days.map((d, i) => {
          const h = ((d.tmax - minT) / range) * 90 + 10;
          const dt = new Date(d.date + 'T00:00:00');
          const day = dt.toLocaleDateString([], { weekday: 'short' }).slice(0, 2);
          return (
            <div className="history-bar fade-in-up" key={d.date} style={{ animationDelay: `${i * 50}ms` }} title={`${d.date}: ${Math.round(temp(d.tmax))}${tempUnit} / ${Math.round(temp(d.tmin))}${tempUnit}, ${d.precip.toFixed(1)}mm`}>
              <span className="history-bar__temp">{Math.round(temp(d.tmax))}°</span>
              <div className="history-bar__fill" style={{ height: `${h}%` }} />
              <span className="history-bar__day">{day}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
