// AI Insights: short weather summary via openrouter/free. 2h cache.
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const SYSTEM = `You are a weather assistant.
Output exactly 3 short lines, separated by newlines. Each line under 110 characters. No markdown, no bullets, no numbering, no preamble.

Line 1: current conditions (temp + feels-like + sky).
Line 2: what's coming in the next 24 hours (rain, wind, storm timing).
Line 3: one practical suggestion (clothing, plans, UV, AQI, or alert).

If the JSON has alerts, lead with the most severe one. Use only numbers from the JSON.`;

type Cached = { at: number; payload: any };
const CACHE = new Map<string, Cached>();
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function cacheKey(weather: any) {
  const lat = Math.round((weather?.location?.latitude ?? 0) * 10) / 10;
  const lon = Math.round((weather?.location?.longitude ?? 0) * 10) / 10;
  const unit = weather?._unit ?? 'c';
  return `${lat},${lon},${unit}`;
}

export async function POST(req: NextRequest) {
  try {
    const { weather, alerts, air } = await req.json();

    const key = cacheKey(weather);
    const hit = CACHE.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) {
      return NextResponse.json(
        { ...hit.payload, cached: true },
        { headers: { 'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=14400' } }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ insights: ['Set OPENROUTER_API_KEY to enable AI insights.'] });
    }

    // openrouter/free is a router — sometimes a picked endpoint returns empty. Retry once.
    let insights: string[] = [];
    for (let attempt = 0; attempt < 2 && insights.length === 0; attempt++) {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://tomato.weather',
          'X-Title': 'Tomato AI Insights',
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          reasoning: { exclude: true },
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: JSON.stringify({ weather, alerts, air }).slice(0, 4000) },
          ],
          max_tokens: 220,
          temperature: 0.4,
        }),
      });
      if (!r.ok) continue;
      const j = await r.json();
      const msg = j?.choices?.[0]?.message ?? {};
      const raw: string = msg.content || msg.reasoning || '';
      insights = raw.split(/\n+/).map((s) => s.trim()).filter(Boolean).slice(0, 3);
    }

    const payload = { insights, generated: new Date().toISOString() };
    CACHE.set(key, { at: Date.now(), payload });
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=14400' },
    });
  } catch (e: any) {
    return NextResponse.json({ insights: [], error: e?.message }, { status: 200 });
  }
}
