'use client';

import { Shirt } from 'lucide-react';

export function OutfitCard({ weather }: { weather: any }) {
  const c = weather?.current;
  if (!c) return null;

  const t = c.feelsLikeC ?? c.temperatureC;
  const wet = (c.weatherCode ?? 0) >= 51;
  const windy = (c.windKmh ?? 0) > 25;

  const parts: string[] = [];
  if (t < 0) parts.push('Heavy coat, gloves, hat');
  else if (t < 8) parts.push('Warm coat and a scarf');
  else if (t < 15) parts.push('Light jacket');
  else if (t < 22) parts.push('Long sleeves');
  else parts.push('T-shirt weather');
  if (wet) parts.push('umbrella');
  if (windy) parts.push('windbreaker');

  return (
    <section className="card">
      <div className="card-head"><h2>What to wear</h2></div>
      <div className="row" style={{ gap: 10 }}>
        <Shirt size={18} style={{ color: 'var(--ink-soft)', flexShrink: 0 }} />
        <p style={{ color: 'var(--ink)' }}>{parts.join(' · ')}</p>
      </div>
    </section>
  );
}
