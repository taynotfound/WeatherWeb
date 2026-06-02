'use client';

import { useEffect, useMemo, useState } from 'react';
import { History } from 'lucide-react';
import { Card } from './ui/Card';
import { useUnits } from '@/lib/units';

type Day = { date: string; tmax: number; tmin: number; precip: number };

export function HistoryCard({ lat, lon }: { lat: number; lon: number }) {
  const [days, setDays] = useState<Day[] | null>(null);
  const { temp, tempUnit } = useUnits();
  const tu = tempUnit.replace('°F', '°');

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
    }).catch(() => {});
    return () => { alive = false; };
  }, [lat, lon]);

  const chart = useMemo(() => {
    if (!days || days.length === 0) return null;
    const W = 320, H = 160, padL = 28, padR = 28, padT = 12, padB = 24;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const n = days.length;
    const tmaxs = days.map(d => temp(d.tmax));
    const tmins = days.map(d => temp(d.tmin));
    const precs = days.map(d => d.precip);
    const maxT = Math.max(...tmaxs);
    const minT = Math.min(...tmins);
    const tRange = Math.max(1, maxT - minT);
    const maxP = Math.max(1, ...precs);

    const xAt = (i: number) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const yAtT = (v: number) => padT + (1 - (v - minT) / tRange) * innerH;

    const pathMax = tmaxs.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAtT(v)}`).join(' ');
    const pathMin = tmins.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAtT(v)}`).join(' ');
    // Area between min and max (band)
    const band = tmaxs.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAtT(v)}`).join(' ')
      + ' ' + tmins.map((v, i) => `L ${xAt(n - 1 - i)} ${yAtT(tmins[n - 1 - i])}`).join(' ')
      + ' Z';

    const bars = precs.map((p, i) => {
      const barW = innerW / (n + 0.5) * 0.55;
      const x = xAt(i) - barW / 2;
      const h = (p / maxP) * (innerH * 0.45);
      const y = padT + innerH - h;
      return { x, y, w: barW, h, p };
    });

    return { W, H, padL, padR, padT, padB, innerW, innerH, n, days, xAt, yAtT, tmaxs, tmins, precs, maxT, minT, maxP, pathMax, pathMin, band, bars };
  }, [days, temp]);

  if (!days) {
    return (
      <Card id="history" title="Last 7 days" icon={<History size={18} />}>
        <div className="skeleton-stack"><div className="skeleton-line" style={{ height: 120 }} /></div>
      </Card>
    );
  }
  if (!chart) return null;

  return (
    <Card id="history" title="Last 7 days" subtitle="Temperature & precipitation" icon={<History size={18} />}>
      <div className="chart-legend">
        <span className="chart-legend__dot" style={{ background: 'var(--primary)' }} /> high
        <span className="chart-legend__dot" style={{ background: 'rgba(157,124,216,0.45)' }} /> low
        <span className="chart-legend__dot" style={{ background: 'rgba(120,180,255,0.7)' }} /> rain
      </div>
      <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="line-chart" role="img" aria-label="7 day weather history">
        <defs>
          <linearGradient id="bandFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(157,124,216,0.35)" />
            <stop offset="100%" stopColor="rgba(157,124,216,0.05)" />
          </linearGradient>
          <linearGradient id="rainFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(120,180,255,0.85)" />
            <stop offset="100%" stopColor="rgba(120,180,255,0.25)" />
          </linearGradient>
        </defs>
        {/* gridlines */}
        {[0, 0.5, 1].map((g) => {
          const y = chart.padT + g * chart.innerH;
          return <line key={g} x1={chart.padL} x2={chart.W - chart.padR} y1={y} y2={y} stroke="var(--border-soft)" strokeWidth="0.5" />;
        })}
        {/* rain bars */}
        {chart.bars.map((b, i) => b.h > 0 && (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={2} fill="url(#rainFill)">
              <animate attributeName="height" from="0" to={b.h} dur="0.6s" fill="freeze" begin={`${i * 0.05}s`} />
              <animate attributeName="y" from={chart.padT + chart.innerH} to={b.y} dur="0.6s" fill="freeze" begin={`${i * 0.05}s`} />
            </rect>
          </g>
        ))}
        {/* band between min and max */}
        <path d={chart.band} fill="url(#bandFill)" opacity="0">
          <animate attributeName="opacity" from="0" to="1" dur="0.6s" fill="freeze" begin="0.3s" />
        </path>
        {/* min line */}
        <path d={chart.pathMin} fill="none" stroke="rgba(157,124,216,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" pathLength={1} style={{ strokeDashoffset: 1, animation: 'draw 0.8s 0.4s ease forwards' as any }} />
        {/* max line */}
        <path d={chart.pathMax} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} style={{ strokeDashoffset: 1, animation: 'draw 0.9s ease forwards' as any }} />
        {/* points */}
        {chart.tmaxs.map((v, i) => (
          <g key={i}>
            <circle cx={chart.xAt(i)} cy={chart.yAtT(v)} r={3} fill="var(--primary)">
              <animate attributeName="r" from="0" to="3" dur="0.3s" fill="freeze" begin={`${0.7 + i * 0.05}s`} />
            </circle>
            <text x={chart.xAt(i)} y={chart.yAtT(v) - 6} fontSize="9" fill="var(--ink)" textAnchor="middle" opacity="0">
              {Math.round(v)}{tu}
              <animate attributeName="opacity" from="0" to="1" dur="0.4s" fill="freeze" begin={`${0.9 + i * 0.05}s`} />
            </text>
          </g>
        ))}
        {/* x-axis labels */}
        {chart.days.map((d, i) => {
          const dt = new Date(d.date + 'T00:00:00');
          const lbl = dt.toLocaleDateString([], { weekday: 'short' }).slice(0, 2);
          return (
            <text key={d.date} x={chart.xAt(i)} y={chart.H - 8} fontSize="10" fill="var(--ink-mute)" textAnchor="middle">{lbl}</text>
          );
        })}
        {/* y-axis: max/min labels */}
        <text x={chart.padL - 6} y={chart.padT + 4} fontSize="9" fill="var(--ink-mute)" textAnchor="end">{Math.round(chart.maxT)}{tu}</text>
        <text x={chart.padL - 6} y={chart.padT + chart.innerH} fontSize="9" fill="var(--ink-mute)" textAnchor="end">{Math.round(chart.minT)}{tu}</text>
        <text x={chart.W - chart.padR + 4} y={chart.padT + chart.innerH} fontSize="9" fill="rgba(120,180,255,0.85)" textAnchor="start">{chart.maxP.toFixed(0)}mm</text>
      </svg>
    </Card>
  );
}
