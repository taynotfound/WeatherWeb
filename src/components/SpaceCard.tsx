'use client';

import { useEffect, useState } from 'react';
import { Telescope, Satellite, Zap } from 'lucide-react';
import { Card } from './ui/Card';

// Meteor showers — fixed astronomical calendar (approximate peak dates, UTC)
const SHOWERS = [
  { name: 'Quadrantids',    peak: [1, 3],  zhr: 120 },
  { name: 'Lyrids',         peak: [4, 22], zhr: 18  },
  { name: 'Eta Aquariids',  peak: [5, 6],  zhr: 50  },
  { name: 'Delta Aquariids',peak: [7, 30], zhr: 20  },
  { name: 'Perseids',       peak: [8, 12], zhr: 100 },
  { name: 'Orionids',       peak: [10,21], zhr: 20  },
  { name: 'Leonids',        peak: [11,17], zhr: 15  },
  { name: 'Geminids',       peak: [12,14], zhr: 150 },
  { name: 'Ursids',         peak: [12,22], zhr: 10  },
];

function nextShower() {
  const now = new Date();
  const year = now.getFullYear();
  const scored = SHOWERS.map(s => {
    const peak = new Date(year, s.peak[0] - 1, s.peak[1]);
    if (peak < now) peak.setFullYear(year + 1);
    const daysAway = (peak.getTime() - now.getTime()) / 86400000;
    return { ...s, peak, daysAway };
  }).sort((a, b) => a.daysAway - b.daysAway);
  return scored.slice(0, 3);
}

type IssPass = { date: string; duration: number; maxEl: number };

export function SpaceCard({ lat, lon }: { lat: number; lon: number }) {
  const [issPasses, setIssPasses] = useState<IssPass[] | null>(null);
  const [issPos, setIssPos] = useState<{ lat: number; lon: number } | null>(null);
  const showers = nextShower();

  useEffect(() => {
    // ISS current position — open-notify.org
    fetch('https://api.open-notify.org/iss-now.json')
      .then(r => r.json())
      .then(j => {
        if (j?.iss_position) {
          setIssPos({ lat: parseFloat(j.iss_position.latitude), lon: parseFloat(j.iss_position.longitude) });
        }
      }).catch(() => {});

    // ISS passes — wheretheiss.at API (open, no auth)
    const url = `https://api.wheretheiss.at/v1/satellites/25544/positions?timestamps=${
      Array.from({ length: 5 }, (_, i) => Math.floor(Date.now() / 1000) + i * 5400).join(',')
    }&units=degrees`;

    // Fallback: just show distance to ISS from user location
    setIssPasses(null); // we'll just use realtime position
  }, [lat, lon]);

  const issDistKm = issPos ? haversine(lat, lon, issPos.lat, issPos.lon) : null;

  return (
    <Card id="space" title="Space" subtitle="ISS & meteor showers" icon={<Telescope size={18} />}>
      {/* ISS */}
      <div className="space-section">
        <div className="space-section__head">
          <Satellite size={14} className="space-icon" />
          <span>ISS right now</span>
        </div>
        {issPos ? (
          <div className="space-iss">
            <span className="space-iss__coord">{issPos.lat.toFixed(2)}°, {issPos.lon.toFixed(2)}°</span>
            {issDistKm != null && (
              <span className="space-iss__dist">{issDistKm < 1000 ? `${Math.round(issDistKm)} km away` : `${(issDistKm / 1000).toFixed(1)}k km away`}</span>
            )}
          </div>
        ) : (
          <div className="skeleton-line" style={{ height: 18, width: 140 }} />
        )}
      </div>

      {/* Meteor showers */}
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

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
