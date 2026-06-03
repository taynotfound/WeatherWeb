'use client';

import { useMemo, useRef, useState } from 'react';
import { Thermometer, Wind } from 'lucide-react';
import { useUnits } from '@/lib/units';

type Props = { weather: any };

export function TempCurveCard({ weather }: Props) {
  const { temp, tempUnit } = useUnits();
  const [sel, setSel] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const data = useMemo(() => {
    const h = weather?.hourly;
    if (!h?.time?.length) return null;
    // Find index of "now" then take next 24 entries
    const now = Date.now();
    let start = 0;
    for (let i = 0; i < h.time.length; i++) {
      if (new Date(h.time[i]).getTime() >= now - 1800_000) { start = i; break; }
    }
    const end = Math.min(start + 24, h.time.length);
    const times = h.time.slice(start, end);
    const tempsC = h.temperature_2m?.slice(start, end) ?? [];
    const feelsC = h.apparent_temperature?.slice(start, end) ?? [];
    const pops = h.precipitation_probability?.slice(start, end) ?? [];
    if (!tempsC.length) return null;
    return { times, tempsC, feelsC, pops };
  }, [weather]);

  if (!data) return null;
  const { times, tempsC, feelsC, pops } = data;
  const n = times.length;
  const W = 600;
  const H = 180;
  const PADX = 24;
  const PADY = 24;
  const innerW = W - PADX * 2;
  const innerH = H - PADY * 2;

  const allTemps = [...tempsC, ...feelsC].filter((v) => typeof v === 'number');
  const tMin = Math.floor(Math.min(...allTemps) - 1);
  const tMax = Math.ceil(Math.max(...allTemps) + 1);
  const tRange = Math.max(1, tMax - tMin);

  const xs = times.map((_: string, i: number) => PADX + (i / Math.max(1, n - 1)) * innerW);
  const yFor = (v: number) => PADY + innerH - ((v - tMin) / tRange) * innerH;

  const tempPath = pathFromPoints(xs, tempsC.map((v: number) => yFor(v)));
  const feelsPath = pathFromPoints(xs, feelsC.map((v: number) => yFor(v)));

  // POP bars at bottom
  const popH = 22;
  const popY = H - 4 - popH;

  // Auto pick warmest hour as default selection
  const autoIdx = useMemo(() => {
    let best = 0;
    for (let i = 0; i < tempsC.length; i++) {
      if (tempsC[i] > tempsC[best]) best = i;
    }
    return best;
  }, [tempsC]);
  const activeIdx = sel ?? autoIdx;
  const active = {
    time: times[activeIdx],
    t: tempsC[activeIdx],
    f: feelsC[activeIdx],
    pop: pops[activeIdx] ?? 0,
  };

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

  // Y ticks
  const yTicks = [tMin, Math.round((tMin + tMax) / 2), tMax];

  // X tick indices (every 6h)
  const tickIdxs: number[] = [];
  for (let i = 0; i < n; i += 6) tickIdxs.push(i);
  if (tickIdxs[tickIdxs.length - 1] !== n - 1) tickIdxs.push(n - 1);

  return (
    <section className="card">
      <div className="card-head">
        <h2><Thermometer size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />Next 24 hours</h2>
        <span className="meta">{Math.round(temp(tMin))}{tempUnit} → {Math.round(temp(tMax))}{tempUnit}</span>
      </div>

      <div className="temp-curve-wrap">
        <svg
          ref={svgRef}
          className="temp-curve"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Temperature curve next 24 hours"
          onMouseMove={(e) => pickNearest(e.clientX)}
          onMouseLeave={() => setSel(null)}
          onClick={(e) => pickNearest(e.clientX)}
          onTouchStart={(e) => e.touches[0] && pickNearest(e.touches[0].clientX)}
          onTouchMove={(e) => e.touches[0] && pickNearest(e.touches[0].clientX)}
        >
          <defs>
            <linearGradient id="tempStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ff9e64" />
              <stop offset="100%" stopColor="#9d7cd8" />
            </linearGradient>
            <linearGradient id="tempArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,158,100,0.22)" />
              <stop offset="100%" stopColor="rgba(255,158,100,0)" />
            </linearGradient>
          </defs>

          {/* gridlines */}
          {yTicks.map((tv, i) => (
            <g key={i}>
              <line
                x1={PADX} x2={W - PADX} y1={yFor(tv)} y2={yFor(tv)}
                stroke="rgba(157,124,216,0.08)" strokeDasharray="2 4" strokeWidth="1"
              />
              <text x={4} y={yFor(tv) + 3} fontSize="9" fill="rgba(220,215,232,0.5)">
                {Math.round(temp(tv))}°
              </text>
            </g>
          ))}

          {/* temp area */}
          <path d={`${tempPath} L ${xs[n - 1]} ${PADY + innerH} L ${xs[0]} ${PADY + innerH} Z`} fill="url(#tempArea)" />
          {/* feels-like dashed */}
          <path d={feelsPath} fill="none" stroke="rgba(122,162,247,0.55)" strokeWidth="1.5"
            strokeDasharray="3 3" strokeLinecap="round" />
          {/* temp line */}
          <path d={tempPath} fill="none" stroke="url(#tempStroke)" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" />

          {/* POP bars (bottom) */}
          {pops.map((p: number, i: number) => {
            if (!p) return null;
            const barW = Math.max(2, innerW / n - 2);
            const barH = (p / 100) * popH;
            return (
              <rect
                key={i}
                x={xs[i] - barW / 2}
                y={popY + (popH - barH)}
                width={barW}
                height={barH}
                fill="rgba(122,162,247,0.45)"
                rx="1"
              />
            );
          })}

          {/* active marker */}
          {activeIdx != null && (
            <>
              <line x1={xs[activeIdx]} x2={xs[activeIdx]} y1={PADY} y2={popY + popH}
                stroke="rgba(157,124,216,0.45)" strokeWidth="1" strokeDasharray="2 3" />
              <circle cx={xs[activeIdx]} cy={yFor(tempsC[activeIdx])} r="5"
                fill="#fff" stroke="#ff9e64" strokeWidth="2" />
            </>
          )}
        </svg>

        <div className="rain-line__axis">
          {tickIdxs.map(i => (
            <span key={i} style={{ left: `${(xs[i] / W) * 100}%` }}>
              {times[i].slice(11, 16)}
            </span>
          ))}
        </div>
      </div>

      <div className="temp-curve__readout">
        <span className="temp-curve__time">{active.time.slice(11, 16)}</span>
        <span className="temp-curve__t" style={{ color: '#ff9e64' }}>
          {Math.round(temp(active.t))}{tempUnit}
        </span>
        <span className="temp-curve__f">
          feels {Math.round(temp(active.f))}{tempUnit}
        </span>
        {active.pop > 0 && (
          <span className="temp-curve__pop">· {active.pop}% rain</span>
        )}
      </div>

      <div className="temp-curve__legend">
        <span><i className="dot dot--temp" /> temp</span>
        <span><i className="dot dot--feels" /> feels-like</span>
        <span><i className="dot dot--pop" /> rain chance</span>
      </div>
    </section>
  );
}

function pathFromPoints(xs: number[], ys: number[]): string {
  if (!xs.length) return '';
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
