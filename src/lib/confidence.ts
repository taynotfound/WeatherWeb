// Confidence: derive from model spread across major NWP models.
// Calls Open-Meteo with multiple models, computes std dev of daily max temps,
// returns a per-day confidence rating: high / med / low.
//
// Open-Meteo supports `models=` returning suffixed arrays:
//   temperature_2m_max_icon_seamless, _gfs_seamless, _ecmwf_ifs04, etc.

export type Confidence = 'high' | 'med' | 'low';

export type DailyConfidence = {
  date: string;       // ISO date
  spreadC: number;    // std dev across models, in °C
  confidence: Confidence;
  modelsUsed: number;
};

const MODELS = ['icon_seamless', 'gfs_seamless', 'ecmwf_ifs025', 'ukmo_seamless'];

export async function fetchConfidence(lat: number, lon: number): Promise<DailyConfidence[] | null> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set('daily', 'temperature_2m_max');
    url.searchParams.set('models', MODELS.join(','));
    url.searchParams.set('forecast_days', '7');
    url.searchParams.set('timezone', 'auto');
    const r = await fetch(url.toString(), { next: { revalidate: 1800 } });
    if (!r.ok) return null;
    const j = await r.json();
    const dates: string[] = j?.daily?.time || [];
    if (!dates.length) return null;

    const series: number[][] = [];
    for (const m of MODELS) {
      const key = `temperature_2m_max_${m}`;
      const arr = j?.daily?.[key];
      if (Array.isArray(arr)) series.push(arr);
    }
    if (series.length < 2) return null;

    return dates.map((date, i) => {
      const vals = series.map(s => s[i]).filter(v => typeof v === 'number' && isFinite(v));
      if (vals.length < 2) return { date, spreadC: 0, confidence: 'low' as Confidence, modelsUsed: vals.length };
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
      const sd = Math.sqrt(variance);
      const confidence: Confidence = sd < 1.5 ? 'high' : sd < 3 ? 'med' : 'low';
      return { date, spreadC: sd, confidence, modelsUsed: vals.length };
    });
  } catch {
    return null;
  }
}

export function confidenceLabel(c: Confidence): string {
  return c === 'high' ? 'High' : c === 'med' ? 'Med' : 'Low';
}
