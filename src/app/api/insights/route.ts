// AI Insights: short, structured summary of conditions over the next ~24h.
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const SYSTEM = `You are TOMATO's weather analyst. Output exactly 3 short insights about the next 24 hours, separated by newlines. No headers, no markdown. Each ≤ 110 chars. Anchor everything to the JSON given — never invent numbers. Tone: friendly, sharp, useful. Cover: (1) the headline (temp + feels-like + sky), (2) timing of any rain/storms/wind shift, (3) one actionable suggestion (clothing, plans, UV, AQI, or alert advisory). If there are alerts in the JSON, lead with the most severe one.`;

export async function POST(req: NextRequest) {
  try {
    const { weather, alerts, air } = await req.json();
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ insights: ['set OPENROUTER_API_KEY to enable AI insights.'] });
    }

    const context = JSON.stringify({ weather, alerts, air }).slice(0, 3500);

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://tomato.app',
        'X-Title': 'Tomato Weather AI Insights',
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `Context JSON:\n${context}\n\nWrite 3 insights now.` },
        ],
        max_tokens: 220,
        temperature: 0.6,
        reasoning: { exclude: true },
      }),
    });

    if (!r.ok) {
      return NextResponse.json({ insights: [], error: `model ${r.status}` }, { status: 200 });
    }
    const j = await r.json();
    const raw: string = j?.choices?.[0]?.message?.content ?? '';
    const insights = raw
      .split(/\n+/)
      .map((s) => s.replace(/^[\s\-\*\d.\)]+/, '').trim())
      .filter(Boolean)
      .slice(0, 3);

    return NextResponse.json(
      { insights, generated: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800' } }
    );
  } catch (e: any) {
    return NextResponse.json({ insights: [], error: e?.message }, { status: 200 });
  }
}
