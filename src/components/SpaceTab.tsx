'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Satellite, Telescope, Star, Zap, Moon, Sun, Circle,
  Eye, EyeOff, RefreshCw, Globe, Clock, Sunrise, Sunset,
} from 'lucide-react';
import { Card } from './ui/Card';

// ─── Types ───────────────────────────────────────────────────────────────────
type IssData = {
  lat: number; lon: number;
  altitude: number | null; velocity: number | null;
};

type PlanetInfo = {
  name: string; symbol: string; color: string;
  magnitude: number; altitude: number; azimuth: number; visible: boolean;
  distAU: number;
};

type MoonInfo = {
  phase: number; phaseName: string; illumination: number;
  age: number; rise: Date | null; set: Date | null;
  nextFull: Date; nextNew: Date;
};

type Shower = {
  name: string; peak: Date; daysAway: number; zhr: number;
  active: boolean; radiant: string;
};

type Eclipse = { type: string; date: Date; label: string; };

// ─── Constants ────────────────────────────────────────────────────────────────
const SHOWERS: Array<{ name: string; peak: [number,number]; zhr: number; radiant: string; start: [number,number]; end: [number,number] }> = [
  { name: 'Quadrantids',     peak: [1,3],   zhr: 120, radiant: 'Boötes',       start: [1,1],   end: [1,5]   },
  { name: 'Lyrids',          peak: [4,22],  zhr: 18,  radiant: 'Lyra',         start: [4,16],  end: [4,25]  },
  { name: 'Eta Aquariids',   peak: [5,6],   zhr: 50,  radiant: 'Aquarius',     start: [4,19],  end: [5,28]  },
  { name: 'Delta Aquariids', peak: [7,30],  zhr: 20,  radiant: 'Aquarius',     start: [7,12],  end: [8,23]  },
  { name: 'Perseids',        peak: [8,12],  zhr: 100, radiant: 'Perseus',      start: [7,17],  end: [8,24]  },
  { name: 'Orionids',        peak: [10,21], zhr: 20,  radiant: 'Orion',        start: [10,2],  end: [11,7]  },
  { name: 'Leonids',         peak: [11,17], zhr: 15,  radiant: 'Leo',          start: [11,6],  end: [11,30] },
  { name: 'Geminids',        peak: [12,14], zhr: 150, radiant: 'Gemini',       start: [12,4],  end: [12,17] },
  { name: 'Ursids',          peak: [12,22], zhr: 10,  radiant: 'Ursa Minor',   start: [12,17], end: [12,26] },
];

const ECLIPSES_2025_26: Eclipse[] = [
  { type: 'Total Lunar',    date: new Date('2025-09-07T18:11:00Z'), label: 'visible from Europe, Africa, Asia, Americas' },
  { type: 'Partial Solar',  date: new Date('2025-09-21T19:43:00Z'), label: 'visible from southern oceans, Antarctica' },
  { type: 'Total Lunar',    date: new Date('2026-03-03T11:33:00Z'), label: 'visible from Americas, Europe, Africa, Asia' },
  { type: 'Total Solar',    date: new Date('2026-08-12T17:45:00Z'), label: 'visible from Greenland, Iceland, Spain, Russia' },
  { type: 'Partial Lunar',  date: new Date('2026-08-28T04:13:00Z'), label: 'visible from Americas, Europe, Africa' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (lat2-lat1)*toR, dLon = (lon2-lon1)*toR;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*toR)*Math.cos(lat2*toR)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDist(km: number) {
  return km < 1000 ? `${Math.round(km)} km` : `${(km/1000).toFixed(1)}k km`;
}

function daysUntil(d: Date) {
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

// ─── Moon phase math (simplified Meeus) ──────────────────────────────────────
function computeMoon(now = new Date()): MoonInfo {
  const KNOWN_NEW = new Date('2000-01-06T18:14:00Z');
  const SYNODIC = 29.530588853;
  const elapsed = (now.getTime() - KNOWN_NEW.getTime()) / 86400000;
  const age = ((elapsed % SYNODIC) + SYNODIC) % SYNODIC;
  const phase = age / SYNODIC; // 0..1
  const illum = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);

  let phaseName = '';
  if (age < 1.85)       phaseName = 'New Moon';
  else if (age < 7.38)  phaseName = 'Waxing Crescent';
  else if (age < 9.22)  phaseName = 'First Quarter';
  else if (age < 14.77) phaseName = 'Waxing Gibbous';
  else if (age < 16.61) phaseName = 'Full Moon';
  else if (age < 22.15) phaseName = 'Waning Gibbous';
  else if (age < 23.99) phaseName = 'Last Quarter';
  else if (age < 29.53) phaseName = 'Waning Crescent';
  else phaseName = 'New Moon';

  const daysToFull = age < 14.77 ? (14.77 - age) : (SYNODIC - age + 14.77);
  const daysToNew  = age < 29.53 ? (SYNODIC - age) : (SYNODIC - age + SYNODIC);
  const nextFull   = new Date(now.getTime() + daysToFull * 86400000);
  const nextNew    = new Date(now.getTime() + daysToNew  * 86400000);

  return { phase, phaseName, illumination: illum, age, rise: null, set: null, nextFull, nextNew };
}

// ─── Planet visibility (simplified ecliptic math) ────────────────────────────
function computePlanets(lat: number, _lon: number, now = new Date()): PlanetInfo[] {
  const JD = (now.getTime() / 86400000) + 2440587.5;
  const T = (JD - 2451545.0) / 36525;

  // Very simplified: compute rough RA/Dec and altitude for inner planets
  // For outer planets we use mean longitude approach (good to ~5°)
  const planets: Array<{ name: string; symbol: string; color: string; L0: number; L1: number; a: number; i: number }> = [
    { name: 'Mercury', symbol: '☿', color: '#a89bc2', L0: 252.2509, L1: 149472.6674, a: 0.387, i: 7.0 },
    { name: 'Venus',   symbol: '♀', color: '#f7a45c', L0: 181.9798, L1: 58517.8157,  a: 0.723, i: 3.4 },
    { name: 'Mars',    symbol: '♂', color: '#f7768e', L0: 355.4330, L1: 19140.2993,  a: 1.524, i: 1.8 },
    { name: 'Jupiter', symbol: '♃', color: '#e0af68', L0: 34.3515,  L1: 3034.9057,   a: 5.203, i: 1.3 },
    { name: 'Saturn',  symbol: '♄', color: '#9d7cd8', L0: 50.0774,  L1: 1222.1138,   a: 9.537, i: 2.5 },
    { name: 'Uranus',  symbol: '⛢', color: '#7aa2f7', L0: 314.0550, L1: 428.4748,    a: 19.19, i: 0.8 },
    { name: 'Neptune', symbol: '♆', color: '#73daca', L0: 304.3487, L1: 218.4862,    a: 30.07, i: 1.8 },
  ];

  const sunL = (280.46646 + 36000.76983 * T) % 360;
  const toRad = Math.PI / 180;

  return planets.map(p => {
    const L = ((p.L0 + p.L1 * T / 36525) % 360 + 360) % 360;
    const elong = ((L - sunL) % 360 + 360) % 360;
    const altApprox = Math.sin((elong - 90) * toRad) * (90 - Math.abs(lat)) * 0.7;
    const az = (elong + 180) % 360;
    const visible = altApprox > 10;

    // Approximate apparent magnitude (very rough)
    const mag = p.a < 1
      ? (p.name === 'Venus' ? -4.0 : 0.5)
      : p.name === 'Jupiter' ? -2.5
      : p.name === 'Saturn' ? 0.7
      : p.name === 'Mars' ? 1.0
      : p.name === 'Uranus' ? 5.7
      : 7.8;

    return {
      name: p.name, symbol: p.symbol, color: p.color,
      magnitude: mag, altitude: Math.round(altApprox),
      azimuth: Math.round(az), visible,
      distAU: p.a,
    };
  });
}

// ─── Compute meteor showers ───────────────────────────────────────────────────
function computeShowers(): Shower[] {
  const now = new Date();
  const yr = now.getFullYear();
  return SHOWERS.map(s => {
    const peak = new Date(yr, s.peak[0]-1, s.peak[1]);
    if (peak < now) peak.setFullYear(yr+1);
    const start = new Date(yr, s.start[0]-1, s.start[1]);
    if (start < now && peak.getFullYear() > yr) start.setFullYear(yr+1);
    const end = new Date(yr, s.end[0]-1, s.end[1]);
    if (end < now) end.setFullYear(yr+1);
    return {
      name: s.name, peak, radiant: s.radiant, zhr: s.zhr,
      daysAway: (peak.getTime() - now.getTime()) / 86400000,
      active: now >= start && now <= end,
    };
  }).sort((a,b) => a.daysAway - b.daysAway);
}

// ─── Mini SVG Moon ────────────────────────────────────────────────────────────
function MoonSvg({ phase, size = 60 }: { phase: number; size?: number }) {
  const r = size / 2 - 2;
  const cx = size / 2, cy = size / 2;
  const isWaxing = phase < 0.5;
  const t = isWaxing ? phase * 2 : (phase - 0.5) * 2;
  const rx = Math.abs(t - 0.5) * 2 * r;
  const limbSweep = isWaxing ? 0 : 1;
  const termSweep = isWaxing ? 1 : 0;

  const path = [
    `M ${cx} ${cy - r}`,
    `A ${r} ${r} 0 0 ${limbSweep} ${cx} ${cy + r}`,
    `A ${rx} ${r} 0 0 ${termSweep} ${cx} ${cy - r}`,
    'Z',
  ].join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="#1a1625" stroke="#9d7cd8" strokeWidth={1.5} />
      <path d={path} fill="#dcd7e8" opacity={0.9} />
    </svg>
  );
}

// ─── ISS Mini Map ─────────────────────────────────────────────────────────────
function IssMap({ issLat, issLon, userLat, userLon }: { issLat: number; issLon: number; userLat: number; userLon: number }) {
  const W = 540, H = 270;
  const toX = (lon: number) => ((lon + 180) / 360) * W;
  const toY = (lat: number) => ((90 - lat) / 180) * H;

  const ix = toX(issLon), iy = toY(issLat);
  const ux = toX(userLon), uy = toY(userLat);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', borderRadius: 8, background: '#0d0c14', border: '1px solid rgba(157,124,216,0.2)' }}
    >
      {/* Simple equirectangular grid */}
      {[-60,-30,0,30,60].map(lat => (
        <line key={lat} x1={0} y1={toY(lat)} x2={W} y2={toY(lat)} stroke="rgba(157,124,216,0.1)" strokeWidth={1} />
      ))}
      {[-120,-60,0,60,120].map(lon => (
        <line key={lon} x1={toX(lon)} y1={0} x2={toX(lon)} y2={H} stroke="rgba(157,124,216,0.1)" strokeWidth={1} />
      ))}
      {/* Equator highlight */}
      <line x1={0} y1={toY(0)} x2={W} y2={toY(0)} stroke="rgba(157,124,216,0.25)" strokeWidth={1} strokeDasharray="4 4" />

      {/* ISS orbit band ±51.6° */}
      <rect x={0} y={toY(51.6)} width={W} height={toY(-51.6) - toY(51.6)} fill="rgba(157,124,216,0.04)" />

      {/* User location */}
      <circle cx={ux} cy={uy} r={5} fill="#7aa2f7" opacity={0.9} />
      <circle cx={ux} cy={uy} r={10} fill="none" stroke="#7aa2f7" strokeWidth={1} opacity={0.4} />

      {/* ISS */}
      <circle cx={ix} cy={iy} r={6} fill="#73daca" />
      <circle cx={ix} cy={iy} r={12} fill="none" stroke="#73daca" strokeWidth={1.5} opacity={0.5}>
        <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <text x={ix + 9} y={iy - 6} fill="#73daca" fontSize={10} fontFamily="monospace">ISS</text>

      {/* Labels */}
      <text x={4} y={H-4} fill="rgba(157,124,216,0.5)" fontSize={9} fontFamily="monospace">🟦 you  🟢 ISS</text>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function SpaceTab({ lat, lon }: { lat: number; lon: number }) {
  const [iss, setIss] = useState<IssData | null>(null);
  const [issErr, setIssErr] = useState(false);
  const [issHistory, setIssHistory] = useState<Array<{ lat: number; lon: number }>>([]);
  const moon = computeMoon();
  const showers = computeShowers();
  const planets = computePlanets(lat, lon);
  const [now, setNow] = useState(new Date());
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    async function fetchIss() {
      try {
        const r = await fetch('/api/iss');
        if (!r.ok) throw new Error();
        const j = await r.json();
        if (!alive || j.error) { if (alive) setIssErr(true); return; }
        setIss(j);
        setIssErr(false);
        setIssHistory(prev => [...prev.slice(-30), { lat: j.lat, lon: j.lon }]);
      } catch { if (alive) setIssErr(true); }
    }
    fetchIss();
    const id = setInterval(fetchIss, 10_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const dist = iss ? haversine(lat, lon, iss.lat, iss.lon) : null;
  const nextEclipses = ECLIPSES_2025_26.filter(e => e.date > now).slice(0, 3);
  const activeShower = showers.find(s => s.active);
  const visiblePlanets = planets.filter(p => p.visible);

  return (
    <div className="space-tab">
      {/* ── ISS LIVE ─────────────────────────────────────────────────────── */}
      <Card id="iss-live" title="International Space Station" subtitle="Live position · updates every 10s" icon={<Satellite size={18} />}>
        {issErr ? (
          <p className="space-err">ISS data unavailable right now</p>
        ) : !iss ? (
          <div className="space-skeleton-block" />
        ) : (
          <>
            <IssMap issLat={iss.lat} issLon={iss.lon} userLat={lat} userLon={lon} />
            <div className="iss-stats">
              <div className="iss-stat">
                <span className="iss-stat__label">Coordinates</span>
                <span className="iss-stat__val">{iss.lat.toFixed(3)}°, {iss.lon.toFixed(3)}°</span>
              </div>
              <div className="iss-stat">
                <span className="iss-stat__label">Distance from you</span>
                <span className="iss-stat__val iss-stat__val--accent">{fmtDist(dist!)}</span>
              </div>
              {iss.altitude != null && (
                <div className="iss-stat">
                  <span className="iss-stat__label">Altitude</span>
                  <span className="iss-stat__val">{Math.round(iss.altitude)} km</span>
                </div>
              )}
              {iss.velocity != null && (
                <div className="iss-stat">
                  <span className="iss-stat__label">Velocity</span>
                  <span className="iss-stat__val">{Math.round(iss.velocity).toLocaleString()} km/h</span>
                </div>
              )}
              <div className="iss-stat">
                <span className="iss-stat__label">Orbital period</span>
                <span className="iss-stat__val">~92 minutes</span>
              </div>
              <div className="iss-stat">
                <span className="iss-stat__label">Crew aboard</span>
                <span className="iss-stat__val">7 astronauts</span>
              </div>
            </div>
            <p className="iss-note">
              <span className="space-live-dot" /> Live · ISS orbits Earth every ~92 min at ~400 km altitude
            </p>
          </>
        )}
      </Card>

      {/* ── MOON ─────────────────────────────────────────────────────────── */}
      <Card id="moon-detail" title="Moon" subtitle={moon.phaseName} icon={<Moon size={18} />}>
        <div className="moon-detail">
          <MoonSvg phase={moon.phase} size={90} />
          <div className="moon-detail__info">
            <div className="moon-row">
              <span className="moon-label">Illumination</span>
              <span className="moon-val">{moon.illumination}%</span>
            </div>
            <div className="moon-row">
              <span className="moon-label">Age</span>
              <span className="moon-val">{moon.age.toFixed(1)} days</span>
            </div>
            <div className="moon-row">
              <span className="moon-label">Next full moon</span>
              <span className="moon-val">{fmtDate(moon.nextFull)} <em>({daysUntil(moon.nextFull)}d)</em></span>
            </div>
            <div className="moon-row">
              <span className="moon-label">Next new moon</span>
              <span className="moon-val">{fmtDate(moon.nextNew)} <em>({daysUntil(moon.nextNew)}d)</em></span>
            </div>
          </div>
        </div>
        {/* Phase progress bar */}
        <div className="moon-progress-wrap">
          <span className="moon-progress-label">🌑</span>
          <div className="moon-progress-bar">
            <div className="moon-progress-fill" style={{ width: `${moon.phase * 100}%` }} />
            <div className="moon-progress-thumb" style={{ left: `${moon.phase * 100}%` }} />
          </div>
          <span className="moon-progress-label">🌑</span>
        </div>
        <div className="moon-phases-row">
          {['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'].map((e,i) => (
            <span key={i} className={`moon-phase-chip ${Math.round(moon.phase * 8) % 8 === i ? 'moon-phase-chip--active' : ''}`}>{e}</span>
          ))}
        </div>
      </Card>

      {/* ── PLANETS TONIGHT ──────────────────────────────────────────────── */}
      <Card id="planets" title="Planets Tonight" subtitle="Visibility from your location" icon={<Globe size={18} />}>
        <div className="planets-grid">
          {planets.map(p => (
            <div key={p.name} className={`planet-card ${p.visible ? 'planet-card--visible' : 'planet-card--hidden'}`}>
              <div className="planet-symbol" style={{ color: p.color }}>{p.symbol}</div>
              <div className="planet-name">{p.name}</div>
              <div className="planet-mag">mag {p.magnitude > 0 ? '+' : ''}{p.magnitude}</div>
              <div className={`planet-vis ${p.visible ? 'planet-vis--yes' : ''}`}>
                {p.visible ? <><Eye size={11} /> visible</> : <><EyeOff size={11} /> below horizon</>}
              </div>
              {p.visible && (
                <div className="planet-az">Az {p.azimuth}° · {p.altitude}° up</div>
              )}
            </div>
          ))}
        </div>
        <p className="planets-note">Positions approximate — use a sky app for precise viewing angles</p>
      </Card>

      {/* ── METEOR SHOWERS ───────────────────────────────────────────────── */}
      <Card id="meteors" title="Meteor Showers" subtitle="Annual calendar" icon={<Zap size={18} />}>
        {activeShower && (
          <div className="shower-active-banner">
            <Zap size={14} /> <strong>{activeShower.name}</strong> is active now! Peak {fmtDate(activeShower.peak)} · ~{activeShower.zhr}/hr
          </div>
        )}
        <div className="showers-list">
          {showers.slice(0, 6).map(s => (
            <div key={s.name} className={`shower-row ${s.active ? 'shower-row--active' : ''}`}>
              <div className="shower-row__left">
                <span className="shower-name">{s.name}</span>
                <span className="shower-radiant">{s.radiant}</span>
              </div>
              <div className="shower-row__right">
                <span className="shower-peak">Peak {fmtDate(s.peak)}</span>
                <span className="shower-days">{s.active ? '🟢 active' : `${Math.round(s.daysAway)}d away`}</span>
                <span className="shower-zhr" style={{ color: 'var(--accent)' }}>~{s.zhr}/hr</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── ECLIPSES ─────────────────────────────────────────────────────── */}
      <Card id="eclipses" title="Upcoming Eclipses" subtitle="2025–2026" icon={<Circle size={18} />}>
        <div className="eclipses-list">
          {nextEclipses.map((e, i) => (
            <div key={i} className="eclipse-row">
              <div className="eclipse-type-badge" style={{ background: e.type.includes('Solar') ? 'rgba(255,158,100,0.15)' : 'rgba(157,124,216,0.15)', color: e.type.includes('Solar') ? 'var(--accent)' : 'var(--primary)' }}>
                {e.type.includes('Solar') ? '☀️' : '🌕'} {e.type}
              </div>
              <div className="eclipse-meta">
                <span className="eclipse-date">{fmtDate(e.date)}</span>
                <span className="eclipse-days">{daysUntil(e.date)}d away</span>
              </div>
              <div className="eclipse-label">{e.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── FUN SPACE FACTS ──────────────────────────────────────────────── */}
      <SpaceFact moon={moon} iss={iss} />
    </div>
  );
}

// ─── Rotating space facts ─────────────────────────────────────────────────────
const FACTS = [
  "The ISS travels at ~7.7 km/s — fast enough to circle Earth in 92 minutes.",
  "There have been people living in space continuously since November 2000.",
  "The Moon is slowly drifting away from Earth at ~3.8 cm per year.",
  "A full synodic month is exactly 29 days, 12 hours, 44 minutes, and 3 seconds.",
  "Jupiter's Great Red Spot is a storm that has raged for over 350 years.",
  "Saturn's rings are mostly water ice and are only ~20 metres thick.",
  "The Sun accounts for 99.86% of the mass of the entire solar system.",
  "Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.",
  "Venus rotates so slowly that a day on Venus is longer than its year.",
  "Neutron stars can spin 700 times per second.",
];

function SpaceFact({ moon, iss }: { moon: MoonInfo; iss: IssData | null }) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * FACTS.length));
  return (
    <Card id="space-fact" title="Space Fact" subtitle="tap to cycle" icon={<Star size={18} />}>
      <button
        className="space-fact-btn"
        onClick={() => setIdx(i => (i + 1) % FACTS.length)}
      >
        <span className="space-fact-emoji">🚀</span>
        <p className="space-fact-text">{FACTS[idx]}</p>
        <span className="space-fact-hint">tap for another</span>
      </button>
    </Card>
  );
}
