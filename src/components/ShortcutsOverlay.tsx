'use client';

import { useEffect, useState } from 'react';
import { Keyboard, X } from 'lucide-react';

const SHORTCUTS: { key: string; label: string }[] = [
  { key: '1', label: 'Today tab' },
  { key: '2', label: 'Forecast tab' },
  { key: '3', label: 'Alerts tab' },
  { key: '4', label: 'Map tab' },
  { key: '5', label: 'Compare tab' },
  { key: '6', label: 'Saved tab' },
  { key: '/', label: 'Focus search' },
  { key: 'L', label: 'Use my location' },
  { key: 'S', label: 'Share this view' },
  { key: 'U', label: 'Toggle °C / °F' },
  { key: '?', label: 'Show shortcuts' },
  { key: 'Esc', label: 'Close overlay' },
];

export function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="shortcuts-overlay" onClick={onClose} role="dialog" aria-label="Keyboard shortcuts">
      <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
        <h2 className="shortcuts-title">
          <Keyboard size={18} /> Keyboard shortcuts
        </h2>
        <div className="shortcuts-list">
          {SHORTCUTS.map(s => (
            <div className="shortcuts-row" key={s.key}>
              <span>{s.label}</span>
              <span className="kbd">{s.key}</span>
            </div>
          ))}
        </div>
        <button className="shortcuts-close" onClick={onClose}>
          <X size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> close (Esc)
        </button>
      </div>
    </div>
  );
}
