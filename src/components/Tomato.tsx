// The Tomato mark + mascot. Same geometry as public/tomato.svg; the mascot adds a face whose mood follows the sky.
import { useId, type CSSProperties } from 'react';

export type Mood = 'happy' | 'shades' | 'sleepy' | 'meh' | 'wet' | 'cold' | 'hot' | 'think';

export function moodFor(c: { weatherCode?: number; isDay?: boolean; temperatureC?: number; feelsLikeC?: number; precipitation?: number } | undefined): Mood {
  if (!c) return 'happy';
  const code = c.weatherCode ?? 0, t = c.feelsLikeC ?? c.temperatureC ?? 15;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95 || (c.precipitation ?? 0) > 0.1) return 'wet';
  if (t <= 2) return 'cold';
  if (t >= 30) return 'hot';
  if (!c.isDay) return 'sleepy';
  if (code <= 1) return 'shades';
  if (code === 3 || code === 45 || code === 48) return 'meh';
  return 'happy';
}

// Body: a plump, slightly lopsided tomato with a soft top dimple.
export const BODY = 'M64 33c18-6 46 4 52 34 6 30-14 53-52 53S6 97 12 67c6-30 34-40 52-34z';
// Calyx: five pointed sepals with a rounded hub, plus a curled stem.
export const CALYX = 'M64 40c-6 0-12-2-16-6 6 0 10-1 12-4-8-2-16-1-24 4 6-9 16-13 25-11-4-4-5-9-4-15 5 5 9 9 11 13 2-4 6-8 11-13 1 6 0 11-4 15 9-2 19 2 25 11-8-5-16-6-24-4 2 3 6 4 12 4-4 4-10 6-16 6z';
export const STEM = 'M64 30c-1-8 1-15 8-20';

export function TomatoMark({ size = 40, face = false, mood = 'happy', className, style, title }: {
  size?: number; face?: boolean; mood?: Mood; className?: string; style?: CSSProperties; title?: string;
}) {
  // unique per instance: a duplicate gradient id inside a display:none subtree renders as no fill
  const id = 'tm' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className} style={style} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <radialGradient id={`${id}b`} cx=".34" cy=".36" r=".78">
          <stop offset="0" stopColor="#ff7a55" /><stop offset=".55" stopColor="#ec3b25" /><stop offset="1" stopColor="#b5180f" />
        </radialGradient>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5fcf6e" /><stop offset="1" stopColor="#24924a" />
        </linearGradient>
      </defs>
      <path d={BODY} fill={`url(#${id}b)`} />
      {/* soft lobes */}
      <path d="M46 40c-10 18-10 52 2 76M82 40c10 18 10 52-2 76" fill="none" stroke="#9d1209" strokeOpacity=".22" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="38" cy="58" rx="11" ry="6.5" transform="rotate(-38 38 58)" fill="#fff" opacity=".5" />
      <circle cx="31" cy="72" r="3" fill="#fff" opacity=".35" />
      <path d={STEM} fill="none" stroke="#1f7a3c" strokeWidth="6" strokeLinecap="round" />
      <path d={CALYX} fill={`url(#${id}l)`} />
      {face && <Face mood={mood} />}
    </svg>
  );
}

function Face({ mood }: { mood: Mood }) {
  const ink = '#3a0d08';
  const eyes = mood === 'sleepy'
    ? <g fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round"><path d="M44 80q6 5 12 0" /><path d="M72 80q6 5 12 0" /></g>
    : mood === 'shades'
      ? <g><path d="M38 72h52v4c0 8-5 12-12 12s-11-4-12-10h-4c-1 6-5 10-12 10s-12-4-12-12z" fill="#1d1d24" /><path d="M42 75h12M74 75h12" stroke="#fff" strokeOpacity=".35" strokeWidth="2.5" strokeLinecap="round" /></g>
      : <g fill={ink}>
          <ellipse cx="50" cy="79" rx="5" ry={mood === 'meh' ? 4 : 6.5} /><ellipse cx="78" cy="79" rx="5" ry={mood === 'meh' ? 4 : 6.5} />
          <circle cx="52" cy="76.5" r="1.8" fill="#fff" /><circle cx="80" cy="76.5" r="1.8" fill="#fff" />
          {mood === 'meh' && <path d="M43 72l13 2M85 72l-13 2" stroke={ink} strokeWidth="3" strokeLinecap="round" />}
          {mood === 'think' && <path d="M44 69q6-4 12-1M72 68q6-3 12 1" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />}
        </g>;
  const mouth =
    mood === 'meh' ? <path d="M58 96h12" stroke={ink} strokeWidth="3.5" strokeLinecap="round" /> :
    mood === 'cold' ? <path d="M56 97l4-3 4 3 4-3 4 3" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> :
    mood === 'hot' ? <path d="M56 92q8 10 16 0z" fill={ink} /> :
    mood === 'think' ? <circle cx="66" cy="96" r="3.5" fill={ink} /> :
    mood === 'sleepy' ? <ellipse cx="64" cy="96" rx="3.5" ry="2.5" fill={ink} /> :
    <path d="M56 93q8 8 16 0" fill="none" stroke={ink} strokeWidth="3.5" strokeLinecap="round" />;
  return (
    <g>
      <ellipse cx="40" cy="91" rx="7" ry="4.5" fill={mood === 'cold' ? '#9fd3ff' : '#ff9d8a'} opacity=".7" />
      <ellipse cx="88" cy="91" rx="7" ry="4.5" fill={mood === 'cold' ? '#9fd3ff' : '#ff9d8a'} opacity=".7" />
      {eyes}{mouth}
      {mood === 'wet' && <path d="M100 52c4 6 6 9 6 12a6 6 0 0 1-12 0c0-3 2-6 6-12z" fill="#7cc4ff" stroke="#fff" strokeWidth="1.5" />}
      {mood === 'hot' && <path d="M24 56c3 5 4 7 4 9a4 4 0 0 1-8 0c0-2 1-4 4-9z" fill="#9fd8ff" />}
      {mood === 'sleepy' && <text x="96" y="50" fontSize="16" fontWeight="700" fill="currentColor" opacity=".7" fontFamily="system-ui">z</text>}
    </g>
  );
}
