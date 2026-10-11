import type { Metadata, Viewport } from 'next';
import { Roboto_Flex, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { PrefsProvider } from '@/lib/prefs';
import { ThemeProvider } from '@/lib/theme';

const flex = Roboto_Flex({ subsets: ['latin'], variable: '--font-roboto-flex', display: 'swap' });
const mono = Roboto_Mono({ subsets: ['latin'], variable: '--font-roboto-mono', display: 'swap' });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://tomato.taymaerz.de';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'Tomato — weather, with attitude', template: '%s · Tomato' },
  description: 'Weather from six independent sources, live radar, air quality, alerts and a sassy tomato that tells you what to wear.',
  applicationName: 'Tomato',
  keywords: ['weather', 'forecast', 'rain radar', 'air quality', 'severe weather warnings', 'Open-Meteo', 'MET Norway', 'WeatherAPI', 'weather PWA'],
  authors: [{ name: 'Tay', url: 'https://taymaerz.de' }],
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Tomato' },
  icons: { icon: [{ url: '/tomato.svg', type: 'image/svg+xml' }], apple: '/tomato.svg' },
  openGraph: { type: 'website', siteName: 'Tomato', title: 'Tomato — weather, with attitude', description: 'Six sources, live radar, air quality and a sassy tomato.', images: [{ url: '/api/og', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title: 'Tomato — weather, with attitude', images: ['/api/og'] },
  robots: { index: true, follow: true },
  category: 'weather',
};

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f8f9ff' }, { media: '(prefers-color-scheme: dark)', color: '#101418' }],
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
};

// Set data-theme before first paint so there is no light/dark flash.
const themeInit = `try{var m=localStorage.getItem('tomato-theme')||'auto';var d=m==='dark'||(m==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${flex.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Material Symbols (variable icon font) */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" />
      </head>
      <body>
        <ThemeProvider><PrefsProvider>{children}</PrefsProvider></ThemeProvider>
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('/sw.js').catch(function(){})}` }} />
      </body>
    </html>
  );
}
