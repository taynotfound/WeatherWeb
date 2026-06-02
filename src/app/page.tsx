'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Search, Star, Wind, Droplets, Eye, Gauge,
  Sun, CalendarDays, Map as MapIcon, Bookmark,
  MapPin, Share2, AlertTriangle, GitCompare, Keyboard,
} from 'lucide-react';
import { Tomato } from '@/components/Tomato';
import { OutfitCard } from '@/components/OutfitCard';
import { RainTimeline } from '@/components/RainTimeline';
import { SunCard } from '@/components/SunCard';
import { HourlyStrip } from '@/components/HourlyStrip';
import { DailyForecast } from '@/components/DailyForecast';
import { WeatherMap } from '@/components/WeatherMap';
import { AirCard } from '@/components/AirCard';
import AlertsCard from '@/components/AlertsCard';
import AIInsights from '@/components/AIInsights';
import PollenCard from '@/components/PollenCard';
import InstallPrompt from '@/components/InstallPrompt';
import { WindCompass } from '@/components/WindCompass';
import { HistoryCard } from '@/components/HistoryCard';
import { LightningCard } from '@/components/LightningCard';
import { CompareCard } from '@/components/CompareCard';
import { ShortcutsOverlay } from '@/components/ShortcutsOverlay';
import { useFavorites } from '@/lib/favorites';
import { useUnits } from '@/lib/units';
import { weatherIcon, weatherLabel } from '@/lib/weatherIcon';
import { buildShareText } from '@/lib/share';

type LocState = { lat: number; lon: number; name: string; country: string; countryCode: string };
const DEFAULT: LocState = { lat: 51.5074, lon: -0.1278, name: 'London', country: 'United Kingdom', countryCode: 'GB' };
const TABS = [
  { id: 'today',    label: 'today',    icon: Sun },
  { id: 'forecast', label: 'forecast', icon: CalendarDays },
  { id: 'alerts',   label: 'alerts',   icon: AlertTriangle },
  { id: 'map',      label: 'map',      icon: MapIcon },
  { id: 'compare',  label: 'compare',  icon: GitCompare },
  { id: 'saved',    label: 'saved',    icon: Bookmark },
] as const;
type Tab = (typeof TABS)[number]['id'];

export default function Home() {
  const [loc, setLoc] = useState<LocState>(DEFAULT);
  const [weather, setWeather] = useState<any>(null);
  const [air, setAir] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('today');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const fav = useFavorites();
  const { unit, setUnit, temp, tempUnit, speed, speedUnit } = useUnits();

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const lat = parseFloat(p.get('lat') || '');
    const lon = parseFloat(p.get('lon') || '');
    const name = p.get('name');
    if (isFinite(lat) && isFinite(lon)) {
      setLoc({ lat, lon, name: name || 'Shared', country: '', countryCode: '' });
      return;
    }
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      p => setLoc(l => ({ ...l, lat: p.coords.latitude, lon: p.coords.longitude, name: '' })),
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 3600_000 }
    );
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/weather?lat=${loc.lat}&lon=${loc.lon}`)
      .then(r => r.json())
      .then(j => {
        if (!alive) return;
        if (j?.error) { setErr(j.error); return; }
        setErr(null);
        setWeather(j);
        if (j?.location?.name) {
          setLoc(l => ({
            ...l,
            name: j.location.name,
            country: j.location.country || '',
            countryCode: j.location.countryCode || '',
          }));
        }
      })
      .catch(e => alive && setErr(String(e)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [loc.lat, loc.lon]);

  // Fetch air + alerts in parallel (used by AI Insights too)
  useEffect(() => {
    let alive = true;
    fetch(`/api/air?lat=${loc.lat}&lon=${loc.lon}`).then(r => r.json()).then(j => alive && setAir(j)).catch(() => {});
    const cc = loc.countryCode ? `&country=${loc.countryCode}` : '';
    fetch(`/api/alerts?lat=${loc.lat}&lon=${loc.lon}${cc}`).then(r => r.json()).then(j => alive && setAlerts(j)).catch(() => {});
    return () => { alive = false; };
  }, [loc.lat, loc.lon, loc.countryCode]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`).then(r => r.json()).then(j => setResults(j.results || []));
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const inField = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault(); setShowShortcuts(s => !s); return;
      }
      if (e.key === 'Escape') { setShowShortcuts(false); return; }
      if (inField) return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); return; }
      if (e.key === '1') setTab('today');
      else if (e.key === '2') setTab('forecast');
      else if (e.key === '3') setTab('alerts');
      else if (e.key === '4') setTab('map');
      else if (e.key === '5') setTab('compare');
      else if (e.key === '6') setTab('saved');
      else if (e.key === 'l' || e.key === 'L') locate();
      else if (e.key === 's' || e.key === 'S') share();
      else if (e.key === 'u' || e.key === 'U') setUnit(unit === 'metric' ? 'imperial' : 'metric');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]);

  function pick(r: any) {
    setLoc({
      lat: r.latitude, lon: r.longitude, name: r.name,
      country: r.country, countryCode: r.country_code || '',
    });
    setQuery('');
    setResults([]);
    setTab('today');
  }

  function locate() {
    if (!navigator.geolocation) { setToast('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      p => {
        setLoc({ lat: p.coords.latitude, lon: p.coords.longitude, name: '', country: '', countryCode: '' });
        setLocating(false);
      },
      () => { setLocating(false); setToast('Location denied'); },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
    );
  }

  async function share() {
    const url = `${window.location.origin}/?lat=${loc.lat}&lon=${loc.lon}&name=${encodeURIComponent(loc.name)}`;
    const summary = weather?.current
      ? buildShareText({
          location: { name: loc.name, admin: weather?.location?.admin, country: loc.country },
          current: {
            temperature_2m: weather.current.temperatureC,
            apparent_temperature: weather.current.feelsLikeC,
            weather_code: weather.current.weatherCode,
            wind_speed_10m: weather.current.windKmh,
            relative_humidity_2m: weather.current.humidity,
          },
          unit: unit === 'imperial' ? 'f' : 'c',
          url,
          alertCount: alerts?.count ?? 0,
        })
      : { title: `${loc.name} — Tomato`, text: `${loc.name} — Tomato`, url };

    if (navigator.share) {
      try { await navigator.share(summary); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(`${summary.text}\n${summary.url}`);
      setToast('Summary copied');
    } catch {
      setToast('Share failed');
    }
  }

  const c = weather?.current;
  const favId = `${loc.lat.toFixed(2)},${loc.lon.toFixed(2)}`;
  const isFav = fav?.isFav(favId);
  const HeroIcon = c ? weatherIcon(c.weatherCode ?? 0, c.isDay !== false) : null;
  const tu = tempUnit.replace('°F', '°');
  const displayName = loc.name || `${loc.lat.toFixed(2)}°, ${loc.lon.toFixed(2)}°`;
  const alertCount = alerts?.count ?? 0;
  const worstSev = alerts?.alerts?.[0]?.severity;

  return (
    <main className="shell">
      <header className="app-header">
        <div className="brand">
          <img src="/tomato.svg" alt="" />
          <h1>Tomato</h1>
        </div>
        <div className="header-actions">
          <div className="unit-toggle" role="group" aria-label="Units">
            <button className={unit === 'metric' ? 'is-active' : ''} onClick={() => setUnit('metric')}>°C</button>
            <button className={unit === 'imperial' ? 'is-active' : ''} onClick={() => setUnit('imperial')}>°F</button>
          </div>
          <button
            className="btn-icon"
            aria-label="Use my location"
            onClick={locate}
            style={locating ? { color: 'var(--primary)' } : undefined}
          >
            <MapPin size={18} />
          </button>
          <button className="btn-icon" aria-label="Share location" onClick={share}>
            <Share2 size={18} />
          </button>
          <button className="btn-icon" aria-label="Keyboard shortcuts" onClick={() => setShowShortcuts(true)}>
            <Keyboard size={18} />
          </button>
          {weather && fav && (
            <button
              className="btn-icon"
              aria-label={isFav ? 'Remove from saved' : 'Save location'}
              onClick={() => {
                if (isFav) fav.remove(favId);
                else fav.add({ id: favId, name: displayName, country: loc.country, latitude: loc.lat, longitude: loc.lon });
              }}
              style={isFav ? { color: 'var(--primary)' } : undefined}
            >
              <Star size={18} fill={isFav ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </header>

      <div className="search-wrap">
        <Search size={16} className="search-icon" />
        <input
          ref={searchRef}
          className="input"
          placeholder="Search city  ( / to focus )"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ paddingLeft: 36 }}
        />
        {results.length > 0 && (
          <div className="search-results">
            {results.map((r: any) => (
              <button key={r.id} className="search-result" onClick={() => pick(r)}>
                {r.name}<span className="country"> · {r.admin ? `${r.admin}, ` : ''}{r.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <nav className="tabs" role="tablist">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className="tab"
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'alerts' && alertCount > 0 && (
              <span className={`tab__badge tab__badge--${worstSev || 'warn'}`}>{alertCount}</span>
            )}
          </button>
        ))}
      </nav>

      {err && <div className="card"><p>{err}</p></div>}
      {loading && !weather && <div className="card"><p className="empty">Loading…</p></div>}

      {weather && c && tab === 'today' && (
        <>
          <section className="card">
            <p className="current-place">{displayName}{loc.country ? `, ${loc.country}` : ''}</p>
            <div className="current">
              <div>
                <div className="current-temp">{Math.round(temp(c.temperatureC))}{tu}</div>
                <div className="current-meta">
                  {weatherLabel(c.weatherCode ?? 0)} · feels {Math.round(temp(c.feelsLikeC))}{tu}
                </div>
              </div>
              {HeroIcon && (
                <div className="current-icon">
                  <HeroIcon size={56} strokeWidth={1.4} />
                </div>
              )}
            </div>

            <div className="stats">
              <span className="stat"><Wind size={14} />{Math.round(speed(c.windKmh))} {speedUnit}</span>
              <span className="stat"><Droplets size={14} />{Math.round(c.humidity)}%</span>
              {c.pressure && <span className="stat"><Gauge size={14} />{Math.round(c.pressure)} hPa</span>}
              {c.uvIndex != null && <span className="stat"><Sun size={14} />UV {Math.round(c.uvIndex)}</span>}
              {c.visibility != null && <span className="stat"><Eye size={14} />{Math.round((c.visibility ?? 0) / 1000)} km</span>}
            </div>

            {weather.sources && (
              <div className="sources">
                {weather.sources.used.map((s: string) => <span key={s} className="source-ok">{s}</span>)}
                {weather.sources.failed.map((s: string) => <span key={s} className="source-bad">{s}</span>)}
              </div>
            )}
          </section>

          {alertCount > 0 && <AlertsCard lat={loc.lat} lon={loc.lon} country={loc.countryCode} />}
          <AIInsights weather={weather} alerts={alerts} air={air} />
          <RainTimeline lat={loc.lat} lon={loc.lon} />
          <OutfitCard weather={weather} />
          <HourlyStrip weather={weather} />
          <WindCompass weather={weather} />
          <AirCard lat={loc.lat} lon={loc.lon} />
          <PollenCard lat={loc.lat} lon={loc.lon} />
          <LightningCard lat={loc.lat} lon={loc.lon} />
          <HistoryCard lat={loc.lat} lon={loc.lon} />
          <SunCard weather={weather} />
        </>
      )}

      {weather && tab === 'forecast' && (
        <>
          <HourlyStrip weather={weather} />
          <DailyForecast weather={weather} />
        </>
      )}

      {tab === 'alerts' && (
        <AlertsCard lat={loc.lat} lon={loc.lon} country={loc.countryCode} />
      )}

      {tab === 'map' && (
        <div className="map-wrap">
          <WeatherMap lat={loc.lat} lon={loc.lon} />
        </div>
      )}

      {tab === 'compare' && (
        <CompareCard baseCity={{ id: favId, name: displayName, country: loc.country, lat: loc.lat, lon: loc.lon }} />
      )}

      {tab === 'saved' && (
        <div className="card">
          {fav.favorites.length === 0 ? (
            <p className="empty">No saved places. Tap the star to save the current spot.</p>
          ) : (
            <div className="daily">
              {fav.favorites.map(f => (
                <div key={f.id} className="row" style={{ justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
                  <button
                    onClick={() => { setLoc({ lat: f.latitude, lon: f.longitude, name: f.name, country: f.country, countryCode: '' }); setTab('today'); }}
                    style={{ background: 'transparent', border: 0, textAlign: 'left', color: 'var(--ink)', flex: 1, padding: 0 }}
                  >
                    {f.name}<span style={{ color: 'var(--ink-mute)' }}> · {f.country}</span>
                  </button>
                  <button className="btn" onClick={() => fav.remove(f.id)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <nav className="bottom-nav" role="tablist" aria-label="Sections">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className="bottom-nav-btn"
              onClick={() => setTab(t.id)}
            >
              <Icon size={20} strokeWidth={1.7} />
              <span>{t.label}</span>
              {t.id === 'alerts' && alertCount > 0 && (
                <span className={`nav-badge nav-badge--${worstSev || 'warn'}`}>{alertCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      {toast && <div className="toast">{toast}</div>}
      {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}
      <InstallPrompt />
      <Tomato weather={weather} />
    </main>
  );
}
