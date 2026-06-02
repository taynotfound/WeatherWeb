'use client';

import { useState } from 'react';
import { Sparkles, RefreshCw, Wand2 } from 'lucide-react';
import { Card } from './ui/Card';

export default function AIInsights({
  weather, alerts, air,
}: { weather: any; alerts?: any; air?: any }) {
  const [insights, setInsights] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

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
      setCached(!!j?.cached);
      if (j?.error) setError(j.error);
    } catch (e: any) {
      setError(e?.message ?? 'failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      id="insights"
      title="AI insights"
      subtitle="Powered by openrouter/free · cached 2h"
      icon={<Sparkles size={18} />}
      action={
        insights ? (
          <button type="button" className="icon-btn" onClick={load} disabled={loading} aria-label="Regenerate insights">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        ) : null
      }
    >
      {!insights && (
        <button
          type="button"
          className="ai-generate-btn"
          onClick={load}
          disabled={loading || !weather}
        >
          <Wand2 size={16} className={loading ? 'spin' : 'pulse'} />
          <span>{loading ? 'thinking…' : 'Generate insights'}</span>
        </button>
      )}

      {loading && !insights && (
        <div className="skeleton-stack" aria-hidden>
          <div className="skeleton-line" style={{ width: '90%' }} />
          <div className="skeleton-line" style={{ width: '75%' }} />
          <div className="skeleton-line" style={{ width: '82%' }} />
        </div>
      )}

      {insights && insights.length > 0 && (
        <ul className="insights">
          {insights.map((s, i) => (
            <li
              key={`${i}-${s.slice(0, 8)}`}
              className="insights__item fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="insights__dot" aria-hidden />
              <span>{s}</span>
            </li>
          ))}
          {cached && <li className="insights__meta">⚡ from cache</li>}
        </ul>
      )}

      {insights && insights.length === 0 && !error && (
        <p className="muted">no insights came back — tap regenerate.</p>
      )}
      {error && <p className="muted">model is sulking ({error}). tap to retry.</p>}
    </Card>
  );
}
