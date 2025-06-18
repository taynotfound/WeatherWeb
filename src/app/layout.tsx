import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { FavoritesProvider } from "@/components/FavoritesContext";
import WeatherProvider from "@/components/WeatherProvider";
import Footer from '@/components/Footer';
import { ThemeProvider } from '@/context/ThemeContext';


const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "WeatherWeb - Your AI-powered weather companion",
  description: "Get accurate weather forecasts and AI-powered recommendations for your location.",
  manifest: '/manifest.json',
  icons: {
    icon: '/tomato.svg',
    apple: '/tomato.svg',
  },
  themeColor: '#0f172a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WeatherWeb',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/tomato.svg" />
        <link rel="apple-touch-icon" href="/tomato.svg" />
        <meta name="theme-color" content="#0f172a" />
        <Script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4" strategy="afterInteractive" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <WeatherProvider>
            <FavoritesProvider>
              <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-950">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
                <div className="relative">
                  {children}
                </div>
              </div>
            </FavoritesProvider>
          </WeatherProvider>
        </ThemeProvider>
        <Footer />
      </body>
    </html>
  );
}
