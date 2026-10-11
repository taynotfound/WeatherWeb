'use client';

import { useId, useState } from 'react';
import { useWidth } from './ui';

type Pt = { x: number; y: number };

// Catmull-Rom -> cubic bezier for a smooth line.
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

/** Line chart drawn at the container's real pixel width, with touch/mouse scrubbing. */
export function LineChart({ series, labels, fmt, height = 180, bars, markers = true }: {
  series: Series[]; labels: string[]; fmt: (v: number) => string; height?: number;
  bars?: { values: (number | null)[]; label: string; color?: string }; markers?: boolean;
}) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const gid = useId().replace(/:/g, '');
  const [hi, setHi] = useState<number | null>(null);
  const n = labels.length;
  const all = series.flatMap(s => s.values).filter((v): v is number => typeof v === 'number');
  const H = height, padL = 4, padR = 4, padT = 26, barH = bars ? 34 : 0, padB = 22 + barH;
  const ok = n > 0 && all.length > 0 && W > 0;
  const lo = ok ? Math.min(...all) : 0, hiV = ok ? Math.max(...all) : 1;
  const pad = Math.max(1, (hiV - lo) * 0.18);
  const y0 = lo - pad, y1 = hiV + pad;
  const X = (i: number) => padL + (i / Math.max(1, n - 1)) * (W - padL - padR);
  const Y = (v: number) => padT + (1 - (v - y0) / (y1 - y0)) * (H - padT - padB);

  const move = (e: React.PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const f = (e.clientX - r.left - padL) / (r.width - padL - padR);
    setHi(Math.max(0, Math.min(n - 1, Math.round(f * (n - 1)))));
  };
  const main = series[0];
  const pts = (s: Series) => s.values.map((v, i) => (typeof v === 'number' ? { x: X(i), y: Y(v) } : null)).filter(Boolean) as Pt[];
  const mainPts = ok ? pts(main) : [];
  const area = mainPts.length ? `${smooth(mainPts)} L${mainPts[mainPts.length - 1].x},${H - padB} L${mainPts[0].x},${H - padB} Z` : '';
  const mv = main.values.filter((v): v is number => v != null);
  const maxI = main.values.indexOf(Math.max(...mv));
  const minI = main.values.indexOf(Math.min(...mv));
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(W / 64))));
  const bw = Math.max(2, Math.min(10, (W / Math.max(1, n)) * 0.55));

  return (
    <div ref={ref} style={{ position: 'relative', touchAction: 'pan-y', height: H }}
      onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHi(null)}>
      {ok && (
        <svg width={W} height={H} role="img" aria-label={`${main.label} chart`} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={`f${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={main.color} stopOpacity=".32" /><stop offset="1" stopColor={main.color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map(f => <line key={f} x1={0} x2={W} y1={padT + f * (H - padT - padB)} y2={padT + f * (H - padT - padB)} stroke="var(--md-outline-variant)" strokeOpacity=".5" strokeDasharray="2 6" />)}
          {bars && bars.values.map((v, i) => {
            if (!v) return null;
            const h = (v / 100) * (barH - 8);
            return <rect key={i} x={X(i) - bw / 2} y={H - 22 - h} width={bw} height={Math.max(2, h)} rx={Math.min(3, bw / 2)} fill={bars.color ?? 'var(--md-primary)'} opacity={0.25 + (v / 100) * 0.6} />;
          })}
          <path d={area} fill={`url(#f${gid})`} />
          {series.slice(1).map((s, k) => (
            <path key={k} d={smooth(pts(s))} fill="none" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? '4 5' : undefined} strokeLinecap="round" opacity=".85" />
          ))}
          <path d={smooth(mainPts)} fill="none" stroke={main.color} strokeWidth="3.5" strokeLinecap="round" />
          {markers && [maxI, minI].map((i, k) => main.values[i] != null && (
            <g key={k}>
              <circle cx={X(i)} cy={Y(main.values[i]!)} r="5" fill="var(--md-surface-container)" stroke={main.color} strokeWidth="3" />
              <text x={Math.min(W - 14, Math.max(14, X(i)))} y={Y(main.values[i]!) + (k === 0 ? -12 : 22)} textAnchor="middle" fontSize="13" fontWeight="650" fill="var(--md-on-surface)">{fmt(main.values[i]!)}</text>
            </g>
          ))}
          {labels.map((l, i) => i % every === 0 && (
            <text key={i} x={X(i)} y={H - 4} textAnchor={i === 0 ? 'start' : 'middle'} fontSize="11" fontWeight="550" fill="var(--md-on-surface-variant)">{l}</text>
          ))}
          {hi != null && (
            <g>
              <line x1={X(hi)} x2={X(hi)} y1={padT - 6} y2={H - padB} stroke="var(--md-on-surface)" strokeOpacity=".4" strokeWidth="1.5" />
              {series.map((s, k) => s.values[hi] != null && <circle key={k} cx={X(hi)} cy={Y(s.values[hi]!)} r="6" fill={s.color} stroke="var(--md-surface-container)" strokeWidth="2.5" />)}
            </g>
          )}
        </svg>
      )}
      {ok && hi != null && (
        <div className="label-m" style={{
          position: 'absolute', top: -6, left: X(hi), transform: `translateX(${hi > n * 0.7 ? '-100%' : hi < n * 0.3 ? '0' : '-50%'})`,
          background: 'var(--md-inverse-surface)', color: 'var(--md-inverse-on-surface)', padding: '4px 10px', borderRadius: 10, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 1,
        }}>
          <b>{labels[hi]}</b> · {series.map(s => s.values[hi] != null ? `${s.label} ${fmt(s.values[hi]!)}` : '').filter(Boolean).join(' · ')}
          {bars && bars.values[hi] != null ? ` · ${bars.values[hi]}% ${bars.label}` : ''}
        </div>
      )}
    </div>
  );
}

export function Ring({ value, size = 84, stroke = 9, color = 'var(--md-primary)', track = 'var(--md-surface-container-highest)', children }: {
  value: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(100, value)) / 100)} style={{ transition: 'stroke-dashoffset 800ms var(--ease-emph)' }} />
      </svg>
      <div className="v">{children ?? value}</div>
    </div>
  );
}

/** Semi-circular gauge (AQI, UV). `value` in 0..1; `gradient` is a CSS-free list of [offset, color]. */
export function Gauge({ value, size = 180, stroke = 16, stops, children }: {
  value: number; size?: number; stroke?: number; stops: [number, string][]; children?: React.ReactNode;
}) {
  const gid = useId().replace(/:/g, '');
  const r = (size - stroke) / 2, cx = size / 2, cy = size / 2;
  const a = (f: number) => Math.PI * (1 - f);
  const p = (f: number) => [cx + r * Math.cos(a(f)), cy - r * Math.sin(a(f))];
  const [x0, y0] = p(0), [x1, y1] = p(1), [xv, yv] = p(Math.max(0, Math.min(1, value)));
  return (
    <div style={{ position: 'relative', width: size, height: size / 2 + stroke }}>
      <svg width={size} height={size / 2 + stroke} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`g${gid}`} x1="0" x2="1" y1="0" y2="0">{stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}</linearGradient>
        </defs>
        <path d={`M${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1}`} fill="none" stroke={`url(#g${gid})`} strokeWidth={stroke} strokeLinecap="round" />
        <circle cx={xv} cy={yv} r={stroke / 2 + 4} fill="var(--md-surface-container)" stroke="var(--md-on-surface)" strokeWidth="4" style={{ transition: 'cx 800ms var(--ease-emph), cy 800ms var(--ease-emph)' }} />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, textAlign: 'center' }}>{children}</div>
    </div>
  );
}
