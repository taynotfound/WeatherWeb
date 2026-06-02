'use client';

import { useEffect, useState } from 'react';

export type SavedLocation = {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
};

const KEY = 'tomato.favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<SavedLocation[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {}
  }, []);

  function persist(next: SavedLocation[]) {
    setFavorites(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }

  function add(loc: SavedLocation) {
    if (favorites.some(f => f.id === loc.id)) return;
    persist([...favorites, loc]);
  }
  function remove(id: string) {
    persist(favorites.filter(f => f.id !== id));
  }
  function isFav(id: string) {
    return favorites.some(f => f.id === id);
  }

  return { favorites, add, remove, isFav };
}
