import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544', {
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error('upstream error');
    const j = await res.json();
    return NextResponse.json({
      lat: j.latitude,
      lon: j.longitude,
      altitude: j.altitude,
      velocity: j.velocity,
    });
  } catch {
    // fallback to open-notify
    try {
      const r2 = await fetch('https://api.open-notify.org/iss-now.json');
      const j2 = await r2.json();
      return NextResponse.json({
        lat: parseFloat(j2.iss_position.latitude),
        lon: parseFloat(j2.iss_position.longitude),
        altitude: null,
        velocity: null,
      });
    } catch {
      return NextResponse.json({ error: 'ISS unavailable' }, { status: 502 });
    }
  }
}
