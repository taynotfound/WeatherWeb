// Astronomy helpers — moon phase (Conway approximation) + golden hour windows.

const PHASES = [
  { name: 'New Moon', glyph: '🌑' },
  { name: 'Waxing Crescent', glyph: '🌒' },
  { name: 'First Quarter', glyph: '🌓' },
  { name: 'Waxing Gibbous', glyph: '🌔' },
  { name: 'Full Moon', glyph: '🌕' },
  { name: 'Waning Gibbous', glyph: '🌖' },
  { name: 'Last Quarter', glyph: '🌗' },
  { name: 'Waning Crescent', glyph: '🌘' },
] as const;

export function moonPhase(date: Date = new Date()) {
  // Conway's algorithm — fast moon-age approximation, accurate to ~1 day.
  let y = date.getUTCFullYear();
  let m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  if (m < 3) { y -= 1; m += 12; }
  const a = Math.floor(y / 100);
  const b = Math.floor(a / 4);
  const c = 2 - a + b;
  const e = Math.floor(365.25 * (y + 4716));
  const f = Math.floor(30.6001 * (m + 1));
  const jd = c + d + e + f - 1524.5;
  const daysSinceNew = jd - 2451549.5;
  const synodic = 29.53058867;
  let age = daysSinceNew % synodic;
  if (age < 0) age += synodic;
  const illum = (1 - Math.cos((2 * Math.PI * age) / synodic)) / 2;
  const idx = Math.round((age / synodic) * 8) % 8;
  return {
    age: Math.round(age * 10) / 10,
    illumination: Math.round(illum * 100),
    name: PHASES[idx].name,
    glyph: PHASES[idx].glyph,
  };
}

// Golden hour ≈ 1 hour around sunrise/sunset (sun altitude < 6°).
export function goldenHour(sunriseISO: string, sunsetISO: string) {
  const sr = new Date(sunriseISO);
  const ss = new Date(sunsetISO);
  return {
    morningStart: sr,
    morningEnd: new Date(sr.getTime() + 60 * 60 * 1000),
    eveningStart: new Date(ss.getTime() - 60 * 60 * 1000),
    eveningEnd: ss,
  };
}

// Blue hour: ~10–30 min before sunrise / after sunset.
export function blueHour(sunriseISO: string, sunsetISO: string) {
  const sr = new Date(sunriseISO);
  const ss = new Date(sunsetISO);
  return {
    morningStart: new Date(sr.getTime() - 30 * 60 * 1000),
    morningEnd: new Date(sr.getTime() - 10 * 60 * 1000),
    eveningStart: new Date(ss.getTime() + 10 * 60 * 1000),
    eveningEnd: new Date(ss.getTime() + 30 * 60 * 1000),
  };
}

export function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
