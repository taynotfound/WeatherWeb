// Per-tab cache for Tomato's take, so switching tabs doesn't refetch (and burn the free AI quota).
// The share sheet reads it too.
export type Take = { insights: string[]; live: boolean; at: number };

const TTL = 45 * 60_000;
export const takeKey = (w: any, unit: string, attitude: string) =>
  `tomato-take:${w?.location?.latitude?.toFixed(1)},${w?.location?.longitude?.toFixed(1)},${unit},${attitude}`;

export function readTake(key: string): Take | null {
  try {
    const t: Take = JSON.parse(sessionStorage.getItem(key) || 'null');
    // offline lines are only kept briefly, so the next visit tries the LLM again
    return t && Date.now() - t.at < (t.live ? TTL : 3 * 60_000) ? t : null;
  } catch { return null; }
}
export function writeTake(key: string, t: Take) {
  try { sessionStorage.setItem(key, JSON.stringify(t)); } catch {}
}
