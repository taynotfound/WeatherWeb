'use client';

import { useEffect, useState } from 'react';

type Bucket = { time: string; mm: number; prob: number; src?: string };

export function RainTimeline({ lat, lon }: { lat: number; lon: number }) {
  const [data, setData] = useState<{ headline: string; timeline: Bucket[] } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/rain?lat=${lat}&lon=${lon}`)
      .then(r => r.json())
      .then(j => alive && setData(j))
      .catch(() => {});
    return () => { alive = false; };
  }, [lat, lon]);

  if (!data) return null;

  const max = Math.max(0.3, ...data.timeline.map(b => b.mm));
  // Visual amplification so light drizzle reads as a real bar (1mm scale ceiling baseline).
  const ceil = Math.max(1, max);

  return (
    <section className="card">
      <div className="card-head">
        <h2>Next 2 hours</h2>
        <span className="meta">{data.headline}</span>
      </div>

      <div className="rain-grid">
        {data.timeline.map((b, i) => {
          const h = Math.round((b.mm / ceil) * 70);
          const dry = b.mm < 0.02;
          return (
            <div key={i} className="rain-col" title={`${b.mm.toFixed(2)} mm · ${b.prob}% · ${b.src ?? ''}`}>
              <div
                className={`rain-bar ${dry ? 'dry' : ''}`}
                style={{ height: dry ? 4 : Math.max(h, 6) }}
              />
              <div className="rain-time">{b.time.slice(11, 16)}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
