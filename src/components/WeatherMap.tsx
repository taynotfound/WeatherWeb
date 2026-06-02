'use client';

import dynamic from 'next/dynamic';

export const WeatherMap = dynamic(() => import('./WeatherMapClient'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, color: 'var(--ink-mute)' }}>loading map…</div>,
});
