'use client';

import { useEffect, useState } from 'react';
import type { Attitude } from '@/lib/attitude';
import { ATTITUDE_LABELS } from '@/lib/attitude';

const KEY = 'tomato-attitude';

export function useAttitude(): [Attitude, (a: Attitude) => void] {
  const [att, setAtt] = useState<Attitude>('rude');
  useEffect(() => {
    const v = (typeof localStorage !== 'undefined' && localStorage.getItem(KEY)) as Attitude | null;
    if (v === 'mild' || v === 'rude' || v === 'feral') setAtt(v);
  }, []);
  const set = (a: Attitude) => {
    setAtt(a);
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, a);
  };
  return [att, set];
}

export function AttitudeSlider({ value, onChange }: { value: Attitude; onChange: (a: Attitude) => void }) {
  const opts: Attitude[] = ['mild', 'rude', 'feral'];
  return (
    <div className="attitude-slider" role="radiogroup" aria-label="Tomato attitude">
      {opts.map(o => (
        <button
          key={o}
          role="radio"
          aria-checked={value === o}
          className={`attitude-slider__opt ${value === o ? 'attitude-slider__opt--active' : ''}`}
          onClick={() => onChange(o)}
        >
          {ATTITUDE_LABELS[o]}
        </button>
      ))}
    </div>
  );
}
