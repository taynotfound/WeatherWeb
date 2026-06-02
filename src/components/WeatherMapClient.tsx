'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Cloud, CloudRain, Thermometer, Wind, Radar, Play, Pause } from 'lucide-react';

type LayerKind = 'radar' | 'precipitation' | 'clouds' | 'temp' | 'wind';

const OWM_KEY = process.env.NEXT_PUBLIC_OWM_KEY || '1b0a8e88e0fb50e11825a6a02f387785';

const OWM_LAYERS: Record<Exclude<LayerKind, 'radar'>, string> = {
  precipitation: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
  clouds:        `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
  temp:          `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
  wind:          `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
};

type Frame = { time: number; path: string; kind: 'past' | 'now' | 'forecast' };

export default function WeatherMapClient({ lat, lon }: { lat: number; lon: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlayRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const [radar, setRadar] = useState<{ tileTemplate: string; frames: Frame[]; nowIndex: number } | null>(null);
  const [layer, setLayer] = useState<LayerKind>('radar');
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(true);

  // Fetch radar manifest
  useEffect(() => {
    fetch(`/api/rain?lat=${lat}&lon=${lon}`)
      .then(r => r.json())
      .then(j => {
        if (!j?.radar?.tileTemplate) return;
        const past = (j.radar.past || []).map((f: any) => ({ ...f, kind: 'past' as const }));
        const nowcast = (j.radar.nowcast || []).map((f: any) => ({ ...f, kind: 'forecast' as const }));
        const frames: Frame[] = [...past, ...nowcast];
        // mark frame closest to "now" (last past frame)
        const nowIndex = Math.max(0, past.length - 1);
        if (frames[nowIndex]) frames[nowIndex].kind = 'now';
        setRadar({ tileTemplate: j.radar.tileTemplate, frames, nowIndex });
        setFrameIdx(nowIndex);
      })
      .catch(() => {});
  }, [lat, lon]);

  // Init map once
  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !ref.current) return;
      const m = L.map(ref.current, { scrollWheelZoom: true, zoomControl: true, minZoom: 3, maxZoom: 10 }).setView([lat, lon], 7);

      L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
        attribution: '© OSM · © CARTO · radar © RainViewer · weather © OpenWeatherMap',
        subdomains: 'abcd',
        maxZoom: 10,
      }).addTo(m);

      const icon = L.divIcon({
        className: 'tomato-marker',
        html: `<div class="tm-dot"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker([lat, lon], { icon }).addTo(m);
      mapRef.current = m;
      setTimeout(() => m.invalidateSize(), 50);
    })();
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) mapRef.current.setView([lat, lon], 7);
  }, [lat, lon]);

  // Playback timer for radar
  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (layer !== 'radar' || !playing || !radar?.frames?.length) return;
    timerRef.current = setInterval(() => {
      setFrameIdx(i => (i + 1) % radar.frames.length);
    }, 700);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [layer, playing, radar]);

  // Paint tiles whenever layer or frameIdx changes
  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapRef.current) return;
      if (overlayRef.current) { overlayRef.current.remove(); overlayRef.current = null; }
      if (layer === 'radar') {
        if (!radar?.frames?.length) return;
        const f = radar.frames[frameIdx] || radar.frames[radar.frames.length - 1];
        const url = radar.tileTemplate.replace('{path}', f.path);
        overlayRef.current = L.tileLayer(url, { opacity: 0.75, tileSize: 256, zIndex: 400, maxNativeZoom: 8, maxZoom: 10 }).addTo(mapRef.current);
      } else {
        overlayRef.current = L.tileLayer(OWM_LAYERS[layer], { opacity: 0.7, zIndex: 400, maxNativeZoom: 9, maxZoom: 10 }).addTo(mapRef.current);
      }
    })();
    return () => { cancelled = true; };
  }, [layer, frameIdx, radar]);

  const cur = radar?.frames[frameIdx];
  const timeLabel = cur
    ? new Date(cur.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const relLabel = cur ? relTime(cur.time) : '';

  return (
    <div className="map-root">
      <div ref={ref} className="map-canvas" />
      <div className="map-layers" role="tablist" aria-label="Map layers">
        <LayerBtn cur={layer} v="radar"         set={setLayer} icon={<Radar size={14} />}       label="radar" />
        <LayerBtn cur={layer} v="precipitation" set={setLayer} icon={<CloudRain size={14} />}   label="rain" />
        <LayerBtn cur={layer} v="clouds"        set={setLayer} icon={<Cloud size={14} />}       label="clouds" />
        <LayerBtn cur={layer} v="temp"          set={setLayer} icon={<Thermometer size={14} />} label="temp" />
        <LayerBtn cur={layer} v="wind"          set={setLayer} icon={<Wind size={14} />}        label="wind" />
      </div>

      {layer === 'radar' && radar?.frames?.length ? (
        <div className="map-timeline">
          <button
            type="button"
            className="map-play"
            onClick={() => setPlaying(p => !p)}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <div className="map-time-info">
            <span className="map-time-now">{timeLabel}</span>
            <span className={`map-time-rel map-time-${cur?.kind}`}>{relLabel}</span>
          </div>
          <input
            type="range"
            min={0}
            max={radar.frames.length - 1}
            value={frameIdx}
            onChange={(e) => { setPlaying(false); setFrameIdx(parseInt(e.target.value, 10)); }}
            className="map-scrub"
            aria-label="Radar timeline"
          />
          <div className="map-ticks">
            {radar.frames.map((f, i) => (
              <span
                key={i}
                className={`map-tick map-tick-${f.kind}${i === frameIdx ? ' is-active' : ''}`}
                style={{ left: `${(i / Math.max(1, radar.frames.length - 1)) * 100}%` }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LayerBtn({ cur, v, set, icon, label }: { cur: LayerKind; v: LayerKind; set: (k: LayerKind) => void; icon: React.ReactNode; label: string }) {
  const active = cur === v;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`map-layer-btn${active ? ' is-active' : ''}`}
      onClick={() => set(v)}
    >
      {icon}<span>{label}</span>
    </button>
  );
}

function relTime(t: number): string {
  const diffMin = Math.round((t - Date.now()) / 60000);
  if (Math.abs(diffMin) < 1) return 'now';
  if (diffMin < 0) return `${-diffMin} min ago`;
  return `in ${diffMin} min`;
}
