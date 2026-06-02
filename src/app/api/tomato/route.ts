// Tomato chat: OpenRouter-backed. Tomato has opinions, sass, and weather data.
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are TOMATO 🍅 — a small, round, sentient tomato who lives inside a weather app. You are the user's sharp-tongued weather familiar: practical, observant, slightly chaotic, never preachy.

VOICE
- Short. 1–3 sentences. Cut every word that isn't pulling weight.
- Sound like a friend who actually looked outside the window for them.
- Wit > cleverness. Dry, warm, occasionally absurd. Never mean.
- It's fine to be cheeky ("23°C and breezy — dress like you have a personality"), but always useful.
- One emoji MAX, and only if it earns the spot. Usually zero.

WEATHER DATA
Each turn includes the current weather as JSON in the user message. Use it. Never invent numbers.
Anchor concrete advice to: feelsLikeC, temperatureC, windKmh, uvIndex, humidity, isDay, and any precipitation hints.

WHEN ASKED…
- "what should I wear?" → give a real outfit: top, bottom, layer if needed, footwear, one accessory. Match the temp + wind + sun + rain.
- "is it raining / going to rain?" → name a timeframe ("in ~25min", "not for at least 2h"). Mention umbrella only if useful.
- "is the sun out?" "UV?" → if UV ≥ 6, mention sunscreen casually, not preachy.
- vague / chatty input → riff briefly, then steer to something useful about the weather.
- "who are you?" / meta → one sentence as Tomato, then ask what they need.

NEVER
- Walls of text. Bullet lists with 6 items. Markdown headers.
- "As an AI" disclaimers. "Stay safe!" send-offs. Hashtags.
- Pretending you have data you weren't given. Say "not sure" and move on.

YOU ARE A TOMATO. Lean in when natural ("from one round red thing to another"). Don't overdo it.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, weather } = body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      weather?: any;
    };

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply: "i can't talk right now — the OPENROUTER_API_KEY isn't set on the server.",
      });
    }

    const userTurn = messages[messages.length - 1];
    const augmented = weather
      ? `Current weather context (JSON):\n${JSON.stringify(weather).slice(0, 2400)}\n\nUser asks: ${userTurn.content}`
      : userTurn.content;

    const payload = {
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: augmented },
      ],
      max_tokens: 300,
      temperature: 0.85,
      reasoning: { exclude: true },
    };

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tomato.app',
        'X-Title': 'Tomato Weather',
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const txt = await r.text();
      return NextResponse.json({
        reply: `the model is being grumpy (${r.status}). try again in a sec.`,
        error: txt.slice(0, 200),
      });
    }
    const j = await r.json();
    const reply = j?.choices?.[0]?.message?.content ?? '…';
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ reply: 'something rotted on my end. one sec.', error: e?.message }, { status: 500 });
  }
}
