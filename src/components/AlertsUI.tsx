'use client';

import { useState } from 'react';
import { Card, Icon, Sheet } from './ui';

const SEV: Record<string, { icon: string; label: string }> = {
  extreme: { icon: 'crisis_alert', label: 'Extreme' }, severe: { icon: 'warning', label: 'Severe' },
  moderate: { icon: 'error', label: 'Moderate' }, minor: { icon: 'info', label: 'Minor' }, unknown: { icon: 'info', label: 'Notice' },
};

export function AlertBanner({ alerts }: { alerts: any }) {
  const [open, setOpen] = useState(false);
  const list: any[] = alerts?.alerts ?? [];
  if (!list.length) return null;
  const top = list[0];
  return (
    <>
      <button className="banner state" onClick={() => setOpen(true)} style={{ borderRadius: 'var(--r-xl)' }}>
        <Icon name={SEV[top.severity]?.icon ?? 'warning'} fill className="lg" />
        <div className="grow"><div className="title-m">{top.event}{list.length > 1 ? ` + ${list.length - 1} more` : ''}</div><div className="body-s" style={{ opacity: .85 }}>{top.headline}</div></div>
        <Icon name="chevron_right" />
      </button>
      {open && <AlertsSheet list={list} onClose={() => setOpen(false)} />}
    </>
  );
}

export function AlertsSheet({ list, onClose }: { list: any[]; onClose: () => void }) {
  return (
    <Sheet title="Weather alerts" icon="warning" onClose={onClose}>
      {list.map(a => (
        <Card key={a.id} tone={a.severity === 'extreme' || a.severity === 'severe' ? 'error' : 'high'} title={a.event} icon={SEV[a.severity]?.icon ?? 'info'} sub={`${SEV[a.severity]?.label ?? 'Notice'} · ${a.source}`}>
          <p className="body-m">{a.headline}</p>
          {a.description && <p className="body-s" style={{ opacity: .85, whiteSpace: 'pre-line' }}>{String(a.description).slice(0, 700)}</p>}
          {(a.onset || a.expires) && <p className="label-m" style={{ opacity: .8 }}>{a.onset && `From ${new Date(a.onset).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}`}{a.expires && ` · until ${new Date(a.expires).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}`}</p>}
        </Card>
      ))}
    </Sheet>
  );
}
