import type { Metadata } from 'next';
import App from '@/components/App';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

// Shared links (?lat=&lon=&name=) get a link preview with that place's live weather.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = await searchParams;
  const lat = parseFloat(one(p.lat)), lon = parseFloat(one(p.lon));
  if (!isFinite(lat) || !isFinite(lon)) return {};
  const name = one(p.name).slice(0, 60);
  const og = `/api/og?${new URLSearchParams({ lat: lat.toFixed(3), lon: lon.toFixed(3), name, u: one(p.u) === 'f' ? 'f' : 'c' })}`;
  const title = name ? `Weather in ${name}` : 'Weather here';
  const description = `Live weather${name ? ` for ${name}` : ''}, with commentary from Tomato the red rabbit.`;
  return {
    title,
    description,
    openGraph: { type: 'website', siteName: 'Tomato', title: `${title} · Tomato`, description, images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title: `${title} · Tomato`, images: [og] },
  };
}

export default function Page() {
  return <App />;
}
