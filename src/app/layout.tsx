import type { Metadata, Viewport } from 'next';
import { Inter, Funnel_Display, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { UnitsProvider } from '@/lib/units';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const funnel = Funnel_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

const SITE = 'https://upload-dot-head-expo.trycloudflare.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Tomato — weather, with attitude',
    template: '%s · Tomato',
  },
  description:
    'Fast, beautiful weather: hourly forecast, rain nowcast, multi-layer radar, air quality, severe-weather warnings, and a sassy tomato that tells you what to wear.',
  applicationName: 'Tomato',
  keywords: [
    'weather', 'forecast', 'rain radar', 'air quality', 'AQI',
    'severe weather warnings', 'thunderstorm', 'Open-Meteo',
    'Met.no', 'RainViewer', 'weather PWA', 'Tomato weather',
  ],
  authors: [{ name: 'Tay', url: 'https://taymaerz.de' }],
  creator: 'Tay',
  publisher: 'Tomato',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Tomato' },
  icons: {
    icon: [
      { url: '/tomato.svg', type: 'image/svg+xml' },
      { url: '/tomato.svg', sizes: 'any' },
    ],
    apple: '/tomato.svg',
  },
  openGraph: {
    type: 'website',
    siteName: 'Tomato',
    title: 'Tomato — weather, with attitude',
    description:
      'Hourly forecast, rain nowcast, radar, air quality and severe-weather alerts. With a sassy tomato.',
    url: SITE,
    images: [{ url: '/og.svg', width: 1200, height: 630, alt: 'Tomato weather' }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tomato — weather, with attitude',
    description: 'Forecast, radar, AQI and severe-weather alerts. With a sassy tomato.',
    images: ['/og.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  category: 'weather',
};

export const viewport: Viewport = {
  themeColor: '#1a1625',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Tomato',
  description: 'Weather forecast, radar, air quality and severe-weather alerts.',
  url: SITE,
  applicationCategory: 'WeatherApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  creator: { '@type': 'Person', name: 'Tay' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${funnel.variable} ${mono.variable}`}>
      <head>
        <link rel="canonical" href={SITE} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <UnitsProvider>{children}</UnitsProvider>
      </body>
    </html>
  );
}
