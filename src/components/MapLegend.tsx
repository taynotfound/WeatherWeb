'use client';

import { Fragment } from 'react';

type Kind = 'radar' | 'precipitation' | 'clouds' | 'temp' | 'wind';

const LEGENDS: Record<Kind, { title: string; type: 'gradient' | 'swatches'; gradient?: string; scale?: string[]; rows?: { color: string; label: string }[] }> = {
  radar: {
    title: 'Radar — mm/h',
    type: 'gradient',
    gradient: 'linear-gradient(to right, #00f, #0ff, #0f0, #ff0, #f80, #f00, #f0f)',
    scale: ['0.1', '1', '10', '50+'],
  },
  precipitation: {
    title: 'Precip — mm',
    type: 'gradient',
    gradient: 'linear-gradient(to right, rgba(80,100,255,0.2), rgba(80,180,255,0.8), rgba(0,255,180,0.9), rgba(255,200,0,0.9), rgba(255,50,50,0.9))',
    scale: ['0', '1', '5', '10', '20+'],
  },
  clouds: {
    title: 'Cloud cover %',
    type: 'gradient',
    gradient: 'linear-gradient(to right, rgba(255,255,255,0.05), rgba(255,255,255,0.7))',
    scale: ['0', '50', '100'],
  },
  temp: {
    title: 'Temperature °C',
    type: 'gradient',
    gradient: 'linear-gradient(to right, #2554c7, #4598ff, #76e0ff, #b6ffc6, #ffeb3b, #ff8a00, #d50000)',
    scale: ['-40', '-20', '0', '20', '40'],
  },
  wind: {
    title: 'Wind — m/s',
    type: 'gradient',
    gradient: 'linear-gradient(to right, #4fc3f7, #66bb6a, #ffeb3b, #ff8a00, #d50000)',
    scale: ['0', '10', '20', '30+'],
  },
};

export function MapLegend({ kind }: { kind: Kind }) {
  const L = LEGENDS[kind];
  if (!L) return null;
  return (
    <div className="map-legend" role="img" aria-label={L.title}>
      <div className="map-legend__title">{L.title}</div>
      {L.type === 'gradient' && (
        <Fragment>
          <div className="map-legend__bar" style={{ background: L.gradient }} />
          <div className="map-legend__scale">
            {L.scale!.map((s) => <span key={s}>{s}</span>)}
          </div>
        </Fragment>
      )}
    </div>
  );
}
