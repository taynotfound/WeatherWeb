'use client';

import { useMemo, useState } from 'react';
import { useUnits } from '@/lib/units';
import { AnimatedWeatherIcon } from './AnimatedWeatherIcon';

type Props = { weather: any };

const HOURS_PER_DAY = 24;
const DAYS_SHOWN = 7;

function dayLabel(d: Date, i: number) {
  if (i === 0) return 'Today';
  if (i === 1) return 'Tom';
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

/** Map temperature °C to a Twilight-Mist-friendly heat color. */
function tempColor(c: number) {
  // -10 → deep blue, 0 → cyan-purple, 20 → magenta, 32 → ember orange, 40+ → red
  const stops = [
    { c: -15, color: [40, 64, 140] },
    { c: -5, color: [90, 124, 200] },
    { c: 5, color: [157, 124, 216] },
    { c: 15, color: [180, 130, 200] },
    { c: 22, color: [220, 140, 180] },
    { c: 28, color: [255, 158, 100] },
    { c: 35, color: [240, 110, 80] },
    { c: 42, color: [210, 60, 70] },
  ];
  if (c <= stops[0].c) return `rgb(${stops[0].color.join(',')})`;
  if (c >= stops[stops.length - 1].c) return `rgb(${stops[stops.length - 1].color.join(',')})`;
  for (let i = 0; i < stops.length - 1; i++) {
    if (c >= stops[i].c && c <= stops[i + 1].c) {
      const t = (c - stops[i].c) / (stops[i + 1].c - stops[i].c);
      const r = Math.round(stops[i].color[0] + (stops[i + 1].color[0] - stops[i].color[0]) * t);
      const g = Math.round(stops[i].color[1] + (stops[i + 1].color[1] - stops[i].color[1]) * t);
      const b = Math.round(stops[i].color[2] + (stops[i + 1].color[2] - stops[i].color[2]) * t);
      return `rgb(${r},${g},${b})`;
    }
  }
  return '#9d7cd8';
}

export function HourlyHeatmap({ weather }: Props) {
  const { temp, tempUnit } = useUnits();
  const h = weather?.hourly;
  const [hover, setHover] = useState<{ day: number; hour: number } | null>(null);
  const [mode, setMode] = useState<'temp' | 'rain'>('temp');

  const grid = useMemo(() => {
    if (!h?.time?.length) return null;
    // Find index where local hour is 0 of "today" — use first entry day
    const start = new Date(h.time[0]);
    const startHour = start.getHours();
    // We want a grid: each row = day (0..6), each col = hour 0..23.
    const cells: Array<Array<{ idx: number; t: number; pop: number; precip: number; code: number; time: Date } | null>> =
      Array.from({ length: DAYS_SHOWN }, () => Array(HOURS_PER_DAY).fill(null));

    for (let i = 0; i < h.time.length; i++) {
      const d = new Date(h.time[i]);
      const dayOffset = Math.floor((d.getTime() - new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) / 86_400_000);
      const hour = d.getHours();
      if (dayOffset < 0 || dayOffset >= DAYS_SHOWN) continue;
      cells[dayOffset][hour] = {
        idx: i,
        t: h.temperature_2m[i],
        pop: h.precipitation_probability?.[i] ?? 0,
        precip: h.precipitation?.[i] ?? 0,
        code: h.weather_code?.[i] ?? 0,
        time: d,
      };
    }
    return { cells, startHour };
  }, [h]);

  if (!grid) return null;
  const tu = tempUnit.replace('°F', '°');

  const tooltipCell = hover ? grid.cells[hover.day]?.[hover.hour] : null;

  return (
    <section className="card heatmap-card">
      <div className="card-head heatmap-head">
        <h2>Hour-by-hour, week ahead</h2>
        <div className="heatmap-toggle">
          <button className={mode === 'temp' ? 'is-active' : ''} onClick={() => setMode('temp')}>Temp</button>
          <button className={mode === 'rain' ? 'is-active' : ''} onClick={() => setMode('rain')}>Rain %</button>
        </div>
      </div>

      <div className="heatmap-scroll">
        <div className="heatmap-grid">
          {/* Header row: hour labels */}
          <div className="heatmap-corner" />
          {Array.from({ length: HOURS_PER_DAY }, (_, h) => (
            <div key={`h-${h}`} className="heatmap-hour-label">{h % 3 === 0 ? `${h}` : ''}</div>
          ))}

          {/* Body */}
          {grid.cells.map((row, dayIdx) => {
            const firstCell = row.find((c) => c !== null);
            const d = firstCell ? firstCell.time : new Date(Date.now() + dayIdx * 86_400_000);
            return (
              <div key={dayIdx} className="heatmap-row" style={{ display: 'contents' }}>
                <div className="heatmap-day-label">{dayLabel(d, dayIdx)}</div>
                {row.map((cell, hourIdx) => {
                  if (!cell) return <div key={hourIdx} className="heatmap-cell heatmap-cell--empty" />;
                  let bg = '';
                  let label = '';
                  if (mode === 'temp') {
                    bg = tempColor(cell.t);
                    label = `${Math.round(temp(cell.t))}${tu}`;
                  } else {
                    const intensity = Math.min(1, cell.pop / 100);
                    const a = 0.1 + intensity * 0.85;
                    bg = `rgba(122,162,247,${a})`;
                    label = `${Math.round(cell.pop)}%`;
                  }
                  const isHover = hover?.day === dayIdx && hover?.hour === hourIdx;
                  return (
                    <button
                      key={hourIdx}
                      className={`heatmap-cell ${isHover ? 'is-hover' : ''}`}
                      style={{ background: bg }}
                      onMouseEnter={() => setHover({ day: dayIdx, hour: hourIdx })}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover({ day: dayIdx, hour: hourIdx })}
                      onClick={() => setHover({ day: dayIdx, hour: hourIdx })}
                      aria-label={`${dayLabel(d, dayIdx)} ${hourIdx}:00 — ${label}`}
                    >
                      <span className="heatmap-cell__val">{label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="heatmap-footer">
        {tooltipCell ? (
          <div className="heatmap-readout">
            <AnimatedWeatherIcon code={tooltipCell.code} isDay={tooltipCell.time.getHours() >= 6 && tooltipCell.time.getHours() < 19} size={20} />
            <span className="heatmap-readout__time">
              {tooltipCell.time.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="heatmap-readout__temp">{Math.round(temp(tooltipCell.t))}{tu}</span>
            <span className="heatmap-readout__pop">{Math.round(tooltipCell.pop)}% rain</span>
            {tooltipCell.precip > 0 && <span className="heatmap-readout__precip">{tooltipCell.precip.toFixed(1)} mm</span>}
          </div>
        ) : (
          <div className="heatmap-hint">tap a cell to inspect any hour of the week</div>
        )}
        <div className="heatmap-scale">
          {mode === 'temp' ? (
            <>
              <span style={{ background: tempColor(-10) }} />
              <span style={{ background: tempColor(0) }} />
              <span style={{ background: tempColor(10) }} />
              <span style={{ background: tempColor(20) }} />
              <span style={{ background: tempColor(30) }} />
              <span style={{ background: tempColor(38) }} />
              <span className="heatmap-scale__txt">cold → hot</span>
            </>
          ) : (
            <>
              <span style={{ background: 'rgba(122,162,247,0.1)' }} />
              <span style={{ background: 'rgba(122,162,247,0.35)' }} />
              <span style={{ background: 'rgba(122,162,247,0.6)' }} />
              <span style={{ background: 'rgba(122,162,247,0.85)' }} />
              <span className="heatmap-scale__txt">dry → soaked</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
