'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { fetchConfidence, confidenceLabel, type DailyConfidence } from '@/lib/confidence';

const ICONS = {
  high: ShieldCheck,
  med: ShieldQuestion,
  low: ShieldAlert,
};

export function ConfidenceBadge({ lat, lon, date }: { lat: number; lon: number; date: string }) {
  const [data, setData] = useState<DailyConfidence[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchConfidence(lat, lon).then(d => { if (alive) setData(d); });
    return () => { alive = false; };
  }, [lat, lon]);

  if (!data) return null;
  const dayDate = date.slice(0, 10);
  const row = data.find(d => d.date.slice(0, 10) === dayDate);
  if (!row) return null;

  const Icon = ICONS[row.confidence];

  return (
    <span
      className={`conf-badge conf--${row.confidence}`}
      title={`±${row.spreadC.toFixed(1)}° spread across ${row.modelsUsed} weather models`}
    >
      <Icon size={10} strokeWidth={2.5} />
      Confidence: {confidenceLabel(row.confidence)}
    </span>
  );
}
