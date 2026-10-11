// Chat completion over two flaky free providers. OpenRouter's free router 502s now and then and
// Pollinations rate-limits (402/429) per IP, so each provider gets its own retry lane and the lanes
// race: OpenRouter starts first, Pollinations joins as a hedge. First usable answer wins, the rest abort.
import { env } from './env';

type Msg = { role: 'system' | 'user' | 'assistant'; content: string };
type Call = (messages: Msg[], maxTokens: number, temperature: number, signal: AbortSignal) => Promise<string>;

const openrouter = (key: string): Call => async (messages, max_tokens, temperature, signal) => {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://tomato.taymaerz.de',
      'X-Title': 'Tomato Weather',
    },
    body: JSON.stringify({ model: 'openrouter/free', messages, max_tokens, temperature, reasoning: { exclude: true } }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(14_000)]),
  });
  if (!r.ok) throw new Error(`openrouter ${r.status}`);
  const j = await r.json();
  return (j?.choices?.[0]?.message?.content as string) || '';
};

// Pollinations serves a reasoning model whose thinking counts against max_tokens, so give it headroom.
const pollinations: Call = async (messages, max_tokens, temperature, signal) => {
  const r = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai', messages, max_tokens: max_tokens + 600, temperature }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(16_000)]),
  });
  if (!r.ok) throw new Error(`pollinations ${r.status}`);
  const j = await r.json();
  return (j?.choices?.[0]?.message?.content as string) || '';
};

const wait = (ms: number, signal: AbortSignal) => new Promise<void>((res, rej) => {
  if (signal.aborted) return rej(signal.reason);
  const t = setTimeout(res, ms);
  signal.addEventListener('abort', () => { clearTimeout(t); rej(signal.reason); }, { once: true });
});

// Some free models leak their reasoning inline.
const clean = (s: string) => s.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^\s*<think>[\s\S]*$/i, '').trim();

export async function complete(messages: Msg[], opts: { maxTokens?: number; temperature?: number; timeoutMs?: number; accept?: (text: string) => boolean } = {}) {
  const max = opts.maxTokens ?? 300;
  const temp = opts.temperature ?? 0.8;
  const ctrl = new AbortController();
  const deadline = setTimeout(() => ctrl.abort(new Error('deadline')), opts.timeoutMs ?? 24_000);
  const key = env.aiKey();

  // A lane retries one provider until it gets an acceptable answer or runs out of attempts.
  const lane = async (call: Call, startAfter: number, backoff: number[]) => {
    await wait(startAfter, ctrl.signal);
    let lastErr: unknown;
    for (let i = 0; i <= backoff.length; i++) {
      try {
        const t = clean(await call(messages, max, temp, ctrl.signal));
        if (t && (!opts.accept || opts.accept(t))) return t;
        lastErr = new Error('unusable reply');
      } catch (e) {
        if (ctrl.signal.aborted) throw e;
        lastErr = e;
      }
      if (i < backoff.length) await wait(backoff[i], ctrl.signal);
    }
    throw lastErr;
  };

  const lanes = key
    ? [lane(openrouter(key), 0, [300, 900, 1500]), lane(pollinations, 5_000, [2_000])]
    : [lane(pollinations, 0, [1_500, 3_000])];
  try {
    return await Promise.any(lanes);
  } catch {
    return null;
  } finally {
    clearTimeout(deadline);
    ctrl.abort(new Error('settled'));
  }
}
