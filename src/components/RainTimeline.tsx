'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Droplets } from 'lucide-react';

type Bucket = { time: string; mm: number; prob: number; src?: string };

export function RainTimeline({ lat, lon }: { lat: number; lon: number }) {
  const [data, setData] = useState<{ headline: string; timeline: Bucket[] } | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/rain?lat=${lat}&lon=${lon}`)
      .then(r => r.json())
      .then(j => alive && setData(j))
      .catch(() => {});
    return () => { alive = false; };
  }, [lat, lon]);

  // Auto-pin selection on the wettest bucket so there's always something to read
  const autoIdx = useMemo(() => {
    if (!data?.timeline?.length) return null;
    let best = 0;
    for (let i = 0; i < data.timeline.length; i++) {
      if (data.timeline[i].mm > data.timeline[best].mm) best = i;
    }
    return data.timeline[best].mm > 0.02 ? best : null;
  }, [data]);

  if (!data) return null;
  const tl = data.timeline;
  if (!tl.length) return null;

  const W = 600;
  const H = 140;
  const PADX = 18;
  const PADY = 18;
  const innerW = W - PADX * 2;
  const innerH = H - PADY * 2;

  const max = Math.max(0.3, ...tl.map(b => b.mm));
  const ceil = Math.max(1, max);

  const xs = tl.map((_, i) => PADX + (i / Math.max(1, tl.length - 1)) * innerW);
  const ys = tl.map(b => PADY + innerH - (b.mm / ceil) * innerH);

  // Smooth path via Catmull-Rom → Bezier
  const path = smoothPath(xs, ys);
  const areaPath = `${path} L ${xs[xs.length - 1]} ${PADY + innerH} L ${xs[0]} ${PADY + innerH} Z`;

  const activeIdx = sel ?? autoIdx;
  const active = activeIdx != null ? tl[activeIdx] : null;

  function pickNearest(clientX: number) {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((clientX - r.left) / r.width) * W;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < xs.length; i++) {
      const d = Math.abs(xs[i] - x);
      if (d < bestD) { bestD = d; best = i; }
    }
    setSel(best);
  }

  // Time labels (4 ticks)
  const tickCount = Math.min(4, tl.length);
  const tickIdxs = Array.from({ length: tickCount }, (_, k) => Math.round(k * (tl.length - 1) / (tickCount - 1)));

  // Y-axis ticks for mm scale
  const yTicks = [0, ceil / 2, ceil].map(v => ({
    v,
    y: PADY + innerH - (v / ceil) * innerH,
  }));

  return (
    <section className="card">
      <div className="card-head">
        <h2>Next 2 hours</h2>
        <span className="meta">{data.headline}</span>
      </div>

      <div className="rain-line-wrap">
        <svg
          ref={svgRef}
          className="rain-line"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Rain forecast next 2 hours"
          onMouseMove={(e) => pickNearest(e.clientX)}
          onMouseLeave={() => setSel(null)}
          onClick={(e) => pickNearest(e.clientX)}
          onTouchStart={(e) => e.touches[0] && pickNearest(e.touches[0].clientX)}
          onTouchMove={(e) => e.touches[0] && pickNearest(e.touches[0].clientX)}
        >
          <defs>
            <linearGradient id="rainFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(122,162,247,0.55)" />
              <stop offset="100%" stopColor="rgba(122,162,247,0.02)" />
            </linearGradient>
            <linearGradient id="rainStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#9d7cd8" />
              <stop offset="100%" stopColor="#7aa2f7" />
            </linearGradient>
          </defs>

          {/* gridlines */}
          {yTicks.map((t, i) => (
            <line key={i} x1={PADX} x2={W - PADX} y1={t.y} y2={t.y}
              stroke="rgba(157,124,216,0.08)" strokeWidth="1" strokeDasharray="2 4" />
          ))}

          <path d={areaPath} fill="url(#rainFill)" />
          <path d={path} fill="none" stroke="url(#rainStroke)" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" />

          {/* clickable points */}
          {tl.map((b, i) => {
            const isActive = i === activeIdx;
            const dry = b.mm < 0.02;
            return (
              <circle
                key={i}
                cx={xs[i]} cy={ys[i]}
                r={isActive ? 5 : (dry ? 2 : 3)}
                fill={isActive ? '#fff' : (dry ? 'rgba(220,215,232,0.35)' : '#9d7cd8')}
                stroke={isActive ? '#9d7cd8' : 'transparent'}
                strokeWidth={isActive ? 2 : 0}
                style={{ cursor: 'pointer', transition: 'r 120ms' }}
                onClick={(e) => { e.stopPropagation(); setSel(i); }}
              />
            );
          })}

          {/* active vertical line + label */}
          {activeIdx != null && (
            <line x1={xs[activeIdx]} x2={xs[activeIdx]} y1={PADY} y2={PADY + innerH}
              stroke="rgba(157,124,216,0.4)" strokeWidth="1" strokeDasharray="2 3" />
          )}
        </svg>

        {/* axis labels */}
        <div className="rain-line__axis">
          {tickIdxs.map(i => (
            <span key={i} style={{ left: `${(xs[i] / W) * 100}%` }}>
              {tl[i].time.slice(11, 16)}
            </span>
          ))}
        </div>
      </div>

      {/* live readout for active bucket */}
      <div className="rain-line__readout" role="status">
        {active ? (
          <>
            <span className="rain-line__time"><Droplets size={13} /> {active.time.slice(11, 16)}</span>
            <span className="rain-line__mm">{active.mm.toFixed(2)} mm/h</span>
            <span className="rain-line__prob">· {active.prob}% chance</span>
            {active.src && <span className="rain-line__src">· {active.src}</span>}
          </>
        ) : (
          <span className="rain-line__hint">Tap or hover the graph for a per-minute readout</span>
        )}
      </div>
    </section>
  );
}

function smoothPath(xs: number[], ys: number[]): string {
  if (xs.length === 0) return '';
  if (xs.length === 1) return `M ${xs[0]} ${ys[0]}`;
  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i - 1] ?? xs[i];
    const y0 = ys[i - 1] ?? ys[i];
    const x1 = xs[i];
    const y1 = ys[i];
    const x2 = xs[i + 1];
    const y2 = ys[i + 1];
    const x3 = xs[i + 2] ?? x2;
    const y3 = ys[i + 2] ?? y2;
    const cp1x = x1 + (x2 - x0) / 6;
    const cp1y = y1 + (y2 - y0) / 6;
    const cp2x = x2 - (x3 - x1) / 6;
    const cp2y = y2 - (y3 - y1) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  }
  return d;
}
