'use client';

import { useEffect, useState } from 'react';
import { fetchConfidence, confidenceLabel, type DailyConfidence } from '@/lib/confidence';

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

  return (
    <span
      className={`conf-badge conf--${row.confidence}`}
      title={`±${row.spreadC.toFixed(1)}° across ${row.modelsUsed} models`}
    >
      {confidenceLabel(row.confidence)}
    </span>
  );
}
