// Live satellite frames from EUMETSAT's public WMS (keyless, CORS-enabled).
// Meteosat (0°) covers Europe, Africa and the Atlantic every 15 min; elsewhere we fall back to
// the 3-hourly global geostationary ring. Both are IR 10.8 µm, so clouds show day and night.
import { NextRequest, NextResponse } from 'next/server';

const WMS = 'https://view.eumetsat.int/geoserver/wms';
const SRC = {
  msg: { layer: 'msg_fes:ir108', caps: 'msg_fes/ir108', name: 'Meteosat', frames: 12 },
  ring: { layer: 'mumi:worldcloudmap_ir108', caps: 'mumi/worldcloudmap_ir108', name: 'Geostationary ring', frames: 8 },
} as const;

// "…/2026-10-11T19:00:00.000Z/PT15M" -> latest time + step
async function latest(caps: string) {
  const r = await fetch(`https://view.eumetsat.int/geoserver/${caps}/ows?service=WMS&request=GetCapabilities&version=1.3.0`,
    { signal: AbortSignal.timeout(8000), next: { revalidate: 300 } });
  if (!r.ok) throw new Error(`eumetsat ${r.status}`);
  const m = (await r.text()).match(/<Dimension name="time"[^>]*>[^<]*\/([0-9T:.\-]+Z)\/PT(\d+)([MH])<\/Dimension>/);
  if (!m) throw new Error('no time dimension');
  return { end: Date.parse(m[1]), stepMs: +m[2] * (m[3] === 'H' ? 3600_000 : 60_000) };
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const lat = parseFloat(sp.get('lat') || ''), lon = parseFloat(sp.get('lon') || '');
  const inDisk = isFinite(lat) && isFinite(lon) && Math.abs(lon) <= 60 && Math.abs(lat) <= 68;
  const order = inDisk ? (['msg', 'ring'] as const) : (['ring'] as const);
  for (const id of order) {
    try {
      const s = SRC[id];
      const { end, stepMs } = await latest(s.caps);
      const frames = Array.from({ length: s.frames }, (_, i) => end - (s.frames - 1 - i) * stepMs);
      return NextResponse.json(
        { id, name: s.name, wms: WMS, layer: s.layer, frames },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
      );
    } catch {}
  }
  return NextResponse.json({ error: 'satellite unavailable' }, { status: 502 });
}
