// Compact, unit-aware weather context for the LLM prompts (Tomato chat + insights).
// Numbers are rounded and converted up front so the model never echoes "10.35 degrees".

const hourIdx = (w: any) => {
  const times: string[] = w?.hourly?.time ?? [];
  const key = (w?.current?.time ?? '').slice(0, 13);
  const i = times.findIndex(t => t.slice(0, 13) === key);
  return i >= 0 ? i : 0;
};

export function weatherContext(w: any, imperial: boolean, hours = 12) {
  if (!w) return null;
  const T = (c: any) => (typeof c === 'number' ? Math.round(imperial ? c * 9 / 5 + 32 : c) : null);
  const S = (k: any) => (typeof k === 'number' ? Math.round(imperial ? k * 0.621371 : k) : null);
  const c = w.current ?? {}, h = w.hourly ?? {}, d = w.daily ?? {};
  const i = hourIdx(w);
  const sl = (a?: any[]) => a?.slice(i, i + hours);
  return {
    units: imperial ? { temp: '°F', wind: 'mph' } : { temp: '°C', wind: 'km/h' },
    place: w.location?.name,
    localTime: c.time?.slice(11, 16),
    now: {
      temp: T(c.temperatureC), feelsLike: T(c.feelsLikeC), condition: c.conditionLabel, wind: S(c.windKmh), gust: S(c.windGustKmh),
      humidity: Math.round(c.humidity ?? 0), uv: Math.round(c.uvIndex ?? 0), isDay: c.isDay, precipMm: c.precipitation,
    },
    today: { high: T(d.temperature_2m_max?.[0]), low: T(d.temperature_2m_min?.[0]), rainChance: d.precipitation_probability_max?.[0], sunset: d.sunset?.[0]?.slice(11, 16) },
    tomorrow: { high: T(d.temperature_2m_max?.[1]), low: T(d.temperature_2m_min?.[1]), rainChance: d.precipitation_probability_max?.[1] },
    nextHours: {
      startsAt: h.time?.[i]?.slice(11, 16),
      temp: sl(h.temperature_2m)?.map(T),
      rainChance: sl(h.precipitation_probability),
      wind: sl(h.wind_speed_10m)?.map(S),
    },
  };
}
