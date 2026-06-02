'use client';

import { Sunrise, Sunset, Camera, Moon } from 'lucide-react';
import { goldenHour, moonPhase, fmtTime } from '@/lib/astro';

function fmt(s: string) {
  const d = new Date(s);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function SunCard({ weather }: { weather: any }) {
  const sr = weather?.daily?.sunrise?.[0];
  const ss = weather?.daily?.sunset?.[0];
  if (!sr || !ss) return null;

  const now = Date.now();
  const start = new Date(sr).getTime();
  const end = new Date(ss).getTime();
  const pct = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));

  const gh = goldenHour(sr, ss);
  const moon = moonPhase(new Date());

  // Day length
  const lenMin = Math.max(0, Math.round((end - start) / 60000));
  const hours = Math.floor(lenMin / 60);
  const mins = lenMin % 60;

  return (
    <section className="card">
      <div className="card-head"><h2>Sun &amp; Moon</h2></div>
      <div className="sun-row">
        <div className="sun-item">
          <Sunrise size={18} />
          <div><span className="label">Sunrise</span><span className="val">{fmt(sr)}</span></div>
        </div>
        <div className="sun-item">
          <Sunset size={18} />
          <div><span className="label">Sunset</span><span className="val">{fmt(ss)}</span></div>
        </div>
      </div>
      <div className="daily-bar" style={{ marginTop: 14, height: 3 }}>
        <span style={{ left: 0, width: `${pct}%` }} />
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--ink-mute)', textAlign: 'right' }}>
        Daylight: {hours}h {mins}m
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14, paddingTop: 12, borderTop: '1px dashed var(--border-soft)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Camera size={16} style={{ color: 'var(--accent)', marginTop: 2 }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Golden hour</span>
            <span style={{ fontSize: 13, color: 'var(--ink)' }}>{fmtTime(gh.morningStart)} – {fmtTime(gh.morningEnd)}</span>
            <span style={{ fontSize: 13, color: 'var(--ink)' }}>{fmtTime(gh.eveningStart)} – {fmtTime(gh.eveningEnd)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Moon size={16} style={{ color: 'var(--primary)', marginTop: 2 }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Moon</span>
            <span style={{ fontSize: 15, color: 'var(--ink)' }}>{moon.glyph} {moon.name}</span>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{moon.illumination}% illuminated</span>
          </div>
        </div>
      </div>
    </section>
  );
}
