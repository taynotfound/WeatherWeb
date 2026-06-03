'use client';

import { Shirt, Umbrella, Wind, Snowflake, Sun, Cloud } from 'lucide-react';

type Layer = { icon: any; label: string; tone: 'warm' | 'cool' | 'wet' | 'wind' | 'sun' | 'neutral' };

export function OutfitCard({ weather }: { weather: any }) {
  const c = weather?.current;
  if (!c) return null;

  const t = c.feelsLikeC ?? c.temperatureC ?? 0;
  const code = c.weatherCode ?? 0;
  const wet = code >= 51 && code !== 80; // drizzle and up
  const heavyRain = code >= 61;
  const snow = code >= 71 && code <= 77;
  const windKmh = c.windKmh ?? 0;
  const windy = windKmh > 25;
  const veryWindy = windKmh > 45;
  const uv = c.uvIndex ?? 0;
  const sunny = uv >= 4;

  const layers: Layer[] = [];

  // Base layer
  if (t < -5) layers.push({ icon: Snowflake, label: 'thermal base', tone: 'cool' });
  else if (t < 8) layers.push({ icon: Shirt, label: 'long sleeve', tone: 'cool' });
  else if (t < 16) layers.push({ icon: Shirt, label: 'long sleeve', tone: 'neutral' });
  else if (t < 22) layers.push({ icon: Shirt, label: 't-shirt', tone: 'neutral' });
  else layers.push({ icon: Shirt, label: 't-shirt', tone: 'warm' });

  // Outerwear
  if (t < 0) layers.push({ icon: Shirt, label: 'heavy coat', tone: 'cool' });
  else if (t < 8) layers.push({ icon: Shirt, label: 'warm coat', tone: 'cool' });
  else if (t < 14) layers.push({ icon: Shirt, label: 'jacket', tone: 'neutral' });
  else if (t < 18) layers.push({ icon: Shirt, label: 'light layer', tone: 'neutral' });

  // Accessories
  if (t < 2) layers.push({ icon: Snowflake, label: 'gloves + hat', tone: 'cool' });
  if (wet) layers.push({ icon: Umbrella, label: heavyRain ? 'umbrella, expect wet feet' : 'umbrella', tone: 'wet' });
  if (snow) layers.push({ icon: Snowflake, label: 'snow-proof boots', tone: 'cool' });
  if (windy) layers.push({ icon: Wind, label: veryWindy ? 'windbreaker (it WILL flip)' : 'windbreaker', tone: 'wind' });
  if (sunny) layers.push({ icon: Sun, label: uv >= 7 ? 'SPF + shades, no debate' : 'sunglasses', tone: 'sun' });

  // Tomato verdict
  const verdict = outfitVerdict({ t, wet, snow, windy, veryWindy, sunny, heavyRain, uv });

  return (
    <section className="card outfit-card">
      <div className="card-head">
        <h2><Shirt size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />What to wear</h2>
        <span className="meta">feels {Math.round(t)}°</span>
      </div>

      <div className="outfit-grid">
        {layers.map((l, i) => {
          const Icon = l.icon;
          return (
            <div key={i} className={`outfit-chip outfit-chip--${l.tone}`}>
              <Icon size={14} />
              <span>{l.label}</span>
            </div>
          );
        })}
      </div>

      <p className="outfit-verdict">{verdict}</p>
    </section>
  );
}

function outfitVerdict(s: {
  t: number; wet: boolean; snow: boolean; windy: boolean; veryWindy: boolean;
  sunny: boolean; heavyRain: boolean; uv: number;
}): string {
  if (s.snow) return "It's snowing. Dress like it. No skirt, no flip-flops, no excuses.";
  if (s.heavyRain && s.veryWindy) return "Rain + wind. Umbrella is a suggestion, not a plan. Hood up.";
  if (s.heavyRain) return "It's raining for real. Waterproof everything you care about.";
  if (s.wet && s.t < 10) return "Cold and damp. The worst combo. Layer up, bring the umbrella.";
  if (s.wet) return "Light drizzle. Bring an umbrella unless you enjoy mild regret.";
  if (s.t < -5) return "Painfully cold. Cover every patch of skin or pay the price.";
  if (s.t < 5) return "Bundle up properly. This isn't 'just a jacket' weather.";
  if (s.veryWindy) return "It's gusty out. Anything loose is leaving the planet today.";
  if (s.t >= 28 && s.sunny) return "Hot and sunny. Light fabrics, hydrate, find shade.";
  if (s.t >= 22) return "Warm. T-shirt weather, no overthinking required.";
  if (s.uv >= 7) return "Sun is hostile today. SPF or burn — your call.";
  if (s.t >= 15) return "Mild. Long sleeves, maybe a layer for the morning.";
  return "Layer up. Tomato approves.";
}
