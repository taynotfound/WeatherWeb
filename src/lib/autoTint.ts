'use client';

import { useEffect } from 'react';

// Sky tint lookup: [bg tint, surface tint] pairs keyed by condition
const TINTS: Record<string, [string, string]> = {
  clear_day:    ['rgba(157,124,216,0.08)', 'rgba(255,158,100,0.04)'],  // warm purple / sun hint
  clear_night:  ['rgba(30,20,60,0.6)',     'rgba(20,10,40,0.3)'],      // deep navy midnight
  partly_day:   ['rgba(122,162,247,0.06)', 'rgba(157,124,216,0.04)'],
  partly_night: ['rgba(30,20,60,0.4)',     'rgba(20,10,40,0.2)'],
  cloud:        ['rgba(60,55,80,0.15)',    'rgba(50,45,70,0.1)'],
  rain:         ['rgba(30,60,100,0.18)',   'rgba(20,50,80,0.1)'],
  drizzle:      ['rgba(40,70,110,0.12)',   'rgba(30,55,90,0.07)'],
  snow:         ['rgba(200,220,255,0.07)', 'rgba(180,200,240,0.04)'],
  fog:          ['rgba(80,80,100,0.2)',    'rgba(70,70,90,0.12)'],
  storm:        ['rgba(20,10,50,0.35)',    'rgba(15,5,40,0.2)'],
  golden:       ['rgba(255,158,64,0.12)',  'rgba(255,140,40,0.06)'],   // golden hour
};

function skyKey(code: number, isDay: boolean, isGolden: boolean): string {
  if (isGolden) return 'golden';
  if (code === 0) return isDay ? 'clear_day' : 'clear_night';
  if (code === 1 || code === 2) return isDay ? 'partly_day' : 'partly_night';
  if (code === 3) return 'cloud';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 82) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloud';
}

export function useAutoTint(weather: any) {
  useEffect(() => {
    if (!weather?.current) return;
    const code = weather.current.weatherCode ?? 0;
    const isDay = weather.current.isDay !== false;
    const now = Date.now();
    const sr = weather.daily?.sunrise?.[0];
    const ss = weather.daily?.sunset?.[0];
    let isGolden = false;
    if (sr && ss) {
      const srT = new Date(sr).getTime();
      const ssT = new Date(ss).getTime();
      const ghMornEnd = srT + 3600000;
      const ghEveStart = ssT - 3600000;
      isGolden = (now >= srT && now <= ghMornEnd) || (now >= ghEveStart && now <= ssT);
    }
    const key = skyKey(code, isDay, isGolden);
    const [bg, surf] = TINTS[key] ?? TINTS['cloud'];
    document.documentElement.style.setProperty('--tint-bg', bg);
    document.documentElement.style.setProperty('--tint-surf', surf);
  }, [weather]);
}
