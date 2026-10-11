'use client';

// Material 3 dynamic color: the whole UI re-themes from a seed derived from the sky.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  argbFromHex, hexFromArgb, Hct, MaterialDynamicColors as M, SchemeTonalSpot,
} from '@material/material-color-utilities';
import type { SceneKind } from './wx';

export type ThemeMode = 'auto' | 'light' | 'dark';

const SEEDS: Record<SceneKind | 'night' | 'golden', string> = {
  clear: '#2F8CF0', partly: '#4C8DD6', cloud: '#6E86A6', fog: '#8796A8',
  drizzle: '#3F93B5', rain: '#2D6FC4', snow: '#6FB2E8', storm: '#7452E8',
  night: '#3F4FBF', golden: '#F08A24',
};

export function seedFor(kind: SceneKind, isDay: boolean, golden = false) {
  if (golden && (kind === 'clear' || kind === 'partly')) return SEEDS.golden;
  if (!isDay && (kind === 'clear' || kind === 'partly')) return SEEDS.night;
  return SEEDS[kind];
}

const ROLES: [string, any][] = [
  ['primary', M.primary], ['on-primary', M.onPrimary], ['primary-container', M.primaryContainer], ['on-primary-container', M.onPrimaryContainer],
  ['secondary', M.secondary], ['on-secondary', M.onSecondary], ['secondary-container', M.secondaryContainer], ['on-secondary-container', M.onSecondaryContainer],
  ['tertiary', M.tertiary], ['on-tertiary', M.onTertiary], ['tertiary-container', M.tertiaryContainer], ['on-tertiary-container', M.onTertiaryContainer],
  ['error', M.error], ['on-error', M.onError], ['error-container', M.errorContainer], ['on-error-container', M.onErrorContainer],
  ['background', M.background], ['on-background', M.onBackground],
  ['surface', M.surface], ['surface-dim', M.surfaceDim], ['surface-bright', M.surfaceBright],
  ['surface-container-lowest', M.surfaceContainerLowest], ['surface-container-low', M.surfaceContainerLow],
  ['surface-container', M.surfaceContainer], ['surface-container-high', M.surfaceContainerHigh], ['surface-container-highest', M.surfaceContainerHighest],
  ['on-surface', M.onSurface], ['on-surface-variant', M.onSurfaceVariant], ['outline', M.outline], ['outline-variant', M.outlineVariant],
  ['inverse-surface', M.inverseSurface], ['inverse-on-surface', M.inverseOnSurface], ['inverse-primary', M.inversePrimary],
  ['scrim', M.scrim], ['shadow', M.shadow],
];

export function schemeVars(seedHex: string, dark: boolean): Record<string, string> {
  const scheme = new SchemeTonalSpot(Hct.fromInt(argbFromHex(seedHex)), dark, 0);
  const out: Record<string, string> = {};
  for (const [name, dc] of ROLES) out[`--md-${name}`] = hexFromArgb(dc.getArgb(scheme));
  return out;
}

type Ctx = { mode: ThemeMode; setMode: (m: ThemeMode) => void; dark: boolean; seed: string | null; setSeed: (hex: string) => void };
const C = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [systemDark, setSystemDark] = useState(true);
  const [seed, setSeed] = useState<string | null>(null);

  useEffect(() => {
    try { const m = localStorage.getItem('tomato-theme') as ThemeMode | null; if (m === 'light' || m === 'dark' || m === 'auto') setModeState(m); } catch {}
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => setSystemDark(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const dark = mode === 'auto' ? systemDark : mode === 'dark';
  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try { localStorage.setItem('tomato-theme', m); } catch {}
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = dark ? 'dark' : 'light';
    root.style.colorScheme = dark ? 'dark' : 'light';
    if (seed) {
      const vars = schemeVars(seed, dark);
      for (const k in vars) root.style.setProperty(k, vars[k]);
    } else {
      // no seed yet: drop inline vars so the CSS baseline for the current mode applies
      ROLES.forEach(([n]) => root.style.removeProperty(`--md-${n}`));
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(root).getPropertyValue('--md-surface').trim() || '#101418');
  }, [seed, dark]);

  const value = useMemo(() => ({ mode, setMode, dark, seed, setSeed }), [mode, setMode, dark, seed]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useTheme() {
  const v = useContext(C);
  if (!v) throw new Error('useTheme must be inside ThemeProvider');
  return v;
}
