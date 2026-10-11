'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type { Attitude } from './attitude';

type Unit = 'metric' | 'imperial';
type Ctx = {
  unit: Unit; setUnit: (u: Unit) => void;
  attitude: Attitude; setAttitude: (a: Attitude) => void;
  /** 12° */ t: (c: number | null | undefined) => string;
  /** 54 (number) */ temp: (c: number) => number;
  /** 12 km/h */ spd: (kmh: number | null | undefined) => string;
  spdUnit: string;
  /** 1.2 mm / 0.05 in */ mm: (mm: number | null | undefined) => string;
  /** 10 km / 6 mi */ dist: (km: number | null | undefined) => string;
  /** 1013 hPa / 29.9 inHg */ press: (hpa: number | null | undefined) => string;
};

const C = createContext<Ctx | null>(null);
const load = <T,>(k: string, ok: T[], d: T): T => {
  try { const v = localStorage.getItem(k) as T | null; if (v && ok.includes(v)) return v; } catch {}
  return d;
};

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [unit, setU] = useState<Unit>('metric');
  const [attitude, setA] = useState<Attitude>('rude');
  useEffect(() => {
    const saved = load<Unit | ''>('tomato-unit', ['metric', 'imperial'], '');
    if (saved) setU(saved);
    else if (/^en-(US|LR|MM)/.test(navigator.language)) setU('imperial');
    setA(load<Attitude>('tomato-attitude', ['mild', 'rude', 'feral'], 'rude'));
  }, []);
  const setUnit = useCallback((u: Unit) => { setU(u); try { localStorage.setItem('tomato-unit', u); } catch {} }, []);
  const setAttitude = useCallback((a: Attitude) => { setA(a); try { localStorage.setItem('tomato-attitude', a); } catch {} }, []);

  const value = useMemo<Ctx>(() => {
    const imp = unit === 'imperial';
    const num = (v: number | null | undefined) => (typeof v === 'number' && isFinite(v) ? v : null);
    return {
      unit, setUnit, attitude, setAttitude,
      temp: c => (imp ? c * 9 / 5 + 32 : c),
      t: c => { const v = num(c); return v == null ? '–' : `${Math.round(imp ? v * 9 / 5 + 32 : v)}°`; },
      spd: k => { const v = num(k); return v == null ? '–' : `${Math.round(imp ? v * 0.621371 : v)}`; },
      spdUnit: imp ? 'mph' : 'km/h',
      mm: v => { const n = num(v); return n == null ? '–' : imp ? `${(n / 25.4).toFixed(2)} in` : `${n < 10 ? n.toFixed(1) : Math.round(n)} mm`; },
      dist: k => { const n = num(k); return n == null ? '–' : imp ? `${(n * 0.621371).toFixed(n > 16 ? 0 : 1)} mi` : `${n.toFixed(n > 10 ? 0 : 1)} km`; },
      press: h => { const n = num(h); return n == null ? '–' : imp ? `${(n * 0.02953).toFixed(2)} inHg` : `${Math.round(n)} hPa`; },
    };
  }, [unit, attitude, setUnit, setAttitude]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function usePrefs() {
  const v = useContext(C);
  if (!v) throw new Error('usePrefs must be inside PrefsProvider');
  return v;
}
