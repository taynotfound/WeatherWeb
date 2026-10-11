'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Icon } from './ui';
import { useTheme } from '@/lib/theme';
import { usePrefs } from '@/lib/prefs';

type Layer = 'radar' | 'satellite' | 'temp' | 'wind' | 'clouds';
const LAYERS: { id: Layer; label: string; icon: string }[] = [
  { id: 'radar', label: 'Radar', icon: 'radar' },
  { id: 'satellite', label: 'Satellite', icon: 'satellite_alt' },
  { id: 'temp', label: 'Temperature', icon: 'thermostat' },
  { id: 'wind', label: 'Wind', icon: 'air' },
  { id: 'clouds', label: 'Clouds', icon: 'cloud' },
];
type Frame = { time: number; path: string; fc: boolean };

export default function RadarMap({ lat, lon }: { lat: number; lon: number }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const L = useRef<any>(null);
  const base = useRef<any>(null);
  const overlay = useRef<any>(null);
  const gridLayer = useRef<any>(null);
  const marker = useRef<any>(null);
  const { dark } = useTheme();
  const { t, spd } = usePrefs();
  const [layer, setLayer] = useState<Layer>('radar');
  const [radar, setRadar] = useState<any>(null);
  const [i, setI] = useState(0);
  const [play, setPlay] = useState(true);
  const [ready, setReady] = useState(false);
  const [grid, setGrid] = useState<any[]>([]);
  const gridKey = useRef(0);

  useEffect(() => {
    fetch(`/api/rain?lat=${lat}&lon=${lon}`).then(r => r.json()).then(j => setRadar(j.radar)).catch(() => {});
  }, [lat, lon]);

  const frames: Frame[] = !radar ? [] : layer === 'satellite'
    ? radar.satellite.map((f: any) => ({ ...f, fc: false }))
    : [...radar.past.map((f: any) => ({ ...f, fc: false })), ...radar.nowcast.map((f: any) => ({ ...f, fc: true }))];

  // map init
  useEffect(() => {
    let dead = false;
    (async () => {
      const Lf = (await import('leaflet')).default;
      if (dead || !el.current || map.current) return;
      L.current = Lf;
      const m = Lf.map(el.current, { zoomControl: false, minZoom: 3, maxZoom: 10, attributionControl: true }).setView([lat, lon], 7);
      Lf.control.zoom({ position: 'topright' }).addTo(m);
      m.attributionControl.setPrefix(false);
      marker.current = Lf.marker([lat, lon], { icon: Lf.divIcon({ className: '', html: '<div class="tm-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }) }).addTo(m);
      map.current = m;
      setReady(true);
      setTimeout(() => m.invalidateSize(), 60);
    })();
    return () => { dead = true; map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (map.current) { map.current.setView([lat, lon], map.current.getZoom()); marker.current?.setLatLng([lat, lon]); } }, [lat, lon]);

  // basemap follows theme (Esri gray canvas: keyless, with a reference layer for place names)
  useEffect(() => {
    if (!ready) return;
    base.current?.remove();
    const k = dark ? 'Dark' : 'Light';
    const u = (n: string) => `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${k}_Gray_${n}/MapServer/tile/{z}/{y}/{x}`;
    const g = L.current.layerGroup([
      L.current.tileLayer(u('Base'), { maxNativeZoom: 16, maxZoom: 10, zIndex: 1, attribution: 'Tiles © Esri · radar © RainViewer · data © Open-Meteo' }),
      L.current.tileLayer(u('Reference'), { maxNativeZoom: 16, maxZoom: 10, zIndex: 20 }),
    ]).addTo(map.current);
    base.current = g;
  }, [ready, dark]);

  // reset frame on layer change
  useEffect(() => { setI(layer === 'radar' && radar ? Math.max(0, radar.past.length - 1) : Math.max(0, frames.length - 1)); setPlay(layer === 'radar' || layer === 'satellite'); /* eslint-disable-next-line */ }, [layer, radar]);

  useEffect(() => {
    if (!play || !frames.length) return;
    const id = setInterval(() => setI(x => (x + 1) % frames.length), 800);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play, frames.length]);

  // raster overlay
  useEffect(() => {
    if (!ready) return;
    overlay.current?.remove(); overlay.current = null;
    if ((layer === 'radar' || layer === 'satellite') && frames[i] && radar) {
      const tpl = (layer === 'radar' ? radar.tileTemplate : radar.satTemplate).replace('{path}', frames[i].path);
      overlay.current = L.current.tileLayer(tpl, { opacity: layer === 'radar' ? .8 : .7, maxNativeZoom: 7, maxZoom: 10, zIndex: 5 }).addTo(map.current);
    }
  }, [ready, layer, i, radar]); // eslint-disable-line react-hooks/exhaustive-deps

  // sampled-grid layers
  useEffect(() => {
    if (!ready) return;
    const m = map.current;
    const load = () => {
      if (layer !== 'temp' && layer !== 'wind' && layer !== 'clouds') return;
      const b = m.getBounds(); const k = ++gridKey.current;
      fetch(`/api/grid?south=${b.getSouth()}&west=${b.getWest()}&north=${b.getNorth()}&east=${b.getEast()}`)
        .then(r => r.json()).then(j => k === gridKey.current && setGrid(j.points ?? [])).catch(() => {});
    };
    setGrid([]); load();
    m.on('moveend', load);
    return () => { m.off('moveend', load); };
  }, [ready, layer]);

  useEffect(() => {
    if (!ready) return;
    gridLayer.current?.remove();
    if (!grid.length || !(layer === 'temp' || layer === 'wind' || layer === 'clouds')) return;
    const g = L.current.layerGroup();
    for (const p of grid) {
      if (p.temp == null) continue;
      let html = '';
      if (layer === 'temp') html = `<div class="grid-label" style="background:${tempColor(p.temp)};color:#111">${t(p.temp)}</div>`;
      else if (layer === 'clouds') html = `<div class="grid-label">${Math.round(p.cloud)}%</div>`;
      else html = `<div class="wind-arrow"><span style="display:inline-block;transform:rotate(${(p.dir ?? 0) + 180}deg)">↑</span><span>${spd(p.wind)}</span></div>`;
      L.current.marker([p.lat, p.lon], { interactive: false, icon: L.current.divIcon({ className: '', html, iconSize: [0, 0] }) }).addTo(g);
    }
    g.addTo(map.current); gridLayer.current = g;
  }, [grid, layer, ready, t, spd]);

  const f = frames[i];
  const rel = f ? Math.round((f.time - Date.now()) / 60000) : 0;
  const hasTimeline = (layer === 'radar' || layer === 'satellite') && frames.length > 0;
  return (
    <div className="map-wrap">
      <div ref={el} style={{ position: 'absolute', inset: 0 }} />
      <div className="map-ui map-top">
        {LAYERS.map(l => (
          <button key={l.id} className={`chip state ${layer === l.id ? 'selected' : ''}`} onClick={() => setLayer(l.id)}><Icon name={l.icon} />{l.label}</button>
        ))}
      </div>
      {hasTimeline && (
        <div className="map-ui map-bottom">
          <button className="icon-btn filled" onClick={() => setPlay(p => !p)} aria-label={play ? 'Pause' : 'Play'}><Icon name={play ? 'pause' : 'play_arrow'} fill /></button>
          <input type="range" min={0} max={frames.length - 1} value={i} onChange={e => { setPlay(false); setI(+e.target.value); }} aria-label="Time" />
          <span className="label-l tnum" style={{ minWidth: 92, textAlign: 'right' }}>
            {f ? new Date(f.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}{f?.fc ? ' · fcst' : rel >= -2 ? ' · now' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

function tempColor(c: number) {
  const stops: [number, [number, number, number]][] = [[-20, [155, 140, 255]], [-5, [120, 190, 255]], [5, [140, 225, 220]], [15, [170, 230, 140]], [25, [255, 220, 110]], [32, [255, 150, 90]], [40, [240, 90, 90]]];
  let a = stops[0], b = stops[stops.length - 1];
  for (let k = 0; k < stops.length - 1; k++) if (c >= stops[k][0] && c <= stops[k + 1][0]) { a = stops[k]; b = stops[k + 1]; break; }
  const f = Math.max(0, Math.min(1, (c - a[0]) / (b[0] - a[0] || 1)));
  const rgb = a[1].map((v, j) => Math.round(v + (b[1][j] - v) * f));
  return `rgb(${rgb.join(',')})`;
}
