'use client';

import { useEffect, useMemo, useState } from 'react';
import { feature } from 'topojson-client';
import { geoEquirectangular, geoPath } from 'd3-geo';

type WorldMapProps = {
  width?: number;
  height?: number;
  user?: { lat: number; lon: number; label?: string };
  iss?: { lat: number; lon: number; label?: string };
  issTrail?: Array<{ lat: number; lon: number }>;
  showOrbitBand?: boolean;
  showTerminator?: boolean;
  className?: string;
};

let cachedLand: any = null;
let cachedPromise: Promise<any> | null = null;

async function loadLand() {
  if (cachedLand) return cachedLand;
  if (!cachedPromise) {
    cachedPromise = fetch('/data/land-110m.json')
      .then((r) => r.json())
      .then((topo) => {
        const land = feature(topo, topo.objects.land);
        cachedLand = land;
        return land;
      });
  }
  return cachedPromise;
}

// Subsolar point — approximate (good enough for a dusk/night terminator overlay)
function subsolar(now: Date) {
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const dayOfYear = (now.getTime() - start) / 86_400_000;
  const decl = -23.44 * Math.cos(((2 * Math.PI) / 365.25) * (dayOfYear + 10));
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  const lon = -15 * (utcHours - 12);
  return { lat: decl, lon };
}

// Build a night polygon as a series of (lon, lat) points along the great circle 90° from the sun.
function terminatorPath(now: Date, width: number, height: number, toX: (l: number) => number, toY: (l: number) => number) {
  const sun = subsolar(now);
  const sunLatRad = (sun.lat * Math.PI) / 180;
  const sunLonRad = (sun.lon * Math.PI) / 180;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= 360; i += 2) {
    // sweep azimuth around the sun's antipode
    const az = (i * Math.PI) / 180;
    // 90° great-circle offset from the subsolar point
    const lat = Math.asin(Math.sin(sunLatRad) * Math.cos(Math.PI / 2) + Math.cos(sunLatRad) * Math.sin(Math.PI / 2) * Math.cos(az));
    const lon = sunLonRad + Math.atan2(Math.sin(az) * Math.sin(Math.PI / 2) * Math.cos(sunLatRad), Math.cos(Math.PI / 2) - Math.sin(sunLatRad) * Math.sin(lat));
    pts.push([((lon * 180) / Math.PI + 540) % 360 - 180, (lat * 180) / Math.PI]);
  }
  // Determine if north pole is in shadow (true => night polygon is "above" the terminator)
  const nightAtPole = sun.lat < 0;
  // Build SVG path: trace terminator, then close along top or bottom edge
  pts.sort((a, b) => a[0] - b[0]);
  let d = `M ${toX(pts[0][0])} ${toY(pts[0][1])} `;
  for (let i = 1; i < pts.length; i++) d += `L ${toX(pts[i][0])} ${toY(pts[i][1])} `;
  if (nightAtPole) {
    d += `L ${width} ${0} L ${0} ${0} Z`;
  } else {
    d += `L ${width} ${height} L ${0} ${height} Z`;
  }
  return d;
}

export function WorldMap({
  width = 720,
  height = 360,
  user,
  iss,
  issTrail,
  showOrbitBand = false,
  showTerminator = false,
  className,
}: WorldMapProps) {
  const [land, setLand] = useState<any>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    let alive = true;
    loadLand().then((l) => { if (alive) setLand(l); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!showTerminator) return;
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [showTerminator]);

  const projection = useMemo(
    () => geoEquirectangular().scale(width / (2 * Math.PI)).translate([width / 2, height / 2]),
    [width, height]
  );
  const pathGen = useMemo(() => geoPath(projection as any), [projection]);
  const landPath = useMemo(() => (land ? pathGen(land) || '' : ''), [land, pathGen]);

  const toX = (lon: number) => ((lon + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  const termPath = useMemo(
    () => (showTerminator ? terminatorPath(now, width, height, toX, toY) : ''),
    [showTerminator, now, width, height]
  );

  const trailD = useMemo(() => {
    if (!issTrail || issTrail.length < 2) return '';
    return issTrail
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.lon)} ${toY(p.lat)}`)
      .join(' ');
  }, [issTrail, width, height]);

  const orbitBandPath = useMemo(() => {
    if (!showOrbitBand) return '';
    // Sinusoidal envelope of ±51.6° orbit projected on equirectangular ≈ smooth band
    const inc = 51.6;
    const top: Array<[number, number]> = [];
    const bot: Array<[number, number]> = [];
    for (let l = -180; l <= 180; l += 4) {
      const lat = inc * Math.sin((l * Math.PI) / 180); // illustrative undulation
      top.push([l, lat + 5]);
      bot.push([l, lat - 5]);
    }
    let d = `M ${toX(top[0][0])} ${toY(top[0][1])}`;
    for (let i = 1; i < top.length; i++) d += ` L ${toX(top[i][0])} ${toY(top[i][1])}`;
    for (let i = bot.length - 1; i >= 0; i--) d += ` L ${toX(bot[i][0])} ${toY(bot[i][1])}`;
    d += ' Z';
    return d;
  }, [showOrbitBand, width, height]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{
        width: '100%',
        height: 'auto',
        borderRadius: 10,
        background: 'linear-gradient(180deg, #0a0814 0%, #0d0c14 70%, #100d18 100%)',
        border: '1px solid rgba(157,124,216,0.18)',
        display: 'block',
      }}
    >
      <defs>
        <radialGradient id="iss-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#73daca" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#73daca" stopOpacity={0} />
        </radialGradient>
        <pattern id="map-grid" width={60} height={30} patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 30" fill="none" stroke="rgba(157,124,216,0.05)" strokeWidth={0.5} />
        </pattern>
      </defs>

      {/* Grid backdrop */}
      <rect x={0} y={0} width={width} height={height} fill="url(#map-grid)" />

      {/* Lat/lon reference lines */}
      {[-60, -30, 0, 30, 60].map((lat) => (
        <line
          key={`lat-${lat}`}
          x1={0}
          y1={toY(lat)}
          x2={width}
          y2={toY(lat)}
          stroke={lat === 0 ? 'rgba(157,124,216,0.22)' : 'rgba(157,124,216,0.08)'}
          strokeWidth={0.6}
          strokeDasharray={lat === 0 ? '4 4' : '2 4'}
        />
      ))}

      {/* Land */}
      {landPath && (
        <>
          <path d={landPath} fill="rgba(157,124,216,0.10)" stroke="rgba(157,124,216,0.45)" strokeWidth={0.6} strokeLinejoin="round" />
        </>
      )}

      {/* Night terminator overlay */}
      {termPath && (
        <path d={termPath} fill="rgba(8,6,16,0.55)" stroke="rgba(122,162,247,0.25)" strokeWidth={0.5} />
      )}

      {/* ISS orbit band */}
      {orbitBandPath && (
        <path d={orbitBandPath} fill="rgba(115,218,202,0.05)" stroke="rgba(115,218,202,0.18)" strokeWidth={0.5} strokeDasharray="3 5" />
      )}

      {/* ISS trail */}
      {trailD && (
        <path d={trailD} fill="none" stroke="rgba(115,218,202,0.55)" strokeWidth={1.2} strokeLinecap="round" />
      )}

      {/* User pin */}
      {user && (
        <g>
          <circle cx={toX(user.lon)} cy={toY(user.lat)} r={14} fill="url(#iss-glow)" opacity={0.45} />
          <circle cx={toX(user.lon)} cy={toY(user.lat)} r={5} fill="#7aa2f7" stroke="#0d0c14" strokeWidth={1.2} />
          {user.label && (
            <text
              x={toX(user.lon) + 8}
              y={toY(user.lat) + 4}
              fill="#7aa2f7"
              fontSize={10}
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fontWeight={600}
            >
              {user.label}
            </text>
          )}
        </g>
      )}

      {/* ISS marker */}
      {iss && (
        <g>
          <circle cx={toX(iss.lon)} cy={toY(iss.lat)} r={18} fill="url(#iss-glow)" />
          <circle cx={toX(iss.lon)} cy={toY(iss.lat)} r={6} fill="#73daca" stroke="#0d0c14" strokeWidth={1.5}>
            <animate attributeName="opacity" values="1;0.55;1" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx={toX(iss.lon)} cy={toY(iss.lat)} r={12} fill="none" stroke="#73daca" strokeWidth={1.3} opacity={0.55}>
            <animate attributeName="r" values="10;22;10" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.55;0;0.55" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <text
            x={toX(iss.lon) + 10}
            y={toY(iss.lat) - 8}
            fill="#73daca"
            fontSize={10}
            fontFamily="ui-monospace, SFMono-Regular, monospace"
            fontWeight={700}
            letterSpacing={1}
          >
            {iss.label ?? 'ISS'}
          </text>
        </g>
      )}

      {/* Loading state when land hasn't arrived yet */}
      {!land && (
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          fill="rgba(157,124,216,0.5)"
          fontSize={11}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          loading map…
        </text>
      )}
    </svg>
  );
}
