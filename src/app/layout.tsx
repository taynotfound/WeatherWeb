import type { Metadata, Viewport } from 'next';
import { Inter, Funnel_Display, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { UnitsProvider } from '@/lib/units';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const funnel = Funnel_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tomato — weather, with attitude.',
  description: 'A weather app with a tomato who has opinions about what you should wear.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tomato',
  },
  icons: {
    icon: '/tomato.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a1625',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${funnel.variable} ${mono.variable}`}>
      <body>
        <UnitsProvider>{children}</UnitsProvider>
      </body>
    </html>
  );
}
