'use client';

import { Sunrise, Sunset } from 'lucide-react';

function fmt(s: string) {
  const d = new Date(s);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function SunCard({ weather }: { weather: any }) {
  const sr = weather?.daily?.sunrise?.[0];
  const ss = weather?.daily?.sunset?.[0];
  if (!sr || !ss) return null;

  const now = Date.now();
  const start = new Date(sr).getTime();
  const end = new Date(ss).getTime();
  const pct = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));

  return (
    <section className="card">
      <div className="card-head"><h2>Sun</h2></div>
      <div className="sun-row">
        <div className="sun-item">
          <Sunrise size={18} />
          <div><span className="label">Sunrise</span><span className="val">{fmt(sr)}</span></div>
        </div>
        <div className="sun-item">
          <Sunset size={18} />
          <div><span className="label">Sunset</span><span className="val">{fmt(ss)}</span></div>
        </div>
      </div>
      <div className="daily-bar" style={{ marginTop: 14, height: 3 }}>
        <span style={{ left: 0, width: `${pct}%` }} />
      </div>
    </section>
  );
}
