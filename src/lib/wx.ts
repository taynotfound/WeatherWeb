// Shared condition vocabulary. Everything is normalised to WMO codes (what Open-Meteo uses).

export type Cond = { label: string; icon: string; kind: SceneKind };
export type SceneKind = 'clear' | 'partly' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

export function sceneKind(code: number): SceneKind {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2) return 'partly';
  if (code === 3) return 'cloud';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloud';
}

// Material Symbols names
export function condition(code: number, isDay = true): Cond {
  const kind = sceneKind(code);
  switch (code) {
    case 0: return { label: 'Clear', icon: isDay ? 'sunny' : 'bedtime', kind };
    case 1: return { label: 'Mostly clear', icon: isDay ? 'partly_cloudy_day' : 'partly_cloudy_night', kind };
    case 2: return { label: 'Partly cloudy', icon: isDay ? 'partly_cloudy_day' : 'partly_cloudy_night', kind };
    case 3: return { label: 'Overcast', icon: 'cloud', kind };
    case 45: case 48: return { label: 'Fog', icon: 'foggy', kind };
    case 51: case 53: case 55: return { label: 'Drizzle', icon: 'rainy_light', kind };
    case 56: case 57: return { label: 'Freezing drizzle', icon: 'rainy_snow', kind };
    case 61: return { label: 'Light rain', icon: 'rainy', kind };
    case 63: return { label: 'Rain', icon: 'rainy', kind };
    case 65: return { label: 'Heavy rain', icon: 'rainy_heavy', kind };
    case 66: case 67: return { label: 'Freezing rain', icon: 'rainy_snow', kind };
    case 71: return { label: 'Light snow', icon: 'weather_snowy', kind };
    case 73: return { label: 'Snow', icon: 'weather_snowy', kind };
    case 75: case 77: return { label: 'Heavy snow', icon: 'snowing_heavy', kind };
    case 80: return { label: 'Light showers', icon: 'rainy', kind };
    case 81: return { label: 'Showers', icon: 'rainy', kind };
    case 82: return { label: 'Violent showers', icon: 'rainy_heavy', kind };
    case 85: case 86: return { label: 'Snow showers', icon: 'weather_snowy', kind };
    case 95: return { label: 'Thunderstorm', icon: 'thunderstorm', kind };
    case 96: case 99: return { label: 'Thunderstorm, hail', icon: 'thunderstorm', kind };
    default: return { label: 'Cloudy', icon: 'cloud', kind };
  }
}

// WeatherAPI.com condition code -> WMO
const WAPI: Record<number, number> = {
  1000: 0, 1003: 2, 1006: 3, 1009: 3, 1030: 45, 1063: 61, 1066: 71, 1069: 71, 1072: 56, 1087: 95,
  1114: 73, 1117: 75, 1135: 45, 1147: 48, 1150: 51, 1153: 51, 1168: 56, 1171: 57, 1180: 61, 1183: 61,
  1186: 63, 1189: 63, 1192: 65, 1195: 65, 1198: 66, 1201: 67, 1204: 67, 1207: 67, 1210: 71, 1213: 71,
  1216: 73, 1219: 73, 1222: 75, 1225: 75, 1237: 77, 1240: 80, 1243: 81, 1246: 82, 1249: 67, 1252: 67,
  1255: 85, 1258: 86, 1261: 77, 1264: 77, 1273: 95, 1276: 95, 1279: 95, 1282: 95,
};
export const wapiToWmo = (c: number) => WAPI[c] ?? 3;

// Met.no symbol_code -> WMO
export function metnoToWmo(sym?: string | null): number | null {
  if (!sym) return null;
  const s = sym.replace(/_(day|night|polartwilight)$/, '');
  if (s.includes('thunder')) return 95;
  if (s.startsWith('heavyrain')) return 65;
  if (s.startsWith('lightrain')) return 61;
  if (s.startsWith('rain')) return 63;
  if (s.includes('sleet')) return 67;
  if (s.startsWith('heavysnow')) return 75;
  if (s.startsWith('lightsnow')) return 71;
  if (s.startsWith('snow')) return 73;
  if (s === 'fog') return 45;
  if (s === 'clearsky') return 0;
  if (s === 'fair') return 1;
  if (s === 'partlycloudy') return 2;
  if (s === 'cloudy') return 3;
  return null;
}

export const compass = (deg: number) =>
  ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][Math.round(deg / 22.5) % 16];

export const uvLabel = (uv: number) =>
  uv < 3 ? 'Low' : uv < 6 ? 'Moderate' : uv < 8 ? 'High' : uv < 11 ? 'Very high' : 'Extreme';

export const median = (xs: number[]) => {
  const a = xs.filter(x => typeof x === 'number' && isFinite(x)).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};
