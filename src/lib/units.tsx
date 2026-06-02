'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Unit = 'metric' | 'imperial';
type Ctx = {
  unit: Unit;
  setUnit: (u: Unit) => void;
  temp: (c: number) => number;
  tempUnit: string;
  speed: (kmh: number) => number;
  speedUnit: string;
};

const C = createContext<Ctx | null>(null);

export function UnitsProvider({ children }: { children: ReactNode }) {
  const [unit, setUnitState] = useState<Unit>('metric');
  useEffect(() => {
    const saved = localStorage.getItem('tomato-unit') as Unit | null;
    if (saved === 'imperial' || saved === 'metric') setUnitState(saved);
  }, []);
  const setUnit = (u: Unit) => {
    setUnitState(u);
    localStorage.setItem('tomato-unit', u);
  };
  const value: Ctx = {
    unit,
    setUnit,
    temp: (c) => (unit === 'imperial' ? c * 9 / 5 + 32 : c),
    tempUnit: unit === 'imperial' ? '°F' : '°',
    speed: (kmh) => (unit === 'imperial' ? kmh * 0.6213711922 : kmh),
    speedUnit: unit === 'imperial' ? 'mph' : 'km/h',
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useUnits() {
  const v = useContext(C);
  if (!v) throw new Error('useUnits must be inside UnitsProvider');
  return v;
}
