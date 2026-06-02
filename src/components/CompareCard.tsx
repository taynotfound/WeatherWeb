'use client';

import { useEffect, useState } from 'react';
import { Plus, X, GitCompare } from 'lucide-react';
import { Card } from './ui/Card';
import { useUnits } from '@/lib/units';
import { weatherIcon, weatherLabel } from '@/lib/weatherIcon';

type City = { id: string; name: string; country: string; lat: number; lon: number };
type Data = { tempC: number; feelsC: number; code: number; humidity: number; windKmh: number };

const STORAGE = 'tomato.compare.v1';

function loadCities(): City[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE) || '[]'); } catch { return []; }
}
function saveCities(c: City[]) {
  try { localStorage.setItem(STORAGE, JSON.stringify(c)); } catch {}
}

export function CompareCard({ baseCity }: { baseCity?: City }) {
  const [cities, setCities] = useState<City[]>([]);
  const [data, setData] = useState<Record<string, Data | null>>({});
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const { temp, tempUnit, speed, speedUnit } = useUnits();

  useEffect(() => { setCities(loadCities()); }, []);

  // Auto-include base city for context, but don't persist it.
  const all = baseCity && !cities.some(c => c.id === baseCity.id)
    ? [baseCity, ...cities] : cities;

  useEffect(() => {
    let alive = true;
    all.forEach(c => {
      if (data[c.id]) return;
      fetch(`/api/weather?lat=${c.lat}&lon=${c.lon}`)
        .then(r => r.json())
        .then(j => {
          if (!alive || !j?.current) return;
          setData(d => ({ ...d, [c.id]: {
            tempC: j.current.temperatureC,
            feelsC: j.current.feelsLikeC,
            code: j.current.weatherCode ?? 0,
            humidity: j.current.humidity ?? 0,
            windKmh: j.current.windKmh ?? 0,
          }}));
        }).catch(() => {});
    });
    return () => { alive = false; };
  }, [all.map(c => c.id).join('|')]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`).then(r => r.json()).then(j => setResults(j.results || []));
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  function addCity(r: any) {
    const c: City = {
      id: `${r.latitude.toFixed(2)},${r.longitude.toFixed(2)}`,
      name: r.name, country: r.country,
      lat: r.latitude, lon: r.longitude,
    };
    if (cities.some(x => x.id === c.id) || baseCity?.id === c.id) {
      setQuery(''); setResults([]); return;
    }
    const next = [...cities, c];
    setCities(next); saveCities(next);
    setQuery(''); setResults([]);
  }

  function removeCity(id: string) {
    const next = cities.filter(c => c.id !== id);
    setCities(next); saveCities(next);
  }

  return (
    <Card id="compare" title="Compare cities" subtitle="Add up to 6" icon={<GitCompare size={18} />}>
      {all.length === 0 ? (
        <p className="empty">Add a city to compare — search below.</p>
      ) : (
        <div className="compare-grid">
          {all.map(c => {
            const d = data[c.id];
            const Icon = d ? weatherIcon(d.code, true) : null;
            const isBase = baseCity?.id === c.id;
            return (
              <div key={c.id} className="compare-tile">
                {!isBase && (
                  <button className="compare-tile__remove" aria-label="Remove" onClick={() => removeCity(c.id)}>
                    <X size={14} />
                  </button>
                )}
                <div className="compare-tile__name">
                  {c.name}{isBase ? ' ★' : ''}
                </div>
                {d ? (
                  <>
                    <div className="row" style={{ alignItems: 'center', gap: 8 }}>
                      <div className="compare-tile__temp">{Math.round(temp(d.tempC))}{tempUnit.replace('°F', '°')}</div>
                      {Icon && <Icon size={28} strokeWidth={1.4} style={{ color: 'var(--ink-mute)' }} />}
                    </div>
                    <div className="compare-tile__meta">{weatherLabel(d.code)}</div>
                    <div className="compare-tile__meta">feels {Math.round(temp(d.feelsC))}{tempUnit.replace('°F','°')} · {Math.round(speed(d.windKmh))} {speedUnit} · {d.humidity}%</div>
                  </>
                ) : (
                  <div className="skeleton-stack"><div className="skeleton-line" /><div className="skeleton-line" style={{ width: '60%' }} /></div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {cities.length < 6 && (
        <div className="compare-add">
          <input
            className="input"
            placeholder="Add a city to compare…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {results.length > 0 && (
            <div className="compare-suggestions">
              {results.slice(0, 6).map((r: any) => (
                <button key={r.id} className="compare-suggestion" onClick={() => addCity(r)}>
                  <Plus size={12} style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--ink-mute)' }} />
                  {r.name}<span style={{ color: 'var(--ink-mute)' }}> · {r.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
