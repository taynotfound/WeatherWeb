'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUnits } from '@/lib/units';
import { AttitudeSlider, useAttitude } from './AttitudeSlider';

export function SettingsPane({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { unit, setUnit } = useUnits();
  const [attitude, setAttitude] = useAttitude();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Settings">
      <div className="settings-pane" onClick={e => e.stopPropagation()}>
        <div className="settings-head">
          <h2>Settings</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="settings-section">
          <div className="settings-label">Units</div>
          <div className="unit-toggle" role="group" aria-label="Units">
            <button className={unit === 'metric' ? 'is-active' : ''} onClick={() => setUnit('metric')}>°C · km/h</button>
            <button className={unit === 'imperial' ? 'is-active' : ''} onClick={() => setUnit('imperial')}>°F · mph</button>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-label">Attitude</div>
          <div className="settings-hint">How sassy should the tomato be?</div>
          <AttitudeSlider value={attitude} onChange={setAttitude} />
        </div>

        <div className="settings-section">
          <div className="settings-label">About</div>
          <div className="settings-hint">
            Tomato — weather, with attitude.<br />
            Data: Open-Meteo, Met.no, RainViewer, OpenWeatherMap.<br />
            Built by <a href="https://taymaerz.de" target="_blank" rel="noopener noreferrer">Tay</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
