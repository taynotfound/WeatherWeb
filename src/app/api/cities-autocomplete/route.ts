import { NextRequest, NextResponse } from 'next/server';

const GEODB_API = 'http://geodb-cities-api.wirefreethought.com/v1/geo/cities';
const GEOAPIFY_API = 'https://api.geoapify.com/v1/geocode/autocomplete';
const GEOAPIFY_KEY = 'd4bc8ca6cc6b44019dd354556615aa23';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');
  if (!query || query.length < 2) {
    return NextResponse.json({ data: [] });
  }

  // GeoDB fetch
  const geoDbPromise = fetch(
    `${GEODB_API}?namePrefix=${encodeURIComponent(query)}&limit=8&offset=0&sort=-population`
  )
    .then(res => res.json())
    .then(data =>
      (data.data || []).map((city: any) => ({
        city: city.name,
        country: city.country,
        countryCode: city.countryCode,
        lat: city.latitude,
        lon: city.longitude,
        source: 'GeoDB',
      }))
    )
    .catch(() => []);

  // Geoapify fetch
  const geoapifyPromise = fetch(
    `${GEOAPIFY_API}?text=${encodeURIComponent(query)}&type=city&limit=8&apiKey=${GEOAPIFY_KEY}`
  )
    .then(res => res.json())
    .then(data =>
      (data.features || []).map((feature: any) => ({
        city: feature.properties.city || feature.properties.name,
        country: feature.properties.country,
        countryCode: feature.properties.country_code?.toUpperCase(),
        lat: feature.properties.lat,
        lon: feature.properties.lon,
        source: 'Geoapify',
      }))
    )
    .catch(() => []);

  // Wait for both
  const [geoDbResults, geoapifyResults] = await Promise.all([geoDbPromise, geoapifyPromise]);

  // Merge and deduplicate by city+country
  const seen = new Set();
  const merged = [...geoDbResults, ...geoapifyResults].filter(s => {
    const key = `${s.city},${s.countryCode}`;
    if (seen.has(key) || !s.city || !s.countryCode) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({ data: merged });
} 