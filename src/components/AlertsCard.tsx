'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CloudLightning, Wind, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Card, Pill } from './ui/Card';

type Severity = 'minor' | 'moderate' | 'severe' | 'extreme' | 'unknown';
type Alert = {
  id: string;
  source: string;
  event: string;
  severity: Severity;
  headline: string;
  description?: string;
  onset?: string;
  expires?: string;
  areas?: string[];
  url?: string;
};

const TONE: Record<Severity, 'default' | 'fair' | 'warn' | 'severe' | 'poor'> = {
  unknown: 'default', minor: 'fair', moderate: 'warn', severe: 'severe', extreme: 'severe',
};

function iconFor(event: string) {
  const e = event.toLowerCase();
  if (e.includes('thunder') || e.includes('lightning') || e.includes('storm')) return <CloudLightning size={18} />;
  if (e.includes('wind') || e.includes('gust')) return <Wind size={18} />;
  return <AlertTriangle size={18} />;
}

function fmtTime(s?: string) {
  if (!s) return '';
  try {
    const d = new Date(s);
    return d.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return s; }
}

export default function AlertsCard({ lat, lon, country }: { lat?: number; lon?: number; country?: string }) {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lat == null || lon == null) return;
    setLoading(true);
    const url = `/api/alerts?lat=${lat}&lon=${lon}${country ? `&country=${country}` : ''}`;
    fetch(url)
      .then((r) => r.json())
      .then((j) => setAlerts(j?.alerts ?? []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, [lat, lon, country]);

  if (loading && !alerts) {
    return <Card id="alerts" title="Alerts" icon={<AlertTriangle size={18} />}>checking warnings…</Card>;
  }
  if (!alerts || alerts.length === 0) {
    return (
      <Card id="alerts" title="Alerts" icon={<AlertTriangle size={18} />} tone="good">
        <p className="muted">no active warnings for this area. blue skies (figuratively).</p>
      </Card>
    );
  }

  const worst = alerts[0]?.severity ?? 'unknown';
  return (
    <Card
      id="alerts"
      title={`${alerts.length} active warning${alerts.length === 1 ? '' : 's'}`}
      icon={<AlertTriangle size={18} />}
      action={<Pill tone={TONE[worst]}>{worst}</Pill>}
      tone={TONE[worst]}
    >
      <ul className="alerts">
        {alerts.map((a) => {
          const isOpen = !!open[a.id];
          return (
            <li key={a.id} className={`alert alert--${TONE[a.severity]}`}>
              <button
                type="button"
                className="alert__head"
                aria-expanded={isOpen}
                onClick={() => setOpen((s) => ({ ...s, [a.id]: !s[a.id] }))}
              >
                <span className="alert__icon" aria-hidden>{iconFor(a.event)}</span>
                <span className="alert__title">
                  <span className="alert__event">{a.event}</span>
                  <span className="alert__headline">{a.headline}</span>
                </span>
                <span className="alert__meta">
                  <Pill tone={TONE[a.severity]}>{a.severity}</Pill>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>
              {isOpen && (
                <div className="alert__body">
                  {(a.onset || a.expires) && (
                    <p className="alert__time">
                      {a.onset && <>from <strong>{fmtTime(a.onset)}</strong></>}
                      {a.expires && <> · until <strong>{fmtTime(a.expires)}</strong></>}
                    </p>
                  )}
                  {a.areas && a.areas.length > 0 && (
                    <p className="alert__areas">areas: {a.areas.slice(0, 6).join(', ')}{a.areas.length > 6 ? '…' : ''}</p>
                  )}
                  {a.description && (
                    <p className="alert__desc">{a.description.slice(0, 600)}{a.description.length > 600 ? '…' : ''}</p>
                  )}
                  <p className="alert__source">
                    source: {a.source}
                    {a.url && (
                      <>
                        {' · '}
                        <a href={a.url} target="_blank" rel="noopener noreferrer">
                          full bulletin <ExternalLink size={12} />
                        </a>
                      </>
                    )}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
