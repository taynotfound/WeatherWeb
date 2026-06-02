'use client';

import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Card } from './ui/Card';

export default function AIInsights({
  weather, alerts, air,
}: { weather: any; alerts?: any; air?: any }) {
  const [insights, setInsights] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!weather) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weather, alerts, air }),
      });
      const j = await r.json();
      setInsights(j?.insights ?? []);
      if (j?.error) setError(j.error);
    } catch (e: any) {
      setError(e?.message ?? 'failed');
    } finally {
      setLoading(false);
    }
  }

  // Auto-load once when weather first available
  useEffect(() => {
    if (weather && insights === null && !loading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather?.current?.time]);

  return (
    <Card
      id="insights"
      title="AI insights"
      subtitle="Next 24 hours, summarized."
      icon={<Sparkles size={18} />}
      action={
        <button type="button" className="icon-btn" onClick={load} disabled={loading} aria-label="Refresh insights">
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      }
    >
      {loading && !insights && <p className="muted">cooking up insights…</p>}
      {insights && insights.length > 0 && (
        <ul className="insights">
          {insights.map((s, i) => (
            <li key={i} className="insights__item">
              <span className="insights__dot" aria-hidden />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}
      {insights && insights.length === 0 && !error && (
        <p className="muted">no insights right now. tap refresh.</p>
      )}
      {error && <p className="muted">model is sulking ({error}). tap refresh.</p>}
    </Card>
  );
}
