'use client';

import { useEffect } from 'react';
import { X, Github, Heart } from 'lucide-react';
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
    <div className="share-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Settings">
      <div className="share-modal" onClick={e => e.stopPropagation()}>
        <div className="share-modal__head">
          <span className="share-modal__title">Settings</span>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="settings-block">
          <div className="settings-block__label">Units</div>
          <div className="unit-toggle" role="group" aria-label="Units">
            <button className={unit === 'metric' ? 'is-active' : ''} onClick={() => setUnit('metric')}>°C · km/h</button>
            <button className={unit === 'imperial' ? 'is-active' : ''} onClick={() => setUnit('imperial')}>°F · mph</button>
          </div>
        </div>

        <div className="settings-block">
          <div className="settings-block__label">Attitude</div>
          <div className="settings-block__hint">How sassy should the tomato be?</div>
          <AttitudeSlider value={attitude} onChange={setAttitude} />
        </div>

        <div className="settings-block settings-block--about">
          <div className="settings-about">
            <div className="settings-about__brand">🍅 Tomato Weather</div>
            <div className="settings-about__tagline">weather, with attitude</div>
            <div className="settings-about__line">Data: Open-Meteo · Met.no · RainViewer · OpenWeatherMap</div>
            <div className="settings-about__line">
              built with <Heart size={11} style={{ display: 'inline', verticalAlign: '-1px', color: '#ff9e64' }} /> by{' '}
              <a href="https://taymaerz.de" target="_blank" rel="noopener noreferrer">Tay</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
