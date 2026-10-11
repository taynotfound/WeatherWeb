'use client';

import { useRef, useState } from 'react';

type Pt = { x: number; y: number };

// Catmull-Rom -> cubic bezier for a smooth but non-overshooting-looking line.
export function smooth(pts: Pt[]) {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    d += ` C${p1.x + (p2.x - p0.x) * t},${p1.y + (p2.y - p0.y) * t} ${p2.x - (p3.x - p1.x) * t},${p2.y - (p3.y - p1.y) * t} ${p2.x},${p2.y}`;
  }
  return d;
}

export type Series = { label: string; values: (number | null)[]; color: string; dashed?: boolean };

/** Line chart with touch/mouse scrubbing. `x` are labels for each index. */
export function LineChart({ series, labels, fmt, height = 180, bars }: {
  series: Series[]; labels: string[]; fmt: (v: number) => string; height?: number;
  bars?: { values: (number | null)[]; label: string };
}) {
  const W = 640, H = height, padL = 8, padR = 8, padT = 22, padB = bars ? 44 : 26;
  const ref = useRef<SVGSVGElement>(null);
  const [hi, setHi] = useState<number | null>(null);
  const n = labels.length;
  const all = series.flatMap(s => s.values).filter((v): v is number => typeof v === 'number');
  if (!n || !all.length) return null;
  const lo = Math.min(...all), hiV = Math.max(...all);
  const pad = Math.max(1, (hiV - lo) * 0.15);
  const y0 = lo - pad, y1 = hiV + pad;
  const X = (i: number) => padL + (i / Math.max(1, n - 1)) * (W - padL - padR);
  const Y = (v: number) => padT + (1 - (v - y0) / (y1 - y0)) * (H - padT - padB);

  const move = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const f = (e.clientX - r.left) / r.width;
    setHi(Math.max(0, Math.min(n - 1, Math.round(((f * W - padL) / (W - padL - padR)) * (n - 1)))));
  };
  const main = series[0];
  const pts = (s: Series) => s.values.map((v, i) => (typeof v === 'number' ? { x: X(i), y: Y(v) } : null)).filter(Boolean) as Pt[];
  const mainPts = pts(main);
  const area = mainPts.length ? `${smooth(mainPts)} L${mainPts[mainPts.length - 1].x},${H - padB} L${mainPts[0].x},${H - padB} Z` : '';
  const maxI = main.values.indexOf(Math.max(...(main.values.filter(v => v != null) as number[])));
  const minI = main.values.indexOf(Math.min(...(main.values.filter(v => v != null) as number[])));
  const step = Math.ceil(n / 7);

  return (
    <div style={{ position: 'relative', touchAction: 'pan-y' }}>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${main.label} chart`}
        onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHi(null)} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={main.color} stopOpacity=".35" /><stop offset="1" stopColor={main.color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {bars && bars.values.map((v, i) => {
          if (!v) return null;
          const h = ((v ?? 0) / 100) * 30;
          return <rect key={i} x={X(i) - 5} y={H - padB + 6 + (30 - h)} width="10" height={Math.max(1.5, h)} rx="3" fill="var(--md-tertiary)" opacity={v ? .8 : .25} />;
        })}
        <path d={area} fill="url(#lc-fill)" />
        {series.slice(1).map((s, k) => (
          <path key={k} d={smooth(pts(s))} fill="none" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? '5 5' : undefined} opacity=".8" />
        ))}
        <path d={smooth(mainPts)} fill="none" stroke={main.color} strokeWidth="3.5" strokeLinecap="round" />
        {[maxI, minI].map((i, k) => main.values[i] != null && (
          <g key={k}>
            <circle cx={X(i)} cy={Y(main.values[i]!)} r="4.5" fill="var(--md-surface-container)" stroke={main.color} strokeWidth="2.5" />
            <text x={X(i)} y={Y(main.values[i]!) + (k === 0 ? -10 : 18)} textAnchor="middle" fontSize="12" fontWeight="500" fill="var(--md-on-surface)">{fmt(main.values[i]!)}</text>
          </g>
        ))}
        {labels.map((l, i) => i % step === 0 && (
          <text key={i} x={X(i)} y={H - (bars ? 0 : 6)} textAnchor="middle" fontSize="11" fill="var(--md-on-surface-variant)">{l}</text>
        ))}
        {bars && <text x={W - padR} y={H - padB + 4} textAnchor="end" fontSize="10" fill="var(--md-on-surface-variant)">{bars.label}</text>}
        {hi != null && (
          <g>
            <line x1={X(hi)} x2={X(hi)} y1={padT - 8} y2={H - padB} stroke="var(--md-outline)" strokeDasharray="3 3" />
            {series.map((s, k) => s.values[hi] != null && <circle key={k} cx={X(hi)} cy={Y(s.values[hi]!)} r="5" fill={s.color} stroke="var(--md-surface)" strokeWidth="2" />)}
          </g>
        )}
      </svg>
      {hi != null && (
        <div className="label-m" style={{
          position: 'absolute', top: 0, left: `${(X(hi) / W) * 100}%`, transform: `translateX(${hi > n * 0.7 ? '-100%' : hi < n * 0.3 ? '0' : '-50%'})`,
          background: 'var(--md-inverse-surface)', color: 'var(--md-inverse-on-surface)', padding: '4px 10px', borderRadius: 8, whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          {labels[hi]} · {series.map(s => s.values[hi] != null ? `${s.label} ${fmt(s.values[hi]!)}` : '').filter(Boolean).join(' · ')}
          {bars && bars.values[hi] != null ? ` · ${bars.values[hi]}% rain` : ''}
        </div>
      )}
    </div>
  );
}

export function Ring({ value, size = 84, stroke = 9, color = 'var(--md-primary)', children }: { value: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--md-surface-container-highest)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(100, value)) / 100)} style={{ transition: 'stroke-dashoffset 800ms var(--ease-emph)' }} />
      </svg>
      <div className="v">{children ?? value}</div>
    </div>
  );
}
