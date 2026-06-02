'use client';

import { useEffect, useState } from 'react';
import { Flower2 } from 'lucide-react';
import { Card, Pill } from './ui/Card';

// Open-Meteo pollen scale (grains/m³):
//   0 = none, <10 low, 10-30 mod, 30-100 high, >100 extreme.
function pollenLevel(v: number | null | undefined): { label: string; tone: 'good' | 'fair' | 'warn' | 'poor' } {
  if (v == null) return { label: 'n/a', tone: 'fair' };
  if (v < 1) return { label: 'none', tone: 'good' };
  if (v < 10) return { label: 'low', tone: 'good' };
  if (v < 30) return { label: 'moderate', tone: 'fair' };
  if (v < 100) return { label: 'high', tone: 'warn' };
  return { label: 'extreme', tone: 'poor' };
}

const TYPES = [
  { key: 'alder', name: 'Alder' },
  { key: 'birch', name: 'Birch' },
  { key: 'grass', name: 'Grass' },
  { key: 'mugwort', name: 'Mugwort' },
  { key: 'olive', name: 'Olive' },
  { key: 'ragweed', name: 'Ragweed' },
] as const;

export default function PollenCard({ lat, lon }: { lat: number; lon: number }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch(`/api/air?lat=${lat}&lon=${lon}`).then(r => r.json()).then(setData).catch(() => {});
  }, [lat, lon]);
  if (!data?.pollen) return null;
  const p = data.pollen;
  const top = pollenLevel(p.max);
  const rows = TYPES.map(t => ({ ...t, value: p[t.key], level: pollenLevel(p[t.key]) }))
    .filter(r => typeof r.value === 'number');
  // Hide card entirely if there's no real pollen signal (e.g. winter or non-EU lat).
  if (!rows.length || p.max === 0) return null;

  return (
    <Card
      title="Pollen"
      subtitle={p.top ? `Highest: ${p.top.type} — ${Math.round(p.top.value)} g/m³` : 'No active pollen'}
      icon={<Flower2 size={16} />}
      tone={top.tone}
      action={<Pill tone={top.tone}>{top.label}</Pill>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {rows.map(r => (
          <div key={r.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
            <span style={{ fontSize: 13, color: 'var(--ink)' }}>{r.name}</span>
            <Pill tone={r.level.tone}>{r.level.label}</Pill>
          </div>
        ))}
        {typeof p.dust === 'number' && p.dust > 0 && (
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderTop: '1px dashed var(--border-soft)', marginTop: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--ink-mute)' }}>Saharan dust</span>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{Math.round(p.dust)} µg/m³</span>
          </div>
        )}
      </div>
    </Card>
  );
}
