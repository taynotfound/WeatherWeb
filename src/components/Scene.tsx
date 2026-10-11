'use client';

import { useMemo } from 'react';
import type { SceneKind } from '@/lib/wx';

// Deterministic pseudo-random so SSR/CSR markup agree.
const rnd = (i: number, salt: number) => { const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return x - Math.floor(x); };

export function Scene({ kind, isDay, intensity = 1 }: { kind: SceneKind; isDay: boolean; intensity?: number }) {
  const parts = useMemo(() => {
    const n = (c: number) => Math.round(c * intensity);
    return {
      drops: Array.from({ length: n(kind === 'drizzle' ? 22 : kind === 'storm' ? 46 : 36) }, (_, i) => ({ l: rnd(i, 1) * 110 - 5, d: 0.6 + rnd(i, 2) * 0.7, dl: -rnd(i, 3) * 2 })),
      flakes: Array.from({ length: n(34) }, (_, i) => ({ l: rnd(i, 4) * 100, s: 3 + rnd(i, 5) * 5, d: 5 + rnd(i, 6) * 6, dl: -rnd(i, 7) * 8 })),
      stars: Array.from({ length: 30 }, (_, i) => ({ l: rnd(i, 8) * 100, t: rnd(i, 9) * 45, dl: rnd(i, 10) * 3 })),
      clouds: Array.from({ length: 4 }, (_, i) => ({ t: 2 + rnd(i, 11) * 34, w: 110 + rnd(i, 12) * 110, d: 50 + rnd(i, 13) * 50, dl: -rnd(i, 14) * 80 })),
    };
  }, [kind, intensity]);

  const clouds = kind === 'partly' ? 2 : kind === 'clear' ? 0 : 3;
  const showSky = kind === 'clear' || kind === 'partly';

  return (
    <div className="scene" aria-hidden="true">
      {showSky && isDay && <div className="sun" />}
      {showSky && !isDay && (
        <>
          <div className="moon" />
          {parts.stars.map((s, i) => <span key={i} className="star" style={{ left: `${s.l}%`, top: `${s.t}%`, animationDelay: `${s.dl}s` }} />)}
        </>
      )}
      {!isDay && kind !== 'clear' && parts.stars.slice(0, 10).map((s, i) => <span key={i} className="star" style={{ left: `${s.l}%`, top: `${s.t}%`, animationDelay: `${s.dl}s`, opacity: .4 }} />)}
      {parts.clouds.slice(0, clouds).map((c, i) => <span key={i} className="cloud" style={{ top: `${c.t}%`, width: c.w, animationDuration: `${c.d}s`, animationDelay: `${c.dl}s` }} />)}
      {(kind === 'rain' || kind === 'drizzle' || kind === 'storm') && parts.drops.map((d, i) => (
        <span key={i} className="drop" style={{ left: `${d.l}%`, animationDuration: `${d.d}s`, animationDelay: `${d.dl}s`, height: kind === 'drizzle' ? 10 : 18 }} />
      ))}
      {kind === 'snow' && parts.flakes.map((f, i) => <span key={i} className="flake" style={{ left: `${f.l}%`, width: f.s, height: f.s, animationDuration: `${f.d}s`, animationDelay: `${f.dl}s` }} />)}
      {kind === 'fog' && [20, 45, 70].map((t, i) => <span key={i} className="fogband" style={{ top: `${t}%`, animationDelay: `${-i * 3}s`, animationDuration: `${10 + i * 3}s` }} />)}
      {kind === 'storm' && <div className="flash" />}
    </div>
  );
}
