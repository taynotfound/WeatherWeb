// Anomaly: today vs seasonal normal. Uses Open-Meteo historical archive.
// Fetched server-side via the /api/anomaly route.

export type Anomaly = {
  todayMaxC: number;
  normalMaxC: number;
  deltaC: number; // positive = warmer than normal
  todayPrecipMm: number;
  normalPrecipMm: number;
  precipDeltaMm: number;
  verdict: string; // short string e.g. "+3.2° warmer than normal"
  daysSampled: number;
};

export function buildAnomalyVerdict(deltaC: number, precipDeltaMm: number): string {
  const abs = Math.abs(deltaC);
  const tempPart = abs < 0.5
    ? 'normal temp'
    : `${deltaC > 0 ? '+' : ''}${deltaC.toFixed(1)}° ${deltaC > 0 ? 'warmer' : 'cooler'}`;
  const wet = precipDeltaMm > 2 ? ', wetter' : precipDeltaMm < -2 ? ', drier' : '';
  return `${tempPart} than normal${wet}`;
}
