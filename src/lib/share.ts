// Build a sharable text summary of current conditions.
type Loc = { name?: string; admin?: string; country?: string };
type Cur = {
  temperature_2m?: number;
  apparent_temperature?: number;
  weather_code?: number;
  wind_speed_10m?: number;
  relative_humidity_2m?: number;
};

const WMO: Record<number, string> = {
  0: 'clear', 1: 'mostly clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'fog', 48: 'rime fog', 51: 'light drizzle', 53: 'drizzle', 55: 'heavy drizzle',
  61: 'light rain', 63: 'rain', 65: 'heavy rain',
  71: 'light snow', 73: 'snow', 75: 'heavy snow', 77: 'snow grains',
  80: 'rain showers', 81: 'heavy showers', 82: 'violent showers',
  85: 'snow showers', 86: 'heavy snow showers',
  95: 'thunderstorm', 96: 'thunderstorm + hail', 99: 'severe thunderstorm + hail',
};

export function buildShareText(opts: {
  location: Loc;
  current: Cur;
  unit: 'c' | 'f';
  url: string;
  alertCount?: number;
}): { title: string; text: string; url: string } {
  const { location, current, unit, url, alertCount } = opts;
  const place = [location.name, location.admin && location.admin !== location.name ? location.admin : null, location.country]
    .filter(Boolean)
    .join(', ');
  const c = current.temperature_2m;
  const feels = current.apparent_temperature;
  const cond = current.weather_code != null ? WMO[current.weather_code] ?? 'mixed' : '';
  const wind = current.wind_speed_10m;

  const toUnit = (v?: number) => {
    if (v == null) return '—';
    const t = unit === 'f' ? v * 9 / 5 + 32 : v;
    return `${Math.round(t)}°${unit.toUpperCase()}`;
  };

  const parts = [
    `${place || 'here'}: ${toUnit(c)} · ${cond}`,
    feels != null ? `feels like ${toUnit(feels)}` : null,
    wind != null ? `wind ${Math.round(wind)} km/h` : null,
    alertCount ? `⚠ ${alertCount} active warning${alertCount === 1 ? '' : 's'}` : null,
  ].filter(Boolean);

  const text = parts.join(' · ') + '\n— via Tomato 🍅';
  const title = `Tomato weather · ${place || 'now'}`;
  return { title, text, url };
}
