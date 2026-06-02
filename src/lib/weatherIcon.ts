// Map Open-Meteo / WMO weather codes to Lucide icons.
import {
  Sun, Moon, Cloud, CloudSun, CloudMoon,
  CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog,
  type LucideIcon,
} from 'lucide-react';

export function weatherIcon(code: number, isDay = true): LucideIcon {
  // WMO codes (Open-Meteo): https://open-meteo.com/en/docs
  if (code === 0) return isDay ? Sun : Moon;
  if (code === 1 || code === 2) return isDay ? CloudSun : CloudMoon;
  if (code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if (code >= 51 && code <= 57) return CloudDrizzle;
  if (code >= 61 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return CloudSnow;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 85 && code <= 86) return CloudSnow;
  if (code >= 95) return CloudLightning;
  return Cloud;
}

export function weatherLabel(code: number): string {
  if (code === 0) return 'clear';
  if (code === 1) return 'mostly clear';
  if (code === 2) return 'partly cloudy';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'showers';
  if (code >= 85 && code <= 86) return 'snow showers';
  if (code >= 95) return 'thunderstorm';
  return '—';
}
