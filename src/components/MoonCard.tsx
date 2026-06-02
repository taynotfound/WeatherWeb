'use client';

import { Moon } from 'lucide-react';
import { Card } from './ui/Card';

// Synodic month
const SYNODIC = 29.530588853;
// Known new moon reference (2000-01-06 18:14 UT) Julian Date 2451550.1
const REF = 2451550.1;

function julianDate(d: Date): number {
  return d.getTime() / 86400000 + 2440587.5;
}

function moonPhase(d: Date = new Date()) {
  const days = julianDate(d) - REF;
  const cycles = days / SYNODIC;
  const phase = cycles - Math.floor(cycles); // 0..1
  const illum = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
  const ageDays = phase * SYNODIC;

  let name = 'New Moon';
  if (phase < 0.03 || phase > 0.97) name = 'New Moon';
  else if (phase < 0.22) name = 'Waxing Crescent';
  else if (phase < 0.28) name = 'First Quarter';
  else if (phase < 0.47) name = 'Waxing Gibbous';
  else if (phase < 0.53) name = 'Full Moon';
  else if (phase < 0.72) name = 'Waning Gibbous';
  else if (phase < 0.78) name = 'Last Quarter';
  else name = 'Waning Crescent';

  return { phase, illum, ageDays, name };
}

export function MoonCard() {
  const { phase, illum, ageDays, name } = moonPhase();
  const waxing = phase < 0.5;

  // Build a moon SVG: bright base + dark overlay shaped by phase.
  // Use two arcs: outer disc circle, inner ellipse whose x-radius shrinks with phase.
  const r = 36;
  // Terminator: width = |cos(2π·phase)| · r; on waxing side dark is on the LEFT (phase 0..0.5).
  const term = Math.abs(Math.cos(phase * 2 * Math.PI)) * r;
  // Decide where dark covers: left half during waxing (0..0.5), right half during waning.
  // Full moon (phase=0.5) shows no dark, new moon (phase~0) shows full dark.
  const isCrescent = illum < 0.5;
  const darkPath = buildShadow(r, phase, isCrescent, waxing);

  return (
    <Card id="moon" title="Moon" subtitle={name} icon={<Moon size={18} />}>
      <div className="moon-row">
        <svg viewBox="-40 -40 80 80" className="moon-svg" aria-hidden>
          <defs>
            <radialGradient id="moonSurface" cx="35%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#fff8e7" />
              <stop offset="60%" stopColor="#e8d9b8" />
              <stop offset="100%" stopColor="#9d8b66" />
            </radialGradient>
            <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="rgba(157,124,216,0.0)" />
              <stop offset="100%" stopColor="rgba(157,124,216,0.18)" />
            </radialGradient>
          </defs>
          <circle r={r + 4} fill="url(#moonGlow)" />
          <circle r={r} fill="url(#moonSurface)" />
          {/* craters */}
          <circle cx={-10} cy={-12} r={4}  fill="rgba(0,0,0,0.12)" />
          <circle cx={12}  cy={-4}  r={3}  fill="rgba(0,0,0,0.10)" />
          <circle cx={-4}  cy={14}  r={5}  fill="rgba(0,0,0,0.10)" />
          <circle cx={18}  cy={16}  r={2}  fill="rgba(0,0,0,0.10)" />
          {/* shadow overlay */}
          <path d={darkPath} fill="rgba(15,12,22,0.92)" />
          <circle r={r} fill="none" stroke="rgba(157,124,216,0.35)" strokeWidth="0.6" />
        </svg>
        <div className="moon-meta">
          <div className="moon-stat">
            <span className="moon-stat__label">Illumination</span>
            <span className="moon-stat__value">{Math.round(illum * 100)}%</span>
          </div>
          <div className="moon-stat">
            <span className="moon-stat__label">Age</span>
            <span className="moon-stat__value">{ageDays.toFixed(1)} d</span>
          </div>
          <div className="moon-stat">
            <span className="moon-stat__label">Cycle</span>
            <span className="moon-stat__value">{Math.round(phase * 100)}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function buildShadow(r: number, phase: number, isCrescent: boolean, waxing: boolean): string {
  // Compute ellipse semi-x for the terminator: x_t = r * cos(2π·phase)
  // Sign: positive during waxing first half (0..0.25 dark on left expanding right toward 0),
  // we just take absolute and decide side via waxing flag.
  const xT = Math.abs(r * Math.cos(phase * 2 * Math.PI));
  // Outer arc covers either the left half (waxing) or right half (waning).
  // sweep flags below assume Y-down SVG.
  if (isCrescent) {
    // Dark covers most of disc; bright is the thin crescent on one side.
    // We draw the dark region as: outer half-circle (the "non-lit" side) + ellipse arc carving out lit slice.
    if (waxing) {
      // bright on right, dark covers left half PLUS most of right except small right crescent.
      // Path: start (0,-r) → outer arc to (0,r) on LEFT side (sweep 0) → ellipse arc back to (0,-r) curving RIGHT (sweep 0)
      return `M 0 -${r} A ${r} ${r} 0 0 0 0 ${r} A ${xT} ${r} 0 0 0 0 -${r} Z`;
    } else {
      return `M 0 -${r} A ${r} ${r} 0 0 1 0 ${r} A ${xT} ${r} 0 0 1 0 -${r} Z`;
    }
  } else {
    // Gibbous: dark is a thin sliver on one side.
    if (waxing) {
      // bright covers most; dark sliver on LEFT.
      return `M 0 -${r} A ${r} ${r} 0 0 0 0 ${r} A ${xT} ${r} 0 0 1 0 -${r} Z`;
    } else {
      return `M 0 -${r} A ${r} ${r} 0 0 1 0 ${r} A ${xT} ${r} 0 0 0 0 -${r} Z`;
    }
  }
}
