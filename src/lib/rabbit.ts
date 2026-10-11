// Tomato the red rabbit, as SVG markup. One source for the React mascot, the static icons
// (scripts/gen-icons.mjs) and the share card canvas, so they can never drift apart.
// No imports: scripts/gen-icons.mjs loads this file directly with Node's type stripping.

export type Mood = 'happy' | 'shades' | 'sleepy' | 'meh' | 'wet' | 'cold' | 'hot' | 'think';

/** The mascot's mood from current conditions. */
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

const INK = '#3a0d08';
const NOSE = '#ffb8c4';

// Right ear tilt per mood (degrees, around the ear's base). Droopy ear = low spirits.
const RIGHT_EAR: Record<Mood, number> = { happy: 14, shades: 20, sleepy: 46, meh: 38, wet: 42, cold: 6, hot: 30, think: 26 };
const LEFT_EAR: Partial<Record<Mood, number>> = { cold: -6, shades: -18, sleepy: -20 };

const ear = (x: number, deg: number, id: string, side: 'l' | 'r') =>
  `<g transform="rotate(${deg} ${x} 58)"><g class="ear ear-${side}">` +
  `<ellipse cx="${x}" cy="33" rx="12.5" ry="27" fill="url(#${id}e)"/>` +
  `<ellipse cx="${x}" cy="36" rx="5.8" ry="18" fill="${NOSE}" opacity=".85"/></g></g>`;

function face(mood: Mood, whiskers: boolean) {
  const nose = `<path d="M59.5 91h9c1.1 0 1.7 1.2 1 2l-4.5 4.3a1.4 1.4 0 0 1-2 0L58.5 93c-.7-.8-.1-2 1-2z" fill="${NOSE}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;
  const eyes =
    mood === 'sleepy'
      ? `<g fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"><path d="M42 82q6 5 12 0"/><path d="M74 82q6 5 12 0"/></g>`
      : mood === 'shades'
        ? `<path d="M35 74h58v4c0 8-5 12-13 12s-12-4-13-10h-6c-1 6-5 10-13 10s-13-4-13-12z" fill="#1d1d24"/><path d="M40 77h12M72 77h12" stroke="#fff" stroke-opacity=".35" stroke-width="2.5" stroke-linecap="round"/>`
        : `<g fill="${INK}"><ellipse cx="48" cy="81" rx="5" ry="${mood === 'meh' ? 4 : 6.5}"/><ellipse cx="80" cy="81" rx="5" ry="${mood === 'meh' ? 4 : 6.5}"/></g>` +
          `<circle cx="50" cy="78.5" r="1.8" fill="#fff"/><circle cx="82" cy="78.5" r="1.8" fill="#fff"/>` +
          (mood === 'meh' ? `<path d="M41 73l13 2M87 73l-13 2" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` : '') +
          (mood === 'think' ? `<path d="M42 70q6-4 12-1M74 69q6-3 12 1" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>` : '');
  const mouth =
    mood === 'meh' ? `<path d="M58 102h12" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>` :
    mood === 'cold' ? `<path d="M56 103l4-3 4 3 4-3 4 3" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` :
    mood === 'hot' ? `<path d="M64 97.5v2"  stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M57 100q7 10 14 0z" fill="${INK}"/><path d="M61 104q3 3 6 0" fill="#ff7d8e"/>` :
    mood === 'think' ? `<circle cx="66" cy="103" r="3.2" fill="${INK}"/>` :
    mood === 'sleepy' ? `<ellipse cx="64" cy="103" rx="3.5" ry="2.5" fill="${INK}"/>` :
    `<path d="M64 97.5v3.5M64 101q-4 5-9 2M64 101q4 5 9 2" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  const cheek = mood === 'cold' ? '#9fd3ff' : '#ff9d8a';
  const wh = whiskers
    ? `<g stroke="${INK}" stroke-opacity=".38" stroke-width="2" stroke-linecap="round"><path d="M31 93L15 90M31 98l-15 2M97 93l16-3M97 98l15 2"/></g>`
    : '';
  const extra =
    (mood === 'wet' ? `<path d="M110 60c4 6 6 9 6 12a6 6 0 0 1-12 0c0-3 2-6 6-12z" fill="#7cc4ff" stroke="#fff" stroke-width="1.5"/>` : '') +
    (mood === 'hot' ? `<path d="M18 64c3 5 4 7 4 9a4 4 0 0 1-8 0c0-2 1-4 4-9z" fill="#9fd8ff"/>` : '') +
    (mood === 'cold' ? `<path d="M27 106q37 12 74 0l-1 9q-36 10-72 0z" fill="#3c6dd8"/><path d="M82 111l7 13h-9l-3-11z" fill="#2f58b4"/>` : '') +
    (mood === 'sleepy' ? `<text x="8" y="52" font-size="17" font-weight="700" fill="currentColor" opacity=".7" font-family="system-ui,sans-serif">z</text>` : '');
  return `<ellipse cx="36" cy="96" rx="7" ry="4.5" fill="${cheek}" opacity=".7"/><ellipse cx="92" cy="96" rx="7" ry="4.5" fill="${cheek}" opacity=".7"/>` +
    wh + eyes + nose + mouth + extra;
}

/** Inner markup for a 128x128 viewBox. `id` must be unique per document (gradient refs). */
export function rabbitSvg({ id = 'tr', face: withFace = false, mood = 'happy', whiskers = false }: { id?: string; face?: boolean; mood?: Mood; whiskers?: boolean } = {}) {
  const r = withFace ? RIGHT_EAR[mood] : 14;
  const l = withFace ? (LEFT_EAR[mood] ?? -14) : -14;
  return `<defs>` +
    `<radialGradient id="${id}b" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#ff7a5c"/><stop offset=".55" stop-color="#e8392a"/><stop offset="1" stop-color="#b3170f"/></radialGradient>` +
    `<linearGradient id="${id}e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f45a40"/><stop offset="1" stop-color="#c22216"/></linearGradient>` +
    `</defs>` +
    ear(46, l, id, 'l') + ear(82, r, id, 'r') +
    `<ellipse cx="64" cy="83" rx="46" ry="37" fill="url(#${id}b)"/>` +
    `<ellipse cx="64" cy="100" rx="18" ry="12" fill="#fff" opacity=".16"/>` +
    `<ellipse cx="38" cy="64" rx="11" ry="6" transform="rotate(-32 38 64)" fill="#fff" opacity=".45"/>` +
    `<circle cx="29" cy="77" r="3" fill="#fff" opacity=".32"/>` +
    (withFace
      ? face(mood, whiskers)
      : `<g fill="${INK}"><ellipse cx="48" cy="81" rx="5" ry="6.5"/><ellipse cx="80" cy="81" rx="5" ry="6.5"/></g>` +
        `<path d="M59.5 91h9c1.1 0 1.7 1.2 1 2l-4.5 4.3a1.4 1.4 0 0 1-2 0L58.5 93c-.7-.8-.1-2 1-2z" fill="${NOSE}"/>`);
}

/** A standalone SVG document (static icons, canvas images). */
export const rabbitDoc = (opts: Parameters<typeof rabbitSvg>[0] = {}, size?: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"${size ? ` width="${size}" height="${size}"` : ''}>${rabbitSvg(opts)}</svg>`;
