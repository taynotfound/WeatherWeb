'use client';

import { useEffect, useState } from 'react';
import { Dialog, Icon, Seg } from './ui';
import { usePrefs } from '@/lib/prefs';
import { useTheme } from '@/lib/theme';
import { ATTITUDE_LABELS, type Attitude } from '@/lib/attitude';

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { unit, setUnit, attitude, setAttitude } = usePrefs();
  const { mode, setMode } = useTheme();
  const [install, setInstall] = useState<any>(null);
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setInstall(e); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);
  return (
    <Dialog title="Settings" icon="settings" onClose={onClose}>
      <div className="col" style={{ gap: 20 }}>
        <div className="setting"><div><div className="title-m">Units</div><div className="body-s muted">Temperature, wind, rain</div></div>
          <Seg value={unit} onChange={setUnit} options={[{ id: 'metric', label: '°C' }, { id: 'imperial', label: '°F' }]} /></div>
        <div className="setting"><div><div className="title-m">Theme</div><div className="body-s muted">Colors always follow the sky</div></div>
          <Seg value={mode} onChange={setMode} options={[{ id: 'auto', label: 'Auto', icon: 'brightness_auto' }, { id: 'light', label: 'Light', icon: 'light_mode' }, { id: 'dark', label: 'Dark', icon: 'dark_mode' }]} /></div>
        <div className="col" style={{ gap: 8 }}>
          <div><div className="title-m">Tomato's attitude</div><div className="body-s muted">How the tomato talks to you</div></div>
          <div className="chips">
            {(Object.keys(ATTITUDE_LABELS) as Attitude[]).map(a => (
              <button key={a} className={`chip state ${attitude === a ? 'selected' : ''}`} onClick={() => setAttitude(a)}>{attitude === a && <Icon name="check" />}{ATTITUDE_LABELS[a]}</button>
            ))}
          </div>
        </div>
        {install && <button className="btn tonal has-icon state" onClick={() => { install.prompt(); setInstall(null); }}><Icon name="install_mobile" />Install Tomato</button>}
        <p className="body-s muted">
          Forecast data: Open-Meteo · MET Norway · WeatherAPI.com · ECMWF/NOAA/DWD models via Open-Meteo. Radar: RainViewer. Satellite: EUMETSAT, Esri. Maps: OpenFreeMap, © OpenStreetMap. Warnings: NWS, Meteoalarm, WeatherAPI.
        </p>
      </div>
    </Dialog>
  );
}
