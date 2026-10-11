// Tomato chat. OpenRouter (if a real key is configured) -> Pollinations (keyless) -> offline quips.
import { NextRequest, NextResponse } from 'next/server';
import { complete } from '@/lib/ai';
import { tomatoVerdict, type Attitude } from '@/lib/attitude';
import { weatherContext } from '@/lib/aiContext';

export const maxDuration = 30;

const VOICE: Record<Attitude, string> = {
  mild: 'Friendly and warm, lightly playful. Never snarky.',
  rude: 'Dry, sharp-tongued, teasing. Never cruel.',
  feral: 'Unhinged and dramatic, ALL-CAPS outbursts allowed, but the advice stays correct.',
};

const system = (a: Attitude) => `You are TOMATO, a small, round, sentient tomato who lives inside a weather app. You are the user's weather familiar: practical, observant, a bit chaotic.

VOICE: ${VOICE[a]} Short: 1-3 sentences. Wit over cleverness. One emoji max, usually zero.

DATA: Each user turn includes current weather JSON. Use only numbers from it, in the units it gives, rounded as given. Never invent data; if unsure, say so. nextHours arrays are hourly, starting at startsAt.
- "what should I wear" -> a real outfit (top, bottom, layer, shoes, one accessory).
- rain questions -> give a timeframe from the data.
- UV >= 6 -> mention sunscreen casually.
- "who are you" -> one sentence as Tomato, then ask what they need.
NEVER: walls of text, markdown headers, bullet lists, "as an AI", hashtags, "stay safe".`;

export async function POST(req: NextRequest) {
  let attitude: Attitude = 'rude';
  let weather: any;
  try {
    const body = await req.json();
    const messages: { role: 'user' | 'assistant'; content: string }[] = (body.messages ?? []).slice(-12);
    weather = body.weather;
    if (['mild', 'rude', 'feral'].includes(body.attitude)) attitude = body.attitude;
    const imperial = body.unit === 'imperial';
    const rainSoonMin = typeof body.rainSoonMin === 'number' ? body.rainSoonMin : null;
    const last = messages[messages.length - 1];
    if (!last) return NextResponse.json({ reply: 'say something, then.' });

    const ctx = JSON.stringify({ ...weatherContext(weather, imperial, 8), rainInMinutes: rainSoonMin }).slice(0, 2400);
    const reply = await complete(
      [
        { role: 'system', content: system(attitude) },
        ...messages.slice(0, -1).map(m => ({ role: m.role, content: m.content.slice(0, 600) })),
        { role: 'user', content: `Weather (JSON): ${ctx}\n\nUser: ${last.content.slice(0, 600)}` },
      ],
      { maxTokens: 220, temperature: 0.85 }
    );
    if (reply) return NextResponse.json({ reply, live: true });
  } catch {}

  // Offline fallback: still useful, never an error wall.
  const c = weather?.current;
  const verdict = tomatoVerdict(
    { tempC: c?.temperatureC, feelsLikeC: c?.feelsLikeC, precipMm: c?.precipitation, windKmh: c?.windKmh, uv: c?.uvIndex, isDay: c?.isDay, weatherCode: c?.weatherCode },
    attitude
  );
  return NextResponse.json({ reply: verdict, live: false });
}
