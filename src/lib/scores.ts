// Decision-grade scores from raw weather. Each returns 0-100 and a short verdict.
// Inputs accept partial data — undefined values are treated as neutral.

export type Score = { value: number; label: string; verdict: string; emoji: string };

type Inputs = {
  tempC?: number | null;
  feelsLikeC?: number | null;
  windKmh?: number | null;
  gustKmh?: number | null;
  precipMm?: number | null;
  precipProb?: number | null; // 0-100
  humidity?: number | null;   // 0-100
  uv?: number | null;
  cloudCover?: number | null; // 0-100
  isDay?: boolean;
};

function clamp(n: number, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, n)); }

function band(n: number, opts: { label: string; emoji: string }[]) {
  // opts indexed 0..4 for 0-20, 20-40, 40-60, 60-80, 80-100
  const i = Math.min(4, Math.floor(n / 20));
  return opts[i];
}

export function bikeScore(i: Inputs): Score {
  let s = 100;
  const t = i.feelsLikeC ?? i.tempC ?? 15;
  // Temp comfort window 8-22°C ideal
  if (t < 8) s -= (8 - t) * 4;
  if (t > 22) s -= (t - 22) * 3;
  // Wind: above 20km/h hurts, above 35 brutal
  const w = i.windKmh ?? 0;
  if (w > 15) s -= (w - 15) * 2;
  // Gusts
  const g = i.gustKmh ?? 0;
  if (g > 40) s -= (g - 40) * 1.5;
  // Rain: any precip kills it fast
  const p = i.precipMm ?? 0;
  if (p > 0) s -= 30 + p * 10;
  const pp = i.precipProb ?? 0;
  if (pp > 40) s -= (pp - 40) * 0.6;
  s = clamp(s);
  const b = band(s, [
    { label: 'no', emoji: '🚫' },
    { label: 'pain', emoji: '😬' },
    { label: 'meh', emoji: '🫤' },
    { label: 'fine', emoji: '🚴' },
    { label: 'perfect', emoji: '🌟' },
  ]);
  return { value: Math.round(s), label: 'bike', verdict: b.label, emoji: b.emoji };
}

export function outsideScore(i: Inputs): Score {
  let s = 100;
  const t = i.feelsLikeC ?? i.tempC ?? 15;
  // Wider window: 5-28°C
  if (t < 5) s -= (5 - t) * 3;
  if (t > 28) s -= (t - 28) * 3;
  const p = i.precipMm ?? 0;
  if (p > 0) s -= 25 + p * 8;
  const pp = i.precipProb ?? 0;
  if (pp > 50) s -= (pp - 50) * 0.5;
  const w = i.windKmh ?? 0;
  if (w > 25) s -= (w - 25) * 1.2;
  // High UV penalty for being out
  const uv = i.uv ?? 0;
  if (uv > 7) s -= (uv - 7) * 5;
  s = clamp(s);
  const b = band(s, [
    { label: 'stay in', emoji: '🏠' },
    { label: 'rough', emoji: '🌧️' },
    { label: 'okay', emoji: '🚶' },
    { label: 'nice', emoji: '☀️' },
    { label: 'gorgeous', emoji: '🌈' },
  ]);
  return { value: Math.round(s), label: 'outside', verdict: b.label, emoji: b.emoji };
}

export function laundryScore(i: Inputs): Score {
  // Best when warm, dry, breezy, low humidity, ideally daytime
  let s = 50;
  const t = i.tempC ?? 15;
  if (t > 18) s += Math.min(25, (t - 18) * 3);
  if (t < 10) s -= (10 - t) * 4;
  const h = i.humidity ?? 60;
  if (h < 60) s += (60 - h) * 0.6;
  if (h > 80) s -= (h - 80) * 1.2;
  const w = i.windKmh ?? 0;
  if (w > 5 && w < 25) s += Math.min(15, w);
  if (w > 35) s -= (w - 35) * 1;
  const p = i.precipMm ?? 0;
  const pp = i.precipProb ?? 0;
  if (p > 0) s -= 60;
  if (pp > 30) s -= (pp - 30) * 0.8;
  if (i.isDay === false) s -= 20;
  s = clamp(s);
  const b = band(s, [
    { label: 'absolutely not', emoji: '💦' },
    { label: 'risky', emoji: '🌫️' },
    { label: 'maybe', emoji: '🤷' },
    { label: 'go for it', emoji: '👕' },
    { label: 'jackpot', emoji: '✨' },
  ]);
  return { value: Math.round(s), label: 'laundry', verdict: b.label, emoji: b.emoji };
}

export function sleepScore(i: Inputs): Score {
  // Best when cool but not cold, low humidity, quiet (low wind), no storms
  let s = 80;
  const t = i.tempC ?? 18;
  // Sleep ideal 15-19°C
  if (t < 12) s -= (12 - t) * 3;
  if (t > 22) s -= (t - 22) * 4; // hot nights worse than cool
  const h = i.humidity ?? 60;
  if (h > 75) s -= (h - 75) * 1.5;
  const w = i.windKmh ?? 0;
  if (w > 30) s -= (w - 30) * 1;
  const p = i.precipMm ?? 0;
  if (p > 2) s -= p * 3; // heavy rain is loud
  s = clamp(s);
  const b = band(s, [
    { label: 'cursed', emoji: '😵' },
    { label: 'restless', emoji: '😣' },
    { label: 'meh', emoji: '😐' },
    { label: 'cozy', emoji: '😴' },
    { label: 'bliss', emoji: '🌙' },
  ]);
  return { value: Math.round(s), label: 'sleep', verdict: b.label, emoji: b.emoji };
}

export function allScores(i: Inputs) {
  return [bikeScore(i), outsideScore(i), laundryScore(i), sleepScore(i)];
}
