'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as Astro from 'astronomy-engine';
import 'leaflet/dist/leaflet.css';
import { Card, Icon, hhmm } from './ui';
import { Ring } from './charts';
import { useTheme } from '@/lib/theme';
import { moonPhase, goldenHour, blueHour, fmtTime } from '@/lib/astro';

const fmt = (d: Date | null | undefined) => (d ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '–');
const rad = (d: number) => (d * Math.PI) / 180;
const km = (a: [number, number], b: [number, number]) => {
  const dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

const SHOWERS = [
  { n: 'Quadrantids', m: 1, d: 3, zhr: 110 }, { n: 'Lyrids', m: 4, d: 22, zhr: 18 }, { n: 'Eta Aquariids', m: 5, d: 6, zhr: 50 },
  { n: 'Perseids', m: 8, d: 12, zhr: 100 }, { n: 'Orionids', m: 10, d: 21, zhr: 20 }, { n: 'Leonids', m: 11, d: 17, zhr: 15 },
  { n: 'Geminids', m: 12, d: 14, zhr: 150 }, { n: 'Ursids', m: 12, d: 22, zhr: 10 },
];

function IssMap({ lat, lon }: { lat: number; lon: number }) {
  const el = useRef<HTMLDivElement>(null);
  const m = useRef<any>(null);
  const mk = useRef<any>(null);
  const trail = useRef<[number, number][]>([]);
  const line = useRef<any>(null);
  const { dark } = useTheme();
  const [iss, setIss] = useState<any>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    const tick = () => fetch('/api/iss').then(r => r.json()).then(j => { if (!alive) return; if (j.error) setErr(true); else { setErr(false); setIss(j); } }).catch(() => alive && setErr(true));
    tick(); const id = setInterval(tick, 10_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    let dead = false; let tiles: any;
    (async () => {
      const L = (await import('leaflet')).default;
      if (dead || !el.current) return;
      const map = L.map(el.current, { zoomControl: false, attributionControl: false, worldCopyJump: true, minZoom: 1 }).setView([20, 0], 1);
      tiles = L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${dark ? 'Dark' : 'Light'}_Gray_Base/MapServer/tile/{z}/{y}/{x}`, { maxNativeZoom: 16, maxZoom: 6 }).addTo(map);
      L.marker([lat, lon], { icon: L.divIcon({ className: '', html: '<div class="tm-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }) }).addTo(map);
      mk.current = L.marker([0, 0], { icon: L.divIcon({ className: '', html: '<span class="ms fill" style="font-size:32px;color:var(--md-tertiary);filter:drop-shadow(0 1px 3px #0008)">satellite_alt</span>', iconSize: [32, 32], iconAnchor: [16, 16] }) });
      line.current = L.polyline([], { color: 'var(--md-tertiary)', weight: 2, dashArray: '4 6' }).addTo(map);
      m.current = map;
      setTimeout(() => map.invalidateSize(), 60);
    })();
    return () => { dead = true; m.current?.remove(); m.current = null; };
  }, [dark, lat, lon]);

  useEffect(() => {
    if (!iss || !m.current) return;
    const p: [number, number] = [iss.lat, iss.lon];
    trail.current = [...trail.current.slice(-30), p];
    mk.current.setLatLng(p).addTo(m.current);
    line.current.setLatLngs(trail.current);
  }, [iss, dark]);

  const dist = iss ? km([lat, lon], [iss.lat, iss.lon]) : null;
  return (
    <Card title="International Space Station" icon="satellite_alt" sub="Live · updates every 10 s" className="span-all">
      <div style={{ position: 'relative', height: 260, borderRadius: 'var(--r-lg)', overflow: 'hidden', background: 'var(--md-surface-container-high)' }}>
        <div ref={el} style={{ position: 'absolute', inset: 0 }} />
      </div>
      {err && !iss && <p className="body-m muted">ISS position unavailable right now.</p>}
      {iss && (
        <div className="chips">
          <span className="chip tonal"><Icon name="straighten" />{Math.round(dist!).toLocaleString()} km from you</span>
          {iss.altitude && <span className="chip tonal"><Icon name="height" />{Math.round(iss.altitude)} km up</span>}
          {iss.velocity && <span className="chip tonal"><Icon name="speed" />{Math.round(iss.velocity).toLocaleString()} km/h</span>}
          {dist! < 2200 && <span className="chip selected"><Icon name="visibility" />Possibly visible overhead</span>}
        </div>
      )}
    </Card>
  );
}

export function SkyView({ lat, lon, weather }: { lat: number; lon: number; weather: any }) {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(id); }, []);
  const d = weather?.daily;

  const sky = useMemo(() => {
    const obs = new Astro.Observer(lat, lon, 0);
    const sunEq = Astro.Equator(Astro.Body.Sun, now, obs, true, true);
    const sunAlt = Astro.Horizon(now, obs, sunEq.ra, sunEq.dec, 'normal').altitude;
    const planets = (['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'] as const).map(name => {
      const body = Astro.Body[name];
      const eq = Astro.Equator(body, now, obs, true, true);
      const hor = Astro.Horizon(now, obs, eq.ra, eq.dec, 'normal');
      const rise = Astro.SearchRiseSet(body, obs, +1, now, 1)?.date ?? null;
      const set = Astro.SearchRiseSet(body, obs, -1, now, 1)?.date ?? null;
      return { name, alt: hor.altitude, az: hor.azimuth, rise, set, mag: Astro.Illumination(body, now).mag };
    });
    const moonRise = Astro.SearchRiseSet(Astro.Body.Moon, obs, +1, now, 1)?.date ?? null;
    const moonSet = Astro.SearchRiseSet(Astro.Body.Moon, obs, -1, now, 1)?.date ?? null;
    const nextFull = Astro.SearchMoonPhase(180, now, 40)?.date ?? null;
    const nextNew = Astro.SearchMoonPhase(0, now, 40)?.date ?? null;
    return { sunAlt, planets, moonRise, moonSet, nextFull, nextNew };
  }, [lat, lon, now]);

  const moon = moonPhase(now);
  const cloud = weather?.current?.cloudCover ?? 50;
  const vis = weather?.current?.visibilityKm ?? 10;
  const stars = Math.max(0, Math.min(100, Math.round(100 - cloud * 0.85 - moon.illumination * 0.25 - (vis < 8 ? (8 - vis) * 4 : 0))));
  const dark = sky.sunAlt < -12;
  const gold = d?.sunrise ? goldenHour(d.sunrise[0], d.sunset[0]) : null;
  const blue = d?.sunrise ? blueHour(d.sunrise[0], d.sunset[0]) : null;

  const showers = SHOWERS.map(s => {
    let t = new Date(now.getFullYear(), s.m - 1, s.d);
    if (t.getTime() < now.getTime() - 3 * 86400_000) t = new Date(now.getFullYear() + 1, s.m - 1, s.d);
    return { ...s, t, days: Math.round((t.getTime() - now.getTime()) / 86400_000) };
  }).sort((a, b) => a.t.getTime() - b.t.getTime()).slice(0, 3);

  return (
    <div className="grid g3">
      <Card title="Stargazing tonight" icon="stars" tone="primary">
        <div className="row" style={{ gap: 20 }}>
          <Ring value={stars} size={104} stroke={11} color="var(--md-primary)">
            <div style={{ textAlign: 'center' }}><div className="headline-s tnum">{stars}</div><div className="label-s">/ 100</div></div>
          </Ring>
          <div>
            <div className="title-l">{stars >= 75 ? 'Excellent' : stars >= 50 ? 'Decent' : stars >= 25 ? 'Poor' : 'Not tonight'}</div>
            <p className="body-m" style={{ opacity: .85 }}>{cloud}% cloud · {moon.illumination}% moon{!dark ? ' · not fully dark yet' : ''}</p>
          </div>
        </div>
      </Card>

      <Card title="Moon" icon="bedtime" sub={moon.name}>
        <div className="row" style={{ gap: 16 }}>
          <span style={{ fontSize: 64, lineHeight: 1 }}>{moon.glyph}</span>
          <div><div className="headline-m tnum">{moon.illumination}%</div><div className="body-s muted">illuminated · day {moon.age.toFixed(0)} of 29.5</div></div>
        </div>
        <div className="stat-grid">
          <div className="stat"><span className="label-m muted">Moonrise</span><span className="title-m tnum">{fmt(sky.moonRise)}</span></div>
          <div className="stat"><span className="label-m muted">Moonset</span><span className="title-m tnum">{fmt(sky.moonSet)}</span></div>
          <div className="stat"><span className="label-m muted">Next full</span><span className="title-m">{sky.nextFull?.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span></div>
          <div className="stat"><span className="label-m muted">Next new</span><span className="title-m">{sky.nextNew?.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span></div>
        </div>
      </Card>

      <Card title="Planets" icon="public" sub="Position right now">
        {sky.planets.map(p => {
          const up = p.alt > 0;
          const visible = up && sky.sunAlt < -3;
          return (
            <div key={p.name} className="row" style={{ minHeight: 44 }}>
              <span className="dot" style={{ background: visible ? 'var(--md-primary)' : 'var(--md-outline)', margin: 0 }} />
              <div className="grow"><div className="title-s">{p.name}</div><div className="label-m muted">{up ? `${Math.round(p.alt)}° up · ${['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(p.az / 45) % 8]}` : `rises ${fmt(p.rise)}`}</div></div>
              <span className={`pill ${visible ? 'good' : ''}`}>{visible ? 'Visible' : up ? 'Daylight' : 'Below horizon'}</span>
            </div>
          );
        })}
      </Card>

      <Card title="Light" icon="photo_camera" sub="Photography windows today">
        {gold && blue ? (
          <>
            <div className="row"><Icon name="wb_twilight" style={{ color: 'var(--md-tertiary)' }} /><div className="grow"><div className="title-s">Golden hour</div><div className="body-s muted">{fmtTime(gold.morningStart)}–{fmtTime(gold.morningEnd)} · {fmtTime(gold.eveningStart)}–{fmtTime(gold.eveningEnd)}</div></div></div>
            <div className="row"><Icon name="nights_stay" style={{ color: 'var(--md-secondary)' }} /><div className="grow"><div className="title-s">Blue hour</div><div className="body-s muted">{fmtTime(blue.morningStart)}–{fmtTime(blue.morningEnd)} · {fmtTime(blue.eveningStart)}–{fmtTime(blue.eveningEnd)}</div></div></div>
            <div className="row"><Icon name="wb_sunny" /><div className="grow"><div className="title-s">Sunrise · Sunset</div><div className="body-s muted">{hhmm(d.sunrise[0])} · {hhmm(d.sunset[0])}</div></div></div>
          </>
        ) : <p className="body-m muted">Loading…</p>}
      </Card>

      <Card title="Meteor showers" icon="shooting_star" sub="Next peaks">
        {showers.map(s => (
          <div key={s.n} className="row" style={{ minHeight: 44 }}>
            <div className="grow"><div className="title-s">{s.n}</div><div className="label-m muted">{s.t.toLocaleDateString([], { month: 'short', day: 'numeric' })} · up to {s.zhr}/hr</div></div>
            <span className={`pill ${Math.abs(s.days) <= 3 ? 'good' : ''}`}>{Math.abs(s.days) <= 1 ? 'Peak now' : s.days < 0 ? 'Fading' : `in ${s.days}d`}</span>
          </div>
        ))}
      </Card>

      <IssMap lat={lat} lon={lon} />
    </div>
  );
}
