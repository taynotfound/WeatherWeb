// Same-origin proxy for RainViewer radar tiles: WebGL maps need CORS headers, which RainViewer's tile
// cache doesn't send. Frame ids are immutable, so tiles cache hard at the CDN and are shared by everyone,
// which also keeps us well under RainViewer's per-IP rate limit. Only the exact tile shape is accepted.
import { NextRequest } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ tile: string[] }> }) {
  const parts = (await params).tile;
  const ok = parts.length === 4 && /^[0-9a-f]{6,32}$/.test(parts[0]) && parts.slice(1).every(p => /^\d{1,4}(\.png)?$/.test(p));
  const [id, z, x, y] = ok ? [parts[0], +parts[1], +parts[2], parseInt(parts[3], 10)] : [];
  if (!ok || z! > 7 || x! >= 2 ** z! || y! >= 2 ** z!) return new Response('bad tile', { status: 400 });
  const r = await fetch(`https://tilecache.rainviewer.com/v2/radar/${id}/256/${z}/${x}/${y}/2/1_1.png`, { signal: AbortSignal.timeout(8000) }).catch(() => null);
  if (!r?.ok) return new Response(null, { status: r?.status === 404 ? 404 : 502, headers: { 'Cache-Control': 'no-store' } });
  return new Response(r.body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
