'use client';

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { Card } from './ui/Card';

export function LightningCard({ lat, lon }: { lat: number; lon: number }) {
  const [strikes, setStrikes] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    // Open-Meteo lightning probability hourly proxy (no global strike feed without auth).
    // We use thunder probability — convert to "expected strikes" rough estimate.
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=lightning_potential&forecast_hours=24`;
    fetch(url).then(r => r.json()).then(j => {
      if (!alive) return;
      const arr: number[] = j?.hourly?.lightning_potential ?? [];
      const sum = arr.reduce((a, b) => a + (b ?? 0), 0);
      setStrikes(Math.round(sum));
    }).catch(() => alive && setStrikes(0))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [lat, lon]);

  if (loading) {
    return (
      <Card id="lightning" title="Lightning" icon={<Zap size={18} />}>
        <div className="skeleton-stack"><div className="skeleton-line" style={{ width: '60%' }} /></div>
      </Card>
    );
  }
  if (strikes == null) return null;

  return (
    <Card id="lightning" title="Lightning" subtitle="Next 24h potential index" icon={<Zap size={18} />}>
      {strikes > 0 ? (
        <div className="lightning-strikes">
          <span className="float">⚡</span>
          <span>{strikes}</span>
          <span className="lightning-strikes__unit">J/kg cumulative</span>
        </div>
      ) : (
        <div className="lightning-empty">
          <span>⛅</span>
          <span>Clear skies — no electric drama expected.</span>
        </div>
      )}
    </Card>
  );
}
