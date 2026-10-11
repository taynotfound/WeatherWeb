'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Map as MLMap, ImageSource, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Icon } from './ui';
import { useTheme } from '@/lib/theme';
import { usePrefs } from '@/lib/prefs';
import { TEMP_STOPS, WIND_STOPS, ramp } from '@/lib/palette';
import { loadMapLibre } from './map/maplibre';
import { buildStyle, readPalette, SLOT } from './map/style';
import { gridAt, labels, loadField, paint, stepFor, type Field } from './map/field';
import { WindParticles } from './map/wind';

type Layer = 'radar' | 'clouds' | 'temp' | 'wind';
type Base = 'map' | 'satellite';
const LAYERS: { id: Layer; label: string; icon: string }[] = [
  { id: 'radar', label: 'Radar', icon: 'radar' },
  { id: 'clouds', label: 'Clouds', icon: 'cloud' },
  { id: 'temp', label: 'Temp', icon: 'thermostat' },
  { id: 'wind', label: 'Wind', icon: 'air' },
];
const RADAR_RAMP = 'linear-gradient(90deg, #9be9ff, #3fb7f0, #1f6fd1, #2f3fb0, #f7e15a, #f7a33a, #e8442e, #b0123a)';
const CLOUD_RAMP = 'linear-gradient(90deg, rgba(160,180,210,.15), rgba(235,240,250,.6), #fff)';
type Frame = { time: number; fc: boolean };

export default function WeatherMap({ lat, lon }: { lat: number; lon: number }) {
  const el = useRef<HTMLDivElement>(null);
  const windEl = useRef<HTMLCanvasElement>(null);
  const map = useRef<MLMap | null>(null);
  const marker = useRef<any>(null);
  const wind = useRef<WindParticles | null>(null);
  const paintCanvas = useRef<HTMLCanvasElement | null>(null);
  const { dark, seed } = useTheme();
  const { unit, temp } = usePrefs();

  const [layer, setLayer] = useState<Layer>(() => {
    try { const v = localStorage.getItem('tomato-map-layer'); if (v && LAYERS.some(l => l.id === v)) return v as Layer; } catch {}
    return 'radar';
  });
  const [base, setBase] = useState<Base>(() => {
    try { return localStorage.getItem('tomato-map-base') === 'satellite' ? 'satellite' : 'map'; } catch { return 'map'; }
  });
  const [styleVer, setStyleVer] = useState(0);
  const [radar, setRadar] = useState<{ host: string; tpl: string; maxZoom: number; frames: { time: number; path: string; fc: boolean }[] } | null>(null);
  const [sat, setSat] = useState<{ name: string; wms: string; layer: string; frames: number[] } | null>(null);
  const [field, setField] = useState<Field | null>(null);
  const [fieldErr, setFieldErr] = useState(false);
  const [loadingField, setLoadingField] = useState(false);
  const [i, setI] = useState(0);
  const [play, setPlay] = useState(false);

  useEffect(() => { try { localStorage.setItem('tomato-map-layer', layer); } catch {} }, [layer]);
  useEffect(() => { try { localStorage.setItem('tomato-map-base', base); } catch {} }, [base]);

  /* ---------- data ---------- */
  useEffect(() => {
    let alive = true;
    fetch(`/api/rain?lat=${lat}&lon=${lon}`).then(r => r.json()).then(j => {
      if (!alive || !j.radar) return;
      const r = j.radar;
      setRadar({ host: r.host, tpl: r.tileTemplate, maxZoom: r.maxZoom ?? 7, frames: [...r.past.map((f: any) => ({ ...f, fc: false })), ...(r.nowcast ?? []).map((f: any) => ({ ...f, fc: true }))] });
    }).catch(() => {});
    fetch(`/api/sat?lat=${lat}&lon=${lon}`).then(r => r.json()).then(j => alive && !j.error && setSat(j)).catch(() => {});
    return () => { alive = false; };
  }, [lat, lon]);

  const frames: Frame[] = useMemo(() => {
    if (layer === 'radar') return radar?.frames.map(f => ({ time: f.time, fc: f.fc })) ?? [];
    if (layer === 'clouds') return sat?.frames.map(t => ({ time: t, fc: false })) ?? [];
    return field?.times.map(t => ({ time: t, fc: t > Date.now() })) ?? [];
  }, [layer, radar, sat, field]);

  // start at "now" whenever the layer or its frames change
  useEffect(() => {
    if (!frames.length) return;
    if (layer === 'radar' || layer === 'clouds') { const k = frames.findLastIndex(f => !f.fc); setI(k < 0 ? frames.length - 1 : k); }
    else { const k = frames.findIndex(f => f.time >= Date.now() - 30 * 60_000); setI(Math.max(0, k)); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer, frames.length, frames[0]?.time]);

  useEffect(() => { setPlay(false); }, [layer]);
  useEffect(() => {
    if (!play || frames.length < 2) return;
    const id = setInterval(() => setI(x => (x + 1) % frames.length), layer === 'temp' || layer === 'wind' ? 900 : 550);
    return () => clearInterval(id);
  }, [play, frames.length, layer]);

  /* ---------- map lifecycle ---------- */
  useEffect(() => {
    let dead = false;
    loadMapLibre().then(ml => {
      if (dead || !el.current || map.current) return;
      const m = new ml.Map({
        container: el.current, style: buildStyle({ dark, satellite: base === 'satellite', p: readPalette() }),
        center: [lon, lat], zoom: 5.6, minZoom: 1.5, maxZoom: 12, attributionControl: { compact: true },
        dragRotate: false, pitchWithRotate: false, touchPitch: false, maxPitch: 0, fadeDuration: 0,
      });
      m.touchZoomRotate.disableRotation();
      m.keyboard.disableRotation();
      const dot = document.createElement('div'); dot.className = 'me-dot';
      marker.current = new ml.Marker({ element: dot }).setLngLat([lon, lat]).addTo(m);
      m.on('style.load', () => setStyleVer(v => v + 1));
      map.current = m;
      if (windEl.current) wind.current = new WindParticles(windEl.current, m);
    });
    return () => { dead = true; wind.current?.destroy(); wind.current = null; map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // restyle on base / light-dark / sky-colour change (after the theme has written its CSS vars)
  const firstStyle = useRef(true);
  useEffect(() => {
    if (firstStyle.current) { firstStyle.current = false; return; }
    const id = requestAnimationFrame(() => map.current?.setStyle(buildStyle({ dark, satellite: base === 'satellite', p: readPalette() }), { diff: false }));
    return () => cancelAnimationFrame(id);
  }, [base, dark, seed]);

  useEffect(() => {
    const m = map.current; if (!m) return;
    m.easeTo({ center: [lon, lat], duration: 800 });
    marker.current?.setLngLat([lon, lat]);
  }, [lat, lon]);

  /* ---------- raster frame stacks (radar, satellite) ---------- */
  const frameIds = useRef<string[]>([]);
  useEffect(() => {
    const m = map.current;
    if (!m || !styleVer || (layer !== 'radar' && layer !== 'clouds')) return;
    const ids: string[] = [];
    const before = m.getLayer(SLOT) ? SLOT : undefined;
    if (layer === 'radar' && radar) {
      radar.frames.forEach((f, k) => {
        const id = `wx-rv-${k}`;
        const fid = f.path.split('/').pop();
        m.addSource(id, { type: 'raster', tiles: [`${window.location.origin}/api/radar/${fid}/{z}/{x}/{y}.png`], tileSize: 256, maxzoom: radar.maxZoom, attribution: '<a href="https://www.rainviewer.com" target="_blank">RainViewer</a>' });
        m.addLayer({ id, type: 'raster', source: id, layout: { visibility: 'none' }, paint: { 'raster-opacity': 0, 'raster-opacity-transition': { duration: 0 }, 'raster-fade-duration': 0, 'raster-resampling': 'linear' } }, before);
        ids.push(id);
      });
    }
    if (layer === 'clouds' && sat) {
      sat.frames.forEach((t, k) => {
        const id = `wx-sat-${k}`;
        const q = `service=WMS&request=GetMap&version=1.3.0&layers=${sat.layer}&styles=&format=image/png&transparent=true&crs=EPSG:3857&width=256&height=256&time=${new Date(t).toISOString()}&bbox={bbox-epsg-3857}`;
        m.addSource(id, { type: 'raster', tiles: [`cloudir://${sat.wms.replace(/^https:\/\//, '')}?${q}`], tileSize: 256, maxzoom: 7, attribution: '<a href="https://view.eumetsat.int" target="_blank">EUMETSAT</a>' });
        m.addLayer({ id, type: 'raster', source: id, layout: { visibility: 'none' }, paint: { 'raster-opacity': 0, 'raster-opacity-transition': { duration: 0 }, 'raster-fade-duration': 0, 'raster-resampling': 'linear', 'raster-brightness-max': base === 'map' && !dark ? 0.6 : 1 } }, before);
        ids.push(id);
      });
    }
    frameIds.current = ids;
    return () => {
      frameIds.current = [];
      if (!map.current?.style) return;
      for (const id of ids) { if (m.getLayer(id)) m.removeLayer(id); if (m.getSource(id)) m.removeSource(id); }
    };
  }, [layer, radar, sat, styleVer, base, dark]);

  // Frames load lazily: a layer only fetches tiles once it's visible, so we reveal the current frame and
  // pre-warm the next one, then keep them (at opacity 0) so replays are instant.
  useEffect(() => {
    const m = map.current; if (!m) return;
    const n = frameIds.current.length;
    frameIds.current.forEach((id, k) => {
      if (!m.getLayer(id)) return;
      if (k === i || k === (i + 1) % n) m.setLayoutProperty(id, 'visibility', 'visible');
      m.setPaintProperty(id, 'raster-opacity', k === i ? (layer === 'radar' ? 0.85 : 1) : 0);
    });
  }, [i, layer, styleVer, radar, sat, base, dark]);

  /* ---------- gridded fields (temperature, wind) ---------- */
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadField = useCallback((again = false) => {
    const m = map.current; if (!m) return;
    if (retry.current) { clearTimeout(retry.current); retry.current = null; }
    const b = m.getBounds();
    const span = b.getEast() - b.getWest();
    const step = stepFor(span);
    const padX = span * 0.25, padY = (b.getNorth() - b.getSouth()) * 0.25;
    setLoadingField(true);
    loadField({ w: b.getWest() - padX, e: b.getEast() + padX, s: b.getSouth() - padY, n: b.getNorth() + padY }, step).then(f => {
      setLoadingField(false);
      if (!f) { setFieldErr(true); return; }
      setFieldErr(false);
      setField(f);
      // some blocks failed upstream: try once more shortly (failed blocks aren't cached)
      if (f.missing && !again) retry.current = setTimeout(() => reloadField(true), 2500);
    });
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !styleVer || (layer !== 'temp' && layer !== 'wind')) return;
    const onMove = () => reloadField();
    reloadField();
    m.on('moveend', onMove);
    return () => { if (retry.current) clearTimeout(retry.current); if (map.current) m.off('moveend', onMove); };
  }, [layer, styleVer, reloadField]);

  const fieldTime = frames[i]?.time;
  const grid = useMemo(() => (field && fieldTime != null && (layer === 'temp' || layer === 'wind') ? gridAt(field, fieldTime) : null), [field, fieldTime, layer]);

  // field layers are rebuilt whenever the layer or the style changes (opacity/label size differ per layer)
  useEffect(() => () => {
    const m = map.current; if (!m?.style) return;
    for (const id of ['wx-labels', 'wx-field']) { if (m.getLayer(id)) m.removeLayer(id); if (m.getSource(id)) m.removeSource(id); }
  }, [layer, styleVer, base]);
  useEffect(() => { if (layer !== 'temp' && layer !== 'wind') setField(null); }, [layer]);

  useEffect(() => {
    const m = map.current;
    if (!m || !styleVer || !grid || (layer !== 'temp' && layer !== 'wind')) return;
    paintCanvas.current ??= document.createElement('canvas');
    const img = paint(grid, layer, layer === 'temp' ? TEMP_STOPS : WIND_STOPS, paintCanvas.current);
    const fmt = (k: 'temp' | 'wind', v: number) => (k === 'temp' ? `${Math.round(temp(v))}°` : `${Math.round(unit === 'imperial' ? v * 0.621371 : v)}`);
    const pts = labels(grid, m.getZoom(), fmt, layer, (layer === 'temp' ? 84 : 110) * (m.getContainer().clientWidth < 600 ? 1.25 : 1));
    const src = m.getSource('wx-field') as ImageSource | undefined;
    if (src) src.updateImage({ url: img.url, coordinates: img.coordinates });
    else {
      m.addSource('wx-field', { type: 'image', url: img.url, coordinates: img.coordinates });
      m.addLayer({ id: 'wx-field', type: 'raster', source: 'wx-field', paint: { 'raster-opacity': layer === 'temp' ? (base === 'satellite' ? 0.55 : 0.68) : 0.5, 'raster-fade-duration': 0, 'raster-resampling': 'linear' } }, m.getLayer(SLOT) ? SLOT : undefined);
    }
    const lsrc = m.getSource('wx-labels') as GeoJSONSource | undefined;
    if (lsrc) lsrc.setData(pts as any);
    else {
      m.addSource('wx-labels', { type: 'geojson', data: pts as any });
      m.addLayer({
        id: 'wx-labels', type: 'symbol', source: 'wx-labels',
        layout: { 'text-field': ['get', 'l'], 'text-font': ['Noto Sans Bold'], 'text-size': layer === 'temp' ? 14 : 11, 'text-allow-overlap': false, 'text-padding': 6 },
        paint: { 'text-color': '#fff', 'text-halo-color': 'rgba(10,14,22,.62)', 'text-halo-width': 1.6, 'text-opacity': layer === 'temp' ? 1 : 0.85 },
      }, m.getLayer('lbl-water') ? 'lbl-water' : undefined);
    }
  }, [grid, layer, styleVer, base, unit, temp]);

  // wind particles
  useEffect(() => {
    const w = wind.current; if (!w) return;
    if (layer === 'wind' && grid) { w.setColor(base === 'satellite' || dark ? 'rgba(255,255,255,.82)' : 'rgba(255,255,255,.9)'); w.setGrid(grid); w.start(); }
    else w.stop();
  }, [layer, grid, base, dark]);

  /* ---------- UI ---------- */
  const f = frames[i];
  const rel = f ? Math.round((f.time - Date.now()) / 60000) : 0;
  const relTxt = !f ? '' : Math.abs(rel) <= 7 ? 'now' : Math.abs(rel) < 90 ? `${rel > 0 ? '+' : '−'}${Math.abs(rel)} min` : `${rel > 0 ? '+' : '−'}${Math.round(Math.abs(rel) / 60)} h`;
  const msg = layer === 'clouds' && !sat ? 'Loading live satellite…' : layer === 'radar' && !radar ? 'Loading radar…'
    : (layer === 'temp' || layer === 'wind') && fieldErr ? 'Zoom in a little to load the forecast grid' : (layer === 'temp' || layer === 'wind') && loadingField && !field ? 'Loading forecast grid…' : null;
  const T = (c: number) => `${Math.round(temp(c))}°`;
  const S = (k: number) => `${Math.round(unit === 'imperial' ? k * 0.621371 : k)}`;

  return (
    <div className="map-wrap">
      <div ref={el} style={{ position: 'absolute', inset: 0 }} />
      <canvas ref={windEl} className="wind-canvas" style={{ width: '100%', height: '100%' }} aria-hidden />

      <div className="map-ui map-tl">
        <div className="map-layers">
          <div className="bgroup" role="radiogroup" aria-label="Map layer">
            {LAYERS.map(l => (
              <button key={l.id} role="radio" aria-checked={layer === l.id} className={layer === l.id ? 'on' : ''} onClick={() => setLayer(l.id)}>
                <Icon name={l.icon} fill={layer === l.id} /><span className="lbl">{l.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="map-side">
          <button className={`icon-btn surface ${base === 'satellite' ? 'on' : ''}`} style={{ width: 44, height: 44 }} aria-pressed={base === 'satellite'}
            aria-label={base === 'satellite' ? 'Show map' : 'Show satellite imagery'} title={base === 'satellite' ? 'Map' : 'Satellite'}
            onClick={() => setBase(b => (b === 'map' ? 'satellite' : 'map'))}>
            <Icon name={base === 'satellite' ? 'map' : 'satellite_alt'} />
          </button>
          <div className="map-zoom">
            <button className="state" aria-label="Zoom in" onClick={() => map.current?.zoomIn()}><Icon name="add" /></button>
            <button className="state" aria-label="Zoom out" onClick={() => map.current?.zoomOut()}><Icon name="remove" /></button>
          </div>
          <button className="icon-btn surface" style={{ width: 44, height: 44 }} aria-label="Back to my place" onClick={() => map.current?.flyTo({ center: [lon, lat], zoom: Math.max(6, map.current.getZoom()) })}>
            <Icon name="my_location" />
          </button>
        </div>
      </div>

      {msg && <div className="map-msg"><Icon name="hourglass_top" className="sm" />{msg}</div>}

      <div className="map-ui map-bottom">
        <div className="legend">
          {layer === 'radar' && <><span>Light</span><span className="ramp" style={{ background: RADAR_RAMP }} /><span>Heavy</span></>}
          {layer === 'clouds' && <><Icon name="satellite_alt" className="sm" /><span>{sat ? `${sat.name} · infrared` : 'Satellite'}</span><span className="ramp" style={{ background: CLOUD_RAMP, width: 80 }} /></>}
          {layer === 'temp' && <><span>{T(-20)}</span><span className="ramp" style={{ background: ramp(TEMP_STOPS, -20, 40) }} /><span>{T(40)}</span></>}
          {layer === 'wind' && <><span>0</span><span className="ramp" style={{ background: ramp(WIND_STOPS, 0, 100) }} /><span>{S(100)} {unit === 'imperial' ? 'mph' : 'km/h'}</span></>}
        </div>
        {frames.length > 1 && (
          <div className="timeline">
            <button className="play" aria-pressed={play} aria-label={play ? 'Pause' : 'Play'} onClick={() => setPlay(p => !p)}><Icon name={play ? 'pause' : 'play_arrow'} fill /></button>
            <Scrub frames={frames} i={i} onChange={k => { setPlay(false); setI(k); }} />
            <div className="when">
              <div className="t tnum">{f ? new Date(f.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '–'}</div>
              <div className="r">{f && (layer === 'temp' || layer === 'wind') && rel > 7 ? `forecast ${relTxt}` : relTxt}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Scrub({ frames, i, onChange }: { frames: Frame[]; i: number; onChange: (k: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const n = frames.length;
  const pos = (k: number) => (n > 1 ? (k / (n - 1)) * 100 : 0);
  const pick = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    onChange(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1)))));
  };
  const nowK = frames.findIndex(f => f.time >= Date.now() - 5 * 60_000);
  const span = frames[n - 1].time - frames[0].time;
  const labelEvery = span > 12 * 3600_000 ? 6 * 3600_000 : span > 3 * 3600_000 ? 3600_000 : 30 * 60_000;
  const labs = frames.map((f, k) => ({ f, k })).filter(({ f }, idx, arr) => idx > 0 && Math.floor(f.time / labelEvery) !== Math.floor(arr[idx - 1].f.time / labelEvery));
  return (
    <div ref={ref} className="scrub" role="slider" aria-valuemin={0} aria-valuemax={n - 1} aria-valuenow={i} tabIndex={0} aria-label="Time"
      onPointerDown={e => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); pick(e); }}
      onPointerMove={e => { if (e.buttons) pick(e); }}
      onKeyDown={e => { if (e.key === 'ArrowLeft') onChange(Math.max(0, i - 1)); if (e.key === 'ArrowRight') onChange(Math.min(n - 1, i + 1)); }}>
      <div className="track"><div className="fill" style={{ width: `${pos(i)}%` }} /></div>
      {frames.map((_, k) => <span key={k} className="tick" style={{ left: `${pos(k)}%` }} />)}
      {nowK > 0 && nowK < n - 1 && <span className="now-mark" style={{ left: `${pos(nowK)}%` }} />}
      <span className="thumb" style={{ left: `${pos(i)}%` }} />
      {labs.map(({ f, k }) => <span key={k} className="lab" style={{ left: `${pos(k)}%` }}>{new Date(f.time).toLocaleTimeString([], { hour: 'numeric', ...(labelEvery < 3600_000 ? { minute: '2-digit' } : {}) })}</span>)}
    </div>
  );
}
