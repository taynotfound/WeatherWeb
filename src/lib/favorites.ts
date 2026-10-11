'use client';

import { useCallback, useEffect, useState } from 'react';

export type SavedLocation = { id: string; name: string; country: string; countryCode?: string; latitude: number; longitude: number };
const KEY = 'tomato.favorites';
const RECENT = 'tomato.recent';

const read = <T,>(k: string): T[] => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const locId = (lat: number, lon: number) => `${lat.toFixed(2)},${lon.toFixed(2)}`;

export function useFavorites() {
  const [favorites, setFavorites] = useState<SavedLocation[]>([]);
  const [recent, setRecent] = useState<SavedLocation[]>([]);
  useEffect(() => { setFavorites(read(KEY)); setRecent(read(RECENT)); }, []);

  const add = useCallback((l: SavedLocation) => setFavorites(f => { if (f.some(x => x.id === l.id)) return f; const n = [...f, l]; write(KEY, n); return n; }), []);
  const remove = useCallback((id: string) => setFavorites(f => { const n = f.filter(x => x.id !== id); write(KEY, n); return n; }), []);
  const pushRecent = useCallback((l: SavedLocation) => setRecent(r => { const n = [l, ...r.filter(x => x.id !== l.id)].slice(0, 6); write(RECENT, n); return n; }), []);
  const isFav = useCallback((id: string) => favorites.some(f => f.id === id), [favorites]);
  return { favorites, recent, add, remove, isFav, pushRecent };
}
