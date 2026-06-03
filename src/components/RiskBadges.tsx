'use client';

// RiskBadges — derive playful but useful risk flags from current conditions.

import { Flame, Bike, Wind as WindIcon, Snowflake, Zap } from 'lucide-react';

type Props = { current: any; weatherCode?: number | null };

type Risk = { id: string; label: string; tone: 'default' | 'warn' | 'severe'; icon: any };

export function RiskBadges({ current, weatherCode }: Props) {
  if (!current) return null;
  const risks: Risk[] = [];
  const t = current.feelsLikeC ?? current.temperatureC ?? null;
  const wind = current.windKmh ?? 0;
  const gust = current.windGustKmh ?? 0;
  const precip = current.precipitation ?? 0;
  const humidity = current.humidity ?? 50;

  if (t != null && t >= 30) risks.push({ id: 'heat', label: 'heat stress', tone: t >= 35 ? 'severe' : 'warn', icon: Flame });
  if (t != null && t <= 2 && (precip > 0 || humidity > 85)) risks.push({ id: 'ice', label: 'slippery bike', tone: 'severe', icon: Bike });
  if (gust > 50 || wind > 40) risks.push({ id: 'wind', label: 'gusty AF', tone: gust > 70 ? 'severe' : 'warn', icon: WindIcon });
  if (humidity > 80 && t != null && t > 18) risks.push({ id: 'hair', label: 'bad hair day', tone: 'default', icon: WindIcon });
  if (t != null && t < -5) risks.push({ id: 'freeze', label: 'frostbite risk', tone: 'severe', icon: Snowflake });
  if (weatherCode && [95, 96, 99].includes(weatherCode)) risks.push({ id: 'storm', label: 'lightning nearby', tone: 'severe', icon: Zap });

  if (!risks.length) return null;

  return (
    <div className="risk-badges" aria-label="Risk flags">
      {risks.map(r => {
        const Icon = r.icon;
        return (
          <span key={r.id} className={`risk-badge ${r.tone !== 'default' ? `risk-badge--${r.tone}` : ''}`}>
            <Icon size={12} />
            {r.label}
          </span>
        );
      })}
    </div>
  );
}
