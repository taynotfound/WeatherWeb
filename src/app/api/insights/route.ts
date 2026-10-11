// AI Insights: short weather summary via openrouter/free. 2h cache.
import { NextRequest, NextResponse } from 'next/server';

import { complete } from '@/lib/ai';

export const maxDuration = 30;

function slim(w: any, imperial: boolean) {
  const T = (c: any) => (typeof c === 'number' ? Math.round(imperial ? c * 9 / 5 + 32 : c) : null);
  const S = (k: any) => (typeof k === 'number' ? Math.round(imperial ? k * 0.621371 : k) : null);
  const c = w?.current ?? {}, h = w?.hourly ?? {}, d = w?.daily ?? {};
  return {
    units: imperial ? { temp: '°F', wind: 'mph' } : { temp: '°C', wind: 'km/h' },
    place: w?.location?.name,
    now: { temp: T(c.temperatureC), feelsLike: T(c.feelsLikeC), condition: c.conditionLabel, wind: S(c.windKmh), gust: S(c.windGustKmh), humidity: Math.round(c.humidity ?? 0), uv: Math.round(c.uvIndex ?? 0), isDay: c.isDay },
    today: { high: T(d.temperature_2m_max?.[0]), low: T(d.temperature_2m_min?.[0]), rainChance: d.precipitation_probability_max?.[0] },
    next12h: { temp: h.temperature_2m?.slice(0, 12).map(T), rainChance: h.precipitation_probability?.slice(0, 12) },
  };
}

const SYSTEM = `You are a weather assistant.
Output exactly 3 short lines, separated by newlines. Each line under 110 characters. No markdown, no bullets, no numbering, no preamble.

Line 1: current conditions (temp + feels-like + sky).
Line 2: what's coming in the next 24 hours (rain, wind, storm timing).
Line 3: one practical suggestion (clothing, plans, UV, AQI, or alert).

If the JSON has alerts, lead with the most severe one. Use only numbers from the JSON and the units given in "units". Never drop a number or its unit.`;

type Cached = { at: number; payload: any };
const CACHE = new Map<string, Cached>();
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function cacheKey(weather: any, unit?: string) {
  const lat = Math.round((weather?.location?.latitude ?? 0) * 10) / 10;
  const lon = Math.round((weather?.location?.longitude ?? 0) * 10) / 10;
  return `${lat},${lon}`;
}

export async function POST(req: NextRequest) {
  try {
    const { weather, alerts, air, unit } = await req.json();
    const imperial = unit === 'imperial';

    const key = cacheKey(weather, unit);
    const hit = CACHE.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) {
      return NextResponse.json(
        { ...hit.payload, cached: true },
        { headers: { 'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=14400' } }
      );
    }

    const raw = await complete(
      [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: JSON.stringify({ weather: slim(weather, imperial), alerts, air }).slice(0, 4000) },
      ],
      { maxTokens: 220, temperature: 0.4 }
    );
    const insights = (raw ?? '').split(/\n+/).map((s) => s.replace(/^(?:[-*•]\s+|\d+[.)]\s+)/, '').trim()).filter(Boolean).slice(0, 3);

    const payload = { insights, generated: new Date().toISOString() };
    if (insights.length) CACHE.set(key, { at: Date.now(), payload });
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=14400' },
    });
  } catch (e: any) {
    return NextResponse.json({ insights: [], error: e?.message }, { status: 200 });
  }
}
