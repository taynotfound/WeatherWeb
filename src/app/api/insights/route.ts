// AI Insights: short weather summary via openrouter/free. 2h cache.
import { NextRequest, NextResponse } from 'next/server';

import { complete } from '@/lib/ai';
import { weatherContext } from '@/lib/aiContext';

export const maxDuration = 30;

const SYSTEM = `You are Tomato, a small, opinionated tomato who forecasts the weather. Plain, warm, a little cheeky.
Output exactly 3 short lines separated by newlines. Each line under 100 characters. No markdown, bullets, numbering, emoji or preamble.

The app already shows the current temperature and sky, so do not restate them.
Line 1: the headline for the rest of today, i.e. the one thing that matters most.
Line 2: when things change in the next 12 hours (rain starting/stopping, wind picking up, temperature drop), with local times from nextHours.startsAt.
Line 3: one practical suggestion (clothing, plans, UV, air quality or an alert).

If the JSON has alerts, line 1 is the most severe alert. Use only numbers from the JSON, in its units.`;

type Cached = { at: number; payload: any };
const CACHE = new Map<string, Cached>();
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function cacheKey(weather: any, unit?: string) {
  const lat = Math.round((weather?.location?.latitude ?? 0) * 10) / 10;
  const lon = Math.round((weather?.location?.longitude ?? 0) * 10) / 10;
  return `${lat},${lon},${unit === 'imperial' ? 'f' : 'c'}`;
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
        { role: 'user', content: JSON.stringify({ weather: weatherContext(weather, imperial, 12), alerts, air }).slice(0, 4000) },
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
