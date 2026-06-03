'use client';

// NerdDrawer — collapsible panel for raw stats nobody needs at a glance.
// Pressure, dew point, cloud cover %, visibility, model name, last update.

import { useState } from 'react';
import { ChevronDown, ChevronUp, Microscope } from 'lucide-react';
import { useUnits } from '@/lib/units';

type Props = {
  current: any;
  sources?: { used: string[]; failed: string[] };
};

export function NerdDrawer({ current, sources }: Props) {
  const [open, setOpen] = useState(false);
  const { speed, speedUnit } = useUnits();
  if (!current) return null;

  const updated = current.time ? new Date(current.time) : null;

  return (
    <div className="nerd-drawer">
      <button
        type="button"
        className="nerd-drawer__toggle"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Microscope size={14} /> nerd stats
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="nerd-drawer__body">
          <NerdStat label="pressure" value={current.pressure != null ? `${Math.round(current.pressure)} hPa` : '—'} />
          <NerdStat label="cloud cover" value={current.cloudCover != null ? `${Math.round(current.cloudCover)}%` : '—'} />
          <NerdStat label="humidity" value={current.humidity != null ? `${Math.round(current.humidity)}%` : '—'} />
          <NerdStat label="wind gust" value={current.windGustKmh != null ? `${Math.round(speed(current.windGustKmh))} ${speedUnit}` : '—'} />
          <NerdStat label="uv index" value={current.uvIndex != null ? current.uvIndex.toFixed(1) : '—'} />
          <NerdStat label="precip" value={`${(current.precipitation ?? 0).toFixed(1)} mm`} />
          <NerdStat
            label="sources"
            value={sources?.used.length ? sources.used.join(' + ') : 'open-meteo'}
          />
          <NerdStat
            label="updated"
            value={updated ? updated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'}
          />
        </div>
      )}
    </div>
  );
}

function NerdStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="nerd-stat">
      <div className="nerd-stat__label">{label}</div>
      <div className="nerd-stat__value">{value}</div>
    </div>
  );
}
