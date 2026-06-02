'use client';

import {
  Sun, Moon, Cloud, CloudSun, CloudMoon,
  CloudRain, CloudDrizzle, CloudSnow, CloudLightning, CloudFog,
} from 'lucide-react';

type Props = { code: number; isDay?: boolean; size?: number; className?: string };

function category(code: number): string {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partly';
  if (code === 3) return 'cloud';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloud';
}

export function AnimatedWeatherIcon({ code, isDay = true, size = 28, className = '' }: Props) {
  const cat = category(code);
  const cls = `wxicon wxicon--${cat} ${className}`.trim();

  if (cat === 'clear')  return isDay ? <Sun size={size} className={cls} /> : <Moon size={size} className={cls} />;
  if (cat === 'partly') return isDay ? <CloudSun size={size} className={cls} /> : <CloudMoon size={size} className={cls} />;
  if (cat === 'cloud')  return <Cloud size={size} className={cls} />;
  if (cat === 'fog')    return <CloudFog size={size} className={cls} />;
  if (cat === 'drizzle')return <CloudDrizzle size={size} className={cls} />;
  if (cat === 'rain')   return <CloudRain size={size} className={cls} />;
  if (cat === 'snow')   return <CloudSnow size={size} className={cls} />;
  if (cat === 'storm')  return <CloudLightning size={size} className={cls} />;
  return <Cloud size={size} className={cls} />;
}
