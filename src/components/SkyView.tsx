'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as Astro from 'astronomy-engine';
import type { Map as MLMap, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card, Icon, hhmm, localParts } from './ui';
import { Ring } from './charts';
import { useTheme } from '@/lib/theme';
import { moonPhase } from '@/lib/astro';
import { loadMapLibre } from './map/maplibre';
import { buildStyle, readPalette } from './map/style';

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

/** Moon disc with the terminator drawn from the phase (flipped for the southern hemisphere). */
function MoonDisc({ age, size = 88, south = false }: { age: number; size?: number; south?: boolean }) {
  const p = (((age / 29.53) % 1) + 1) % 1, r = size / 2 - 2, cx = size / 2, cy = size / 2;
  const waxing = p < 0.5, c = Math.cos(2 * Math.PI * p), rx = Math.abs(c) * r;
  const inner = waxing ? (c > 0 ? 0 : 1) : (c < 0 ? 0 : 1);
  const lit = `M${cx},${cy - r} A${r},${r} 0 0 ${waxing ? 1 : 0} ${cx},${cy + r} A${rx},${r} 0 0 ${inner} ${cx},${cy - r} Z`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: south ? 'scaleX(-1)' : undefined, flex: 'none' }} aria-hidden>
      <defs><radialGradient id="moonlit" cx=".4" cy=".35" r=".7"><stop offset="0" stopColor="#fbf6e6" /><stop offset="1" stopColor="#d9d0b8" /></radialGradient></defs>
      <circle cx={cx} cy={cy} r={r} fill="color-mix(in srgb, var(--md-on-surface) 12%, var(--md-surface-container-highest))" />
      <path d={lit} fill="url(#moonlit)" />
      {[[.38, .4, .09], [.6, .58, .07], [.45, .68, .05], [.62, .3, .04]].map(([x, y, k], i) => <circle key={i} cx={x * size} cy={y * size} r={k * size} fill="#000" opacity=".07" />)}
    </svg>
  );
}

/** "HH:MM" wall-clock from an Open-Meteo local ISO string, shifted by `min` minutes. */
const wall = (iso: string, min = 0) => {
  const { h, mi } = localParts(iso);
  const t = (((h * 60 + mi + min) % 1440) + 1440) % 1440;
  const H = Math.floor(t / 60), M = t % 60;
  return `${H % 12 || 12}:${String(M).padStart(2, '0')} ${H < 12 ? 'AM' : 'PM'}`;
};

function IssMap({ lat, lon, className = 's12' }: { lat: number; lon: number; className?: string }) {
  const el = useRef<HTMLDivElement>(null);
  const m = useRef<MLMap | null>(null);
  const mk = useRef<any>(null);
  const trail = useRef<[number, number][]>([]);
  const { dark, seed } = useTheme();
  const [iss, setIss] = useState<any>(null);
  const [err, setErr] = useState(false);
  const [ver, setVer] = useState(0);

  useEffect(() => {
    let alive = true;
    const tick = () => fetch('/api/iss').then(r => r.json()).then(j => { if (!alive) return; if (j.error) setErr(true); else { setErr(false); setIss(j); } }).catch(() => alive && setErr(true));
    tick(); const id = setInterval(tick, 10_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    let dead = false;
    loadMapLibre().then(ml => {
      if (dead || !el.current) return;
      const map = new ml.Map({ container: el.current, style: buildStyle({ dark, satellite: false, p: readPalette() }), center: [lon, 20], zoom: Math.max(0, Math.log2(el.current.clientWidth / 512)), minZoom: 0, maxZoom: 5, attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false });
      map.touchZoomRotate.disableRotation();
      const me = document.createElement('div'); me.className = 'me-dot';
      new ml.Marker({ element: me }).setLngLat([lon, lat]).addTo(map);
      const sat = document.createElement('div');
      sat.innerHTML = '<span class="ms fill" style="font-size:30px;color:var(--md-tertiary);filter:drop-shadow(0 1px 3px #0009)">satellite_alt</span>';
      mk.current = new ml.Marker({ element: sat });
      map.on('style.load', () => {
        map.addSource('trail', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } });
        map.addLayer({ id: 'trail', type: 'line', source: 'trail', paint: { 'line-color': readPalette().primary, 'line-width': 2.5, 'line-dasharray': [1, 2] } });
        setVer(v => v + 1);
      });
      m.current = map;
    });
    return () => { dead = true; m.current?.remove(); m.current = null; };
  }, [dark, seed, lat, lon]);

  useEffect(() => {
    const map = m.current;
    if (!iss || !map) return;
    const last = trail.current[trail.current.length - 1];
    // start a fresh trail across the antimeridian so the line doesn't streak across the map
    if (last && Math.abs(last[0] - iss.lon) > 180) trail.current = [];
    trail.current = [...trail.current.slice(-40), [iss.lon, iss.lat]];
    mk.current?.setLngLat([iss.lon, iss.lat]).addTo(map);
    (map.getSource('trail') as GeoJSONSource | undefined)?.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: trail.current }, properties: {} });
  }, [iss, ver]);

  const dist = iss ? km([lat, lon], [iss.lat, iss.lon]) : null;
  return (
    <Card title="International Space Station" icon="satellite_alt" shape="burst" sub="Live · updates every 10 s" className={className}>
      <div className="mini-map"><div ref={el} style={{ position: 'absolute', inset: 0 }} /></div>
      {err && !iss && <p className="body-m muted">ISS position unavailable right now.</p>}
      {iss && (
        <div className="tiles" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
          <div className="tile"><span className="k"><Icon name="straighten" />Distance</span><span className="v tnum">{Math.round(dist!).toLocaleString()}<small>km</small></span></div>
          {iss.altitude && <div className="tile"><span className="k"><Icon name="height" />Altitude</span><span className="v tnum">{Math.round(iss.altitude)}<small>km</small></span></div>}
          {iss.velocity && <div className="tile"><span className="k"><Icon name="speed" />Speed</span><span className="v tnum">{Math.round(iss.velocity).toLocaleString()}<small>km/h</small></span></div>}
          <div className="tile"><span className="k"><Icon name="visibility" />Overhead?</span><span className="v">{dist! < 2200 ? 'Maybe!' : 'Not now'}</span></div>
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

  const showers = SHOWERS.map(s => {
    let t = new Date(now.getFullYear(), s.m - 1, s.d);
    if (t.getTime() < now.getTime() - 3 * 86400_000) t = new Date(now.getFullYear() + 1, s.m - 1, s.d);
    return { ...s, t, days: Math.round((t.getTime() - now.getTime()) / 86400_000) };
  }).sort((a, b) => a.t.getTime() - b.t.getTime()).slice(0, 3);

  return (
    <div className="bento">
      <Card title="Stargazing tonight" icon="stars" shape="sunny" tone="primary" className="s4">
        <div className="row" style={{ gap: 20 }}>
          <Ring value={stars} size={112} stroke={12} color="var(--md-on-primary-container)" track="color-mix(in srgb, var(--md-on-primary-container) 14%, transparent)">
            <div style={{ textAlign: 'center' }}><div className="headline-m tnum" style={{ fontWeight: 600 }}>{stars}</div><div className="label-s" style={{ opacity: .7 }}>/ 100</div></div>
          </Ring>
          <div>
            <div className="headline-s expressive">{stars >= 75 ? 'Excellent' : stars >= 50 ? 'Decent' : stars >= 25 ? 'Poor' : 'Not tonight'}</div>
            <p className="body-m" style={{ opacity: .85 }}>{cloud}% cloud · {moon.illumination}% moon{!dark ? ' · not fully dark yet' : ''}</p>
          </div>
        </div>
        <p className="body-m card-foot" style={{ opacity: .85 }}>{stars >= 50 ? 'Find a dark spot away from streetlights and give your eyes 20 minutes.' : cloud > 60 ? 'Clouds are in the way. Try again another night.' : 'The moon will wash out the faint stuff. Planets are still fair game.'}</p>
      </Card>

      <Card title="Moon" icon="bedtime" shape="cookie12" sub={moon.name} className="s4">
        <div className="row" style={{ gap: 18 }}>
          <MoonDisc age={moon.age} size={92} south={lat < 0} />
          <div><div className="display-s tnum" style={{ fontWeight: 500 }}>{moon.illumination}%</div><div className="body-s muted">illuminated · day {moon.age.toFixed(0)} of 29.5</div></div>
        </div>
        <div className="tiles card-foot">
          <div className="tile"><span className="k"><Icon name="north_east" />Moonrise</span><span className="v tnum" style={{ fontSize: 20 }}>{fmt(sky.moonRise)}</span></div>
          <div className="tile"><span className="k"><Icon name="south_east" />Moonset</span><span className="v tnum" style={{ fontSize: 20 }}>{fmt(sky.moonSet)}</span></div>
          <div className="tile"><span className="k"><Icon name="brightness_1" fill />Next full</span><span className="v" style={{ fontSize: 20 }}>{sky.nextFull?.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span></div>
          <div className="tile"><span className="k"><Icon name="radio_button_unchecked" />Next new</span><span className="v" style={{ fontSize: 20 }}>{sky.nextNew?.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span></div>
        </div>
      </Card>

      <Card title="Planets" icon="public" shape="clover" sub="Position right now" className="s4 m12">
        <div>
          {sky.planets.map(p => {
            const up = p.alt > 0;
            const visible = up && sky.sunAlt < -3;
            return (
              <div key={p.name} className="list-row">
                <span className="dot" style={{ width: 10, height: 10, background: visible ? 'var(--md-primary)' : 'var(--md-outline)' }} />
                <div className="grow"><div className="title-s">{p.name}</div><div className="label-m muted">{up ? `${Math.round(p.alt)}° up · ${['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(p.az / 45) % 8]}` : `rises ${fmt(p.rise)}`}</div></div>
                <span className={`pill ${visible ? 'good' : ''}`}>{visible ? 'Visible' : up ? 'Daylight' : 'Below horizon'}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Light" icon="photo_camera" shape="flower" sub="Photography windows today" className="s6">
        {d?.sunrise ? (
          <div>
            <div className="list-row"><Icon name="wb_twilight" style={{ color: 'var(--md-tertiary)' }} /><div className="grow"><div className="title-s">Golden hour</div><div className="body-s muted">{wall(d.sunrise[0])}–{wall(d.sunrise[0], 60)} · {wall(d.sunset[0], -60)}–{wall(d.sunset[0])}</div></div></div>
            <div className="list-row"><Icon name="nights_stay" style={{ color: 'var(--md-secondary)' }} /><div className="grow"><div className="title-s">Blue hour</div><div className="body-s muted">{wall(d.sunrise[0], -30)}–{wall(d.sunrise[0], -10)} · {wall(d.sunset[0], 10)}–{wall(d.sunset[0], 30)}</div></div></div>
            <div className="list-row"><Icon name="wb_sunny" style={{ color: 'var(--md-primary)' }} /><div className="grow"><div className="title-s">Sunrise · Sunset</div><div className="body-s muted">{hhmm(d.sunrise[0])} · {hhmm(d.sunset[0])}</div></div></div>
          </div>
        ) : <p className="body-m muted">Loading…</p>}
      </Card>

      <Card title="Meteor showers" icon="shooting_star" shape="burst" sub="Next peaks" className="s6">
        <div>
          {showers.map(s => (
            <div key={s.n} className="list-row">
              <div className="grow"><div className="title-s">{s.n}</div><div className="label-m muted">{s.t.toLocaleDateString([], { month: 'short', day: 'numeric' })} · up to {s.zhr}/hr</div></div>
              <span className={`pill ${Math.abs(s.days) <= 3 ? 'good' : ''}`}>{Math.abs(s.days) <= 1 ? 'Peak now' : s.days < 0 ? 'Fading' : `in ${s.days}d`}</span>
            </div>
          ))}
        </div>
      </Card>

      <IssMap lat={lat} lon={lon} />
    </div>
  );
}
