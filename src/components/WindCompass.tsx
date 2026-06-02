'use client';

import { Wind } from 'lucide-react';
import { Card } from './ui/Card';
import { useUnits } from '@/lib/units';

function dirLabel(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(((deg % 360) / 22.5)) % 16];
}

export function WindCompass({ weather }: { weather: any }) {
  const c = weather?.current;
  if (!c) return null;
  const { speed, speedUnit } = useUnits();
  const dir = c.windDirection ?? 0;
  const speedVal = c.windKmh ?? 0;
  const gust = c.windGustKmh ?? null;

  return (
    <Card id="wind" title="Wind" icon={<Wind size={18} />}>
      <div className="compass" aria-label={`Wind from ${dirLabel(dir)}, ${Math.round(speed(speedVal))} ${speedUnit}`}>
        <div className="compass__ring" />
        <span className="compass__cardinal compass__cardinal--n">N</span>
        <span className="compass__cardinal compass__cardinal--s">S</span>
        <span className="compass__cardinal compass__cardinal--e">E</span>
        <span className="compass__cardinal compass__cardinal--w">W</span>
        <div
          className="compass__needle"
          style={{ transform: `translate(-50%, -100%) rotate(${dir}deg)` }}
        />
        <div className="compass__center">{dirLabel(dir)}</div>
      </div>
      <div className="compass-stats">
        <div className="compass-stat">
          <span className="compass-stat__label">Speed</span>
          <span className="compass-stat__value">{Math.round(speed(speedVal))} {speedUnit}</span>
        </div>
        <div className="compass-stat">
          <span className="compass-stat__label">Direction</span>
          <span className="compass-stat__value">{Math.round(dir)}° {dirLabel(dir)}</span>
        </div>
        {gust != null && (
          <div className="compass-stat">
            <span className="compass-stat__label">Gust</span>
            <span className="compass-stat__value">{Math.round(speed(gust))} {speedUnit}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
