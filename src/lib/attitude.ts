// Tomato attitude: mild / rude / feral. Picks a one-liner verdict from weather state.

export type Attitude = 'mild' | 'rude' | 'feral';

type State = {
  tempC?: number | null;
  feelsLikeC?: number | null;
  precipMm?: number | null;
  precipProb?: number | null;
  windKmh?: number | null;
  uv?: number | null;
  isDay?: boolean;
  rainSoonMin?: number | null;
  weatherCode?: number | null;
};

const MILD = {
  rainSoon: (m: number) => `Rain expected in about ${m} min.`,
  rainingNow: 'Currently raining.',
  hot: 'Warm out — stay hydrated.',
  cold: 'Bundle up out there.',
  freezing: 'Below freezing.',
  windy: 'Windy conditions.',
  clearDay: 'Clear and pleasant.',
  clearNight: 'Clear night sky.',
  cloudy: 'Overcast.',
  uv: 'High UV — sunscreen advised.',
  storm: 'Thunderstorm in the area.',
  fine: 'Nothing remarkable.',
};

const RUDE = {
  rainSoon: (m: number) => `Sky's about to ruin your day in ~${m} min.`,
  rainingNow: 'It is raining. Yes, on you.',
  hot: 'Hot. Drink water before you become a raisin.',
  cold: 'Cold. Wear actual clothes.',
  freezing: 'Below zero. This is not the time for cute outfits.',
  windy: 'Wind is uncomfortably opinionated today.',
  clearDay: 'Outside is doing its best. Try to match it.',
  clearNight: 'The sky is clear. Touch grass under stars.',
  cloudy: 'Sky\'s doing that grey thing again.',
  uv: 'UV is committing crimes. SPF or regret.',
  storm: 'Thunderstorm. Maybe stop holding metal objects.',
  fine: 'Weather is fine. Find something else to be dramatic about.',
};

const FERAL = {
  rainSoon: (m: number) => `${m} min until the sky pukes on you. Run.`,
  rainingNow: 'IT\'S RAINING. Become one with the moisture.',
  hot: 'Volcano weather. Marinate in your own juices.',
  cold: 'It\'s freezing. Your nipples could cut diamond.',
  freezing: 'SUB-ZERO. Pretend you\'re a Siberian witch.',
  windy: 'Wind speaks in tongues. Do not engage.',
  clearDay: 'Sky is flexing. Go outside and lose.',
  clearNight: 'Stars are out. Howl at something.',
  cloudy: 'Sky is a dirty grey rag. Same energy as us.',
  uv: 'UV index says "I dare you." Wear SPF or perish.',
  storm: 'THUNDER. The gods are arguing about you.',
  fine: 'Boring weather. Manifest chaos.',
};

const PACKS = { mild: MILD, rude: RUDE, feral: FERAL };

export function tomatoVerdict(state: State, attitude: Attitude = 'rude'): string {
  const p = PACKS[attitude];
  const t = state.feelsLikeC ?? state.tempC ?? null;
  const code = state.weatherCode ?? null;
  const precip = state.precipMm ?? 0;
  const rainSoon = state.rainSoonMin;
  const wind = state.windKmh ?? 0;
  const uv = state.uv ?? 0;

  // Priority: storm > rain soon/now > extreme temp > wind > UV > generic
  if (code != null && [95, 96, 99].includes(code)) return p.storm;
  if (typeof rainSoon === 'number' && rainSoon > 0 && rainSoon < 60) return p.rainSoon(rainSoon);
  if (precip > 0.1) return p.rainingNow;
  if (t != null && t < -2) return p.freezing;
  if (t != null && t < 4) return p.cold;
  if (t != null && t > 30) return p.hot;
  if (wind > 35) return p.windy;
  if (uv > 7 && state.isDay !== false) return p.uv;
  if (code != null && code <= 1) return state.isDay === false ? p.clearNight : p.clearDay;
  if (code != null && code >= 2 && code <= 3) return p.cloudy;
  return p.fine;
}

export const ATTITUDE_LABELS: Record<Attitude, string> = {
  mild: '😇 mild',
  rude: '😏 rude',
  feral: '😈 feral',
};
