// Find the "best hour" in the next N hours for outdoor stuff.
// Returns the hour index with the highest composite score + a label.

import { outsideScore } from './scores';

type Hourly = {
  time?: string[];
  temperature_2m?: number[];
  apparent_temperature?: number[];
  precipitation?: number[];
  precipitation_probability?: number[];
  wind_speed_10m?: number[];
  relative_humidity_2m?: number[];
  uv_index?: number[];
};

export type BestHour = {
  index: number;
  iso: string;
  score: number;
  reason: string;
};

export function findBestHour(hourly: Hourly | null | undefined, windowHours = 14, startOffset = 1): BestHour | null {
  if (!hourly?.time?.length) return null;
  const len = Math.min(hourly.time.length, startOffset + windowHours);
  let best: BestHour | null = null;
  for (let i = startOffset; i < len; i++) {
    const s = outsideScore({
      tempC: hourly.temperature_2m?.[i],
      feelsLikeC: hourly.apparent_temperature?.[i],
      precipMm: hourly.precipitation?.[i],
      precipProb: hourly.precipitation_probability?.[i],
      windKmh: hourly.wind_speed_10m?.[i],
      humidity: hourly.relative_humidity_2m?.[i],
      uv: hourly.uv_index?.[i],
      isDay: true,
    });
    if (!best || s.value > best.score) {
      const t = hourly.temperature_2m?.[i];
      const p = hourly.precipitation?.[i] ?? 0;
      const w = hourly.wind_speed_10m?.[i] ?? 0;
      const reason = p < 0.1
        ? `${t != null ? Math.round(t) + '°' : ''} ${w < 12 ? 'calm' : w < 25 ? 'breezy' : 'windy'}`.trim()
        : 'driest window';
      best = { index: i, iso: hourly.time[i], score: s.value, reason };
    }
  }
  return best;
}

// Estimate when rain starts in the next ~2h from minutely_15.
export function rainArrival(minutely: { time?: string[]; precipitation?: number[]; precipitation_probability?: number[] } | null | undefined) {
  if (!minutely?.time?.length || !minutely.precipitation?.length) return null;
  const now = Date.now();
  let raining = false;
  for (let i = 0; i < minutely.time.length; i++) {
    const t = new Date(minutely.time[i]).getTime();
    if (t < now - 7 * 60_000) continue;
    if ((minutely.precipitation[i] ?? 0) > 0.05) {
      const minsAway = Math.max(0, Math.round((t - now) / 60_000));
      // Already raining?
      if (minsAway <= 0) {
        raining = true;
        continue;
      }
      return { minutes: minsAway, iso: minutely.time[i], rainingNow: raining };
    }
  }
  if (raining) return { minutes: 0, iso: minutely.time[0], rainingNow: true };
  return null; // dry through window
}
