'use client';

import { useEffect, useState } from 'react';
import { Telescope, Satellite, Zap } from 'lucide-react';
import { Card } from './ui/Card';

const SHOWERS = [
  { name: 'Quadrantids',     peak: [1, 3],   zhr: 120 },
  { name: 'Lyrids',          peak: [4, 22],  zhr: 18  },
  { name: 'Eta Aquariids',   peak: [5, 6],   zhr: 50  },
  { name: 'Delta Aquariids', peak: [7, 30],  zhr: 20  },
  { name: 'Perseids',        peak: [8, 12],  zhr: 100 },
  { name: 'Orionids',        peak: [10, 21], zhr: 20  },
  { name: 'Leonids',         peak: [11, 17], zhr: 15  },
  { name: 'Geminids',        peak: [12, 14], zhr: 150 },
  { name: 'Ursids',          peak: [12, 22], zhr: 10  },
];

function nextShowers() {
  const now = new Date();
  const yr = now.getFullYear();
  return SHOWERS
    .map(s => {
      const peak = new Date(yr, s.peak[0] - 1, s.peak[1]);
      if (peak < now) peak.setFullYear(yr + 1);
      return { ...s, peak, daysAway: (peak.getTime() - now.getTime()) / 86400000 };
    })
    .sort((a, b) => a.daysAway - b.daysAway)
    .slice(0, 3);
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (lat2 - lat1) * toR, dLon = (lon2 - lon1) * toR;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*toR)*Math.cos(lat2*toR)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

type IssData = { lat: number; lon: number; altitude: number | null; velocity: number | null };

export function SpaceCard({ lat, lon }: { lat: number; lon: number }) {
  const [iss, setIss] = useState<IssData | null>(null);
  const [issErr, setIssErr] = useState(false);
  const showers = nextShowers();

  useEffect(() => {
    let alive = true;
    async function fetchIss() {
      try {
        const r = await fetch('/api/iss');
        if (!r.ok) throw new Error();
        const j = await r.json();
        if (!alive) return;
        if (j.error) { setIssErr(true); return; }
        setIss(j);
        setIssErr(false);
      } catch {
        if (alive) setIssErr(true);
      }
    }
    fetchIss();
    const id = setInterval(fetchIss, 10_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const dist = iss ? haversine(lat, lon, iss.lat, iss.lon) : null;

  return (
    <Card id="space" title="Space" subtitle="ISS & meteor showers" icon={<Telescope size={18} />}>
      <div className="space-section">
        <div className="space-section__head">
          <Satellite size={14} className="space-icon" />
          <span>ISS right now</span>
          {iss && <span className="space-live-dot" title="Live" />}
        </div>
        {issErr ? (
          <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Unavailable right now</span>
        ) : !iss ? (
          <div className="skeleton-line" style={{ height: 18, width: 160 }} />
        ) : (
          <div className="space-iss">
            <span className="space-iss__coord">{iss.lat.toFixed(2)}°, {iss.lon.toFixed(2)}°</span>
            <div className="space-iss__meta">
              {dist != null && (
                <span className="space-iss__dist">
                  {dist < 1000 ? `${Math.round(dist)} km from you` : `${(dist/1000).toFixed(1)}k km away`}
                </span>
              )}
              {iss.altitude != null && (
                <span className="space-iss__alt">↑ {Math.round(iss.altitude)} km</span>
              )}
              {iss.velocity != null && (
                <span className="space-iss__vel">{Math.round(iss.velocity).toLocaleString()} km/h</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-section" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--border-soft)' }}>
        <div className="space-section__head">
          <Zap size={14} className="space-icon" />
          <span>Next meteor showers</span>
        </div>
        <div className="space-showers">
          {showers.map(s => (
            <div key={s.name} className="space-shower">
              <div className="space-shower__name">{s.name}</div>
              <div className="space-shower__meta">
                Peak {s.peak.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                {' · '}{Math.round(s.daysAway)}d away
                {' · '}<span style={{ color: 'var(--accent)' }}>~{s.zhr}/hr</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
