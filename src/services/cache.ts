export function setCache(key: string, value: any, ttlMinutes: number = 30) {
  const expires = Date.now() + ttlMinutes * 60 * 1000;
  const data = { value, expires };
  localStorage.setItem(key, JSON.stringify(data));
}

export function getCache<T = any>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (Date.now() > data.expires) {
      localStorage.removeItem(key);
      return null;
    }
    return data.value as T;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function clearCache(key: string) {
  localStorage.removeItem(key);
} 