'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon, Snack } from '@/components/ui';
import { Hero } from '@/components/Hero';
import { DetailsCard, HourlyCard, InsightsCard, OutfitCard, RainCard, ScoresCard, SourcesCard, SunCard, TempChartCard, WindCard } from '@/components/TodayCards';
import { ClimateCard, DailyCard, ModelChartCard, RainWeekCard, WeekCard } from '@/components/ForecastCards';
import { AqiCard, PollenCard, UvCard } from '@/components/AirCards';
import { AlertBanner } from '@/components/AlertsUI';
import { SkyView } from '@/components/SkyView';
import { TomatoChat, TomatoFab } from '@/components/TomatoChat';
import { TomatoMark } from '@/components/Tomato';
import { SettingsDialog } from '@/components/Settings';
import { ShareSheet } from '@/components/ShareSheet';
import { locId, useFavorites, type SavedLocation } from '@/lib/favorites';
import { usePrefs } from '@/lib/prefs';
import { seedFor, useTheme } from '@/lib/theme';
import { sceneKind } from '@/lib/wx';

const WeatherMap = dynamic(() => import('@/components/WeatherMap'), { ssr: false, loading: () => <div className="skel map-wrap" /> });

type Loc = { lat: number; lon: number; name: string; country: string; countryCode: string };
const LONDON: Loc = { lat: 51.5074, lon: -0.1278, name: 'London', country: 'United Kingdom', countryCode: 'GB' };
const TABS = [
  { id: 'today', label: 'Today', icon: 'home' },
  { id: 'forecast', label: 'Forecast', icon: 'calendar_month' },
  { id: 'radar', label: 'Map', icon: 'map' },
  { id: 'air', label: 'Air', icon: 'air' },
  { id: 'sky', label: 'Sky', icon: 'nights_stay' },
] as const;
type Tab = (typeof TABS)[number]['id'];
const STORE = 'tomato-loc';

export default function App() {
  const [loc, setLoc] = useState<Loc | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [air, setAir] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [rain, setRain] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('today');
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [focus, setFocus] = useState(false);
  const [scrolled, setScrolled] = useState(0);
  const [chat, setChat] = useState(false);
  const [settings, setSettings] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const fav = useFavorites();
  const { unit, setUnit } = usePrefs();
  const { setSeed } = useTheme();

  const toast = useCallback((s: string) => { setSnack(s); setTimeout(() => setSnack(null), 2600); }, []);

  /* ---- initial location: URL > saved > geolocation > London ---- */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const tb = p.get('tab') as Tab | null;
    if (tb && TABS.some(t => t.id === tb)) setTab(tb);
    const lat = parseFloat(p.get('lat') || ''), lon = parseFloat(p.get('lon') || '');
    if (isFinite(lat) && isFinite(lon)) { setLoc({ lat, lon, name: p.get('name') || '', country: '', countryCode: '' }); return; }
    try { const s = JSON.parse(localStorage.getItem(STORE) || 'null'); if (s && isFinite(s.lat)) { setLoc(s); return; } } catch {}
    let done = false;
    const fallback = setTimeout(() => { if (!done) { done = true; setLoc(LONDON); } }, 4500);
    if (!navigator.geolocation) { clearTimeout(fallback); setLoc(LONDON); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { if (done) return; done = true; clearTimeout(fallback); setLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude, name: '', country: '', countryCode: '' }); },
      () => { if (done) return; done = true; clearTimeout(fallback); setLoc(LONDON); },
      { timeout: 4000, maximumAge: 3600_000 }
    );
    return () => clearTimeout(fallback);
  }, []);

  const key = loc ? `${loc.lat},${loc.lon}` : '';
  /* ---- data ---- */
  useEffect(() => {
    if (!loc) return;
    let alive = true;
    setLoading(true);
    fetch(`/api/weather?lat=${loc.lat}&lon=${loc.lon}`).then(r => r.json()).then(j => {
      if (!alive) return;
      if (j.error) { setErr(j.error); return; }
      setErr(null); setWeather(j);
      const l = j.location;
      if (l?.name && (!loc.name || loc.name !== l.name)) {
        const next = { ...loc, name: loc.name || l.name, country: loc.country || l.country || '', countryCode: loc.countryCode || l.countryCode || '' };
        setLoc(next);
        try { localStorage.setItem(STORE, JSON.stringify(next)); } catch {}
      }
    }).catch(e => alive && setErr(String(e?.message || e))).finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  useEffect(() => {
    if (!loc) return;
    let alive = true;
    const cc = loc.countryCode ? `&country=${loc.countryCode}` : '';
    fetch(`/api/air?lat=${loc.lat}&lon=${loc.lon}`).then(r => r.json()).then(j => alive && setAir(j)).catch(() => {});
    fetch(`/api/alerts?lat=${loc.lat}&lon=${loc.lon}${cc}`).then(r => r.json()).then(j => alive && setAlerts(j)).catch(() => {});
    fetch(`/api/rain?lat=${loc.lat}&lon=${loc.lon}`).then(r => r.json()).then(j => alive && setRain(j)).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, loc?.countryCode, tick]);

  // refresh every 10 min and when the tab becomes visible again after a while
  useEffect(() => {
    let last = Date.now();
    const id = setInterval(() => { last = Date.now(); setTick(t => t + 1); }, 10 * 60_000);
    const vis = () => { if (document.visibilityState === 'visible' && Date.now() - last > 5 * 60_000) { last = Date.now(); setTick(t => t + 1); } };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis); };
  }, []);

  /* ---- theme follows the sky ---- */
  useEffect(() => {
    const c = weather?.current; if (!c) return;
    let golden = false;
    const d = weather.daily;
    if (d?.sunrise?.[0]) {
      const m = (s: string) => { const [h, mi] = s.slice(11, 16).split(':').map(Number); return h * 60 + mi; };
      const n = m(c.time), a = m(d.sunrise[0]), b = m(d.sunset[0]);
      golden = (n >= a - 20 && n <= a + 60) || (n >= b - 60 && n <= b + 20);
    }
    setSeed(seedFor(sceneKind(c.weatherCode), c.isDay, golden));
  }, [weather, setSeed]);

  /* ---- search ---- */
  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    let alive = true;
    const t = setTimeout(() => fetch(`/api/search?q=${encodeURIComponent(q)}`).then(r => r.json()).then(j => alive && setResults(j.results || [])).catch(() => {}), 180);
    return () => { alive = false; clearTimeout(t); };
  }, [q]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8 ? (window.scrollY > 160 ? 2 : 1) : 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = useCallback((l: Loc) => {
    setLoc(l); setQ(''); setResults([]); setFocus(false); setTab('today'); setWeather(null); setRain(null); setAir(null); setAlerts(null);
    try { localStorage.setItem(STORE, JSON.stringify(l)); } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fav.pushRecent({ id: locId(l.lat, l.lon), name: l.name, country: l.country, countryCode: l.countryCode, latitude: l.lat, longitude: l.lon });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locate = useCallback(() => {
    if (!navigator.geolocation) { toast('Location is not supported here'); return; }
    toast('Finding you…');
    navigator.geolocation.getCurrentPosition(
      p => go({ lat: p.coords.latitude, lon: p.coords.longitude, name: '', country: '', countryCode: '' }),
      () => toast('Location permission denied'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
    );
  }, [go, toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
      else if (/^[1-5]$/.test(e.key)) setTab(TABS[+e.key - 1].id);
      else if (e.key === 's' && weather) setSharing(true);
      else if (e.key === 'u') setUnit(unit === 'metric' ? 'imperial' : 'metric');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [unit, setUnit, weather]);

  const c = weather?.current;
  const place = loc ? (loc.name || weather?.location?.name || `${loc.lat.toFixed(2)}°, ${loc.lon.toFixed(2)}°`) : '';
  const fullPlace = [place, weather?.location?.admin && weather.location.admin !== place ? weather.location.admin : '', loc?.country || weather?.location?.country].filter(Boolean).slice(0, 2).join(', ');
  const id = loc ? locId(loc.lat, loc.lon) : '';
  const isFav = fav.isFav(id);
  const alertCount = alerts?.count ?? 0;

  const rainInfo = useMemo(() => {
    const tl: any[] = rain?.timeline ?? [];
    const first = tl.find(b => b.mm > 0.05);
    if (!first) return { soon: null as number | null, now: false };
    const m = Math.round((new Date(first.time).getTime() - Date.now()) / 60000);
    return m <= 5 ? { soon: null, now: true } : { soon: m, now: false };
  }, [rain]);

  const showFav = () => loc && (isFav ? fav.remove(id) : (fav.add({ id, name: place, country: loc.country, countryCode: loc.countryCode, latitude: loc.lat, longitude: loc.lon }), toast('Saved')));
  const pickSaved = (f: SavedLocation) => go({ lat: f.latitude, lon: f.longitude, name: f.name, country: f.country, countryCode: f.countryCode || '' });

  const tabBtn = (t: (typeof TABS)[number]) => (
    <button key={t.id} role="tab" aria-selected={tab === t.id} className="nav-item" onClick={() => { setTab(t.id); window.scrollTo({ top: 0 }); }}>
      <span className="nav-pill state"><Icon name={t.icon} />{t.id === 'air' && alertCount > 0 && <span className="badge">{alertCount}</span>}</span>
      {t.label}
    </button>
  );
  const fl = loc!;

  return (
    <div className="app">
      <div className="sky-glow" aria-hidden />
      <header className={`topbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="topbar-in">
          <div className="topbrand"><TomatoMark size={34} title="Tomato" /></div>
          <div className={`searchbar ${focus ? 'open' : ''}`} role="search">
            <Icon name="search" />
            <input ref={searchRef} value={q} onChange={e => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)}
              placeholder={place || 'Search places'} aria-label="Search places" autoComplete="off" />
            {q ? <button className="icon-btn state" aria-label="Clear" onClick={() => setQ('')}><Icon name="close" /></button>
              : <button className="icon-btn state" aria-label="Use my location" onClick={locate}><Icon name="my_location" /></button>}
            {focus && (
              <div className="search-pop">
                {q.trim().length >= 2 ? (
                  results.length ? results.map(r => (
                    <button key={`${r.id}-${r.latitude}`} className="li state" onMouseDown={e => e.preventDefault()} onClick={() => go({ lat: r.latitude, lon: r.longitude, name: r.name, country: r.country || '', countryCode: r.country_code || '' })}>
                      <Icon name="location_on" /><div className="li-body"><div className="body-l">{r.name}</div><div className="sub">{[r.admin, r.country].filter(Boolean).join(', ')}</div></div>
                    </button>
                  )) : <p className="li muted">No matches</p>
                ) : (
                  <>
                    <button className="li state" onMouseDown={e => e.preventDefault()} onClick={locate}><Icon name="my_location" /><div className="li-body body-l">Current location</div></button>
                    {fav.favorites.length > 0 && <div className="sub-h overline">Saved</div>}
                    {fav.favorites.map(f => (
                      <div key={f.id} className="row" style={{ gap: 0, paddingRight: 8 }}>
                        <button className="li state grow" onMouseDown={e => e.preventDefault()} onClick={() => pickSaved(f)}><Icon name="star" fill /><div className="li-body"><div className="body-l">{f.name}</div><div className="sub">{f.country}</div></div></button>
                        <button className="icon-btn state" aria-label={`Remove ${f.name}`} onMouseDown={e => e.preventDefault()} onClick={() => fav.remove(f.id)}><Icon name="delete" /></button>
                      </div>
                    ))}
                    {fav.recent.filter(r => !fav.isFav(r.id)).length > 0 && <div className="sub-h overline">Recent</div>}
                    {fav.recent.filter(r => !fav.isFav(r.id)).slice(0, 4).map(f => (
                      <button key={f.id} className="li state" onMouseDown={e => e.preventDefault()} onClick={() => pickSaved(f)}><Icon name="history" /><div className="li-body"><div className="body-l">{f.name}</div><div className="sub">{f.country}</div></div></button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
          {weather && <button className={`icon-btn state ${isFav ? 'on' : ''}`} aria-label={isFav ? 'Remove from saved' : 'Save place'} aria-pressed={isFav} onClick={showFav}><Icon name="star" fill={isFav} /></button>}
          {weather && <button className="icon-btn state" aria-label="Share" onClick={() => setSharing(true)}><Icon name="ios_share" /></button>}
          <button className="icon-btn state" aria-label="Settings" onClick={() => setSettings(true)}><Icon name="settings" /></button>
        </div>
      </header>

      <main className={`main ${tab === 'radar' ? 'map-mode' : ''}`}>
        {err && !weather && (
          <div className="card error" style={{ marginTop: 16 }}>
            <div className="card-h"><span className="ibadge sh-cookie9"><Icon name="cloud_off" /></span><h2 className="grow">Couldn&apos;t load the weather</h2></div>
            <p className="body-m">{err}</p>
            <button className="btn filled state" style={{ alignSelf: 'flex-start' }} onClick={() => setTick(t => t + 1)}>Retry</button>
          </div>
        )}
        {(!weather && !err && tab !== 'radar') && (
          <div className="bento">
            <div className="skel hero s8" />
            <div className="skel s4 m12" style={{ minHeight: 300 }} />
            <div className="skel s12" style={{ minHeight: 220 }} />
            {[0, 1, 2].map(i => <div key={i} className="skel s4" style={{ minHeight: 240 }} />)}
          </div>
        )}

        {weather && c && tab === 'today' && (
          <div className="bento">
            <AlertBanner alerts={alerts} />
            <Hero weather={weather} place={fullPlace} rainSoonMin={rainInfo.soon} rainingNow={rainInfo.now || (rain?.raining && c.precipitation > 0)} className="s8" />
            <InsightsCard weather={weather} air={air} alerts={alerts} className="s4 m12" />
            <HourlyCard weather={weather} className="s12" />
            <RainCard data={rain} className="s4" />
            <OutfitCard weather={weather} className="s4" />
            <ScoresCard weather={weather} className="s4 m12" />
            <TempChartCard weather={weather} className="s8" />
            <WindCard weather={weather} className="s4 m12" />
            <DetailsCard weather={weather} className="s4" />
            <SunCard weather={weather} className="s4" />
            <ClimateCard lat={fl.lat} lon={fl.lon} weather={weather} className="s4 m12" />
            <SourcesCard weather={weather} className="s12" />
          </div>
        )}

        {weather && tab === 'forecast' && (
          <div className="bento">
            <div className="stack s4 m12">
              <WeekCard weather={weather} className="" />
              <RainWeekCard weather={weather} className="" />
              <ClimateCard lat={fl.lat} lon={fl.lon} weather={weather} className="" />
            </div>
            <DailyCard weather={weather} className="s8" />
            <TempChartCard weather={weather} hours={168} title="The week, hour by hour" className="s12" />
            <ModelChartCard lat={fl.lat} lon={fl.lon} className="s12" />
          </div>
        )}

        {loc && tab === 'radar' && <WeatherMap lat={loc.lat} lon={loc.lon} />}

        {weather && tab === 'air' && (
          <div className="bento">
            <AlertBanner alerts={alerts} />
            <AqiCard air={air} className="s8" />
            <UvCard weather={weather} className="s4 m12" />
            <PollenCard air={air} className="s12" />
          </div>
        )}

        {weather && tab === 'sky' && <SkyView lat={fl.lat} lon={fl.lon} weather={weather} />}

        {tab !== 'radar' && (
          <footer className="footer">
            <span className="made">Made with <TomatoMark size={16} /> by <a href="https://taymaerz.de" target="_blank" rel="noopener noreferrer">Tay</a> · <a href="https://taymaerz.de/impressum" target="_blank" rel="noopener noreferrer">Impressum</a></span>
            {weather?.sources && <span>Sources: {weather.sources.used.join(' · ')}{loading ? ' · refreshing…' : ''}</span>}
          </footer>
        )}
      </main>

      <nav className="nav" role="tablist" aria-label="Sections">
        <div className="nav-head">
          <TomatoMark size={44} title="Tomato" />
          {weather && <TomatoFab variant="rail" onClick={() => setChat(true)} />}
        </div>
        {TABS.map(tabBtn)}
      </nav>

      {weather && tab !== 'radar' && <TomatoFab variant="float" compact={scrolled === 2} onClick={() => setChat(true)} />}
      {chat && <TomatoChat weather={weather} rainSoonMin={rainInfo.soon} onClose={() => setChat(false)} />}
      {settings && <SettingsDialog onClose={() => setSettings(false)} />}
      {sharing && weather && loc && <ShareSheet weather={weather} place={place} lat={loc.lat} lon={loc.lon} rainSoonMin={rainInfo.soon} toast={toast} onClose={() => setSharing(false)} />}
      <Snack text={snack} />
    </div>
  );
}
