// Chat completion with a fallback chain: OpenRouter (if a real key is set) -> Pollinations (keyless).
import { env } from './env';

type Msg = { role: 'system' | 'user' | 'assistant'; content: string };

async function openrouter(messages: Msg[], max_tokens: number, temperature: number, key: string) {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://tomato.app',
      'X-Title': 'Tomato Weather',
    },
    body: JSON.stringify({ model: 'openrouter/free', messages, max_tokens, temperature, reasoning: { exclude: true } }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!r.ok) throw new Error(`openrouter ${r.status}`);
  const j = await r.json();
  return (j?.choices?.[0]?.message?.content as string) || '';
}

async function pollinations(messages: Msg[], max_tokens: number, temperature: number) {
  const r = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai', messages, max_tokens, temperature }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!r.ok) throw new Error(`pollinations ${r.status}`);
  const j = await r.json();
  return (j?.choices?.[0]?.message?.content as string) || '';
}

export async function complete(messages: Msg[], opts: { maxTokens?: number; temperature?: number } = {}) {
  const max = opts.maxTokens ?? 300;
  const temp = opts.temperature ?? 0.8;
  const key = env.aiKey();
  if (key) {
    try { const t = await openrouter(messages, max, temp, key); if (t.trim()) return t.trim(); } catch {}
  }
  try { const t = await pollinations(messages, max + 200, temp); if (t.trim()) return t.trim(); } catch {}
  return null;
}
