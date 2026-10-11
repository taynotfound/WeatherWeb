// Tomato's take: a three-line summary. LLM first (lib/ai), forecast-built lines when that fails, so the card always has something.
import { NextRequest, NextResponse } from 'next/server';

import { complete } from '@/lib/ai';
import { weatherContext } from '@/lib/aiContext';
import { fallbackTake } from '@/lib/takeFallback';
import type { Attitude } from '@/lib/attitude';

export const maxDuration = 30;

const VOICE: Record<Attitude, string> = {
  mild: 'Plain, warm, gently playful.',
  rude: 'Dry and a little cheeky.',
  feral: 'Dramatic and unhinged in tone, but every fact stays accurate.',
};

const system = (a: Attitude) => `You are Tomato, a small red rabbit who forecasts the weather. ${VOICE[a]}
Output exactly 3 short lines separated by newlines. Each line under 100 characters. No markdown, bullets, numbering, labels, emoji or preamble.

The app already shows the current temperature and sky, so do not restate them.
Line 1: the headline for the rest of today, i.e. the one thing that matters most.
Line 2: when things change in the next 12 hours (rain starting/stopping, wind picking up, temperature drop), with local times from nextHours.startsAt.
Line 3: one practical suggestion (clothing, plans, UV, air quality or an alert).

If the JSON has alerts, line 1 is the most severe alert. Use only numbers from the JSON, in its units.`;

// Models drift from the format: labels ("Line 1:"), bullets, quotes, or one paragraph instead of lines.
function parseTake(raw: string): string[] {
  let lines = raw
    .replace(/\*\*|__|`/g, '')
    .split(/\n+/)
    .map(s => s.replace(/^\s*(?:line\s*\d\s*[:.)-]|[-*•]\s+|\d+[.)]\s+|#+\s*)/i, '').replace(/^["“]|["”]$/g, '').trim())
    .filter(s => s && !/^(here(?:'s| is| are)|sure|okay)\b/i.test(s));
  if (lines.length === 1) lines = lines[0].match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()) ?? lines;
  return lines.filter(s => s.length <= 180).slice(0, 3);
}

type Cached = { at: number; ttl: number; payload: { insights: string[]; live: boolean; generated: string } };
const CACHE = new Map<string, Cached>();
const INFLIGHT = new Map<string, Promise<Cached['payload']>>();
const LIVE_TTL = 2 * 60 * 60_000;
const FALLBACK_TTL = 3 * 60_000; // retry the LLM soon after a miss, but don't hammer it

export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const { weather, air, unit, fresh } = body;
  const attitude: Attitude = ['mild', 'rude', 'feral'].includes(body.attitude) ? body.attitude : 'rude';
  const imperial = unit === 'imperial';
  const alerts = Array.isArray(body.alerts) ? body.alerts.slice(0, 2).map((a: any) => ({ event: a?.event, severity: a?.severity, headline: a?.headline })) : [];
  const ctx = weatherContext(weather, imperial, 12);
  if (!ctx) return NextResponse.json({ insights: [], live: false, error: 'no weather' });

  const lat = Math.round((weather?.location?.latitude ?? 0) * 10) / 10;
  const lon = Math.round((weather?.location?.longitude ?? 0) * 10) / 10;
  const key = `${lat},${lon},${imperial ? 'f' : 'c'},${attitude}`;

  const hit = CACHE.get(key);
  // "fresh" (the refresh button) may skip a live answer only once it's a few minutes old
  if (hit && Date.now() - hit.at < hit.ttl && !(fresh && hit.payload.live && Date.now() - hit.at > 5 * 60_000)) {
    return NextResponse.json({ ...hit.payload, cached: true });
  }

  // Concurrent requests for the same place share one LLM call.
  let job = INFLIGHT.get(key);
  if (!job) {
    job = (async () => {
      const aqi = air?.us_aqi ?? air?.eu_aqi;
      const raw = await complete(
        [
          { role: 'system', content: system(attitude) },
          { role: 'user', content: JSON.stringify({ weather: ctx, alerts, air: typeof aqi === 'number' ? { aqi: Math.round(aqi), label: air?.label, pollenTop: air?.pollen?.top } : undefined }) },
        ],
        { maxTokens: 220, temperature: 0.5, accept: t => parseTake(t).length >= 2 }
      );
      const live = raw ? parseTake(raw) : [];
      const payload = live.length >= 2
        ? { insights: live, live: true, generated: new Date().toISOString() }
        : { insights: fallbackTake(ctx, alerts), live: false, generated: new Date().toISOString() };
      CACHE.set(key, { at: Date.now(), ttl: payload.live ? LIVE_TTL : FALLBACK_TTL, payload });
      if (CACHE.size > 500) CACHE.delete(CACHE.keys().next().value!);
      return payload;
    })().finally(() => INFLIGHT.delete(key));
    INFLIGHT.set(key, job);
  }
  try {
    return NextResponse.json(await job);
  } catch {
    return NextResponse.json({ insights: fallbackTake(ctx, alerts), live: false, generated: new Date().toISOString() });
  }
}
